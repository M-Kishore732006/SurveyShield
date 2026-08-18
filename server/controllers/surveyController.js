const fs = require('fs');
const csv = require('csv-parser');
const SurveyRecord = require('../models/SurveyRecord');
const Dataset = require('../models/Dataset');
const Village = require('../models/Village');
const axios = require('axios');

// Helper to run Rule-Based Validation
const runRuleValidation = (data) => {
  let score = 100;
  let messages = [];

  const age = parseInt(data.age);
  const income = parseFloat(data.income);
  const hoursWorked = parseFloat(data.hours_worked);
  const householdSize = parseInt(data.household_size);

  if (isNaN(age) || age < 0 || age > 120) {
    score -= 30;
    messages.push('Age out of normal bounds (0-120)');
  }
  if (isNaN(income) || income < 0) {
    score -= 20;
    messages.push('Income cannot be negative');
  }
  if (isNaN(hoursWorked) || hoursWorked < 0 || hoursWorked > 168) {
    score -= 20;
    messages.push('Hours worked out of bounds (0-168)');
  }
  if (isNaN(householdSize) || householdSize <= 0) {
    score -= 20;
    messages.push('Household size must be > 0');
  }
  
  if (data.employment_status && data.employment_status.toLowerCase() === 'unemployed' && hoursWorked > 0) {
    score -= 25;
    messages.push('Unemployed individual reports working hours');
  }

  // Validate survey date correctness
  const dateStr = String(data.survey_date || '');
  let isDateValid = true;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    isDateValid = false;
  } else {
    // Check for DD-MM-YYYY format
    const match = dateStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        isDateValid = false;
      }
    } else {
      // Check for YYYY-MM-DD format
      const matchY = dateStr.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
      if (matchY) {
        const year = parseInt(matchY[1], 10);
        const month = parseInt(matchY[2], 10);
        const day = parseInt(matchY[3], 10);
        if (month < 1 || month > 12 || day < 1 || day > 31) {
          isDateValid = false;
        }
      }
    }
  }

  if (!isDateValid) {
    score -= 25;
    messages.push('Invalid survey date');
  }

  score = Math.max(0, score); 
  return { score, messages };
};

exports.uploadSurveyData = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const newDataset = new Dataset({
      fileName: req.file.originalname,
      enumeratorId: req.user.id,
      processingStatus: 'Processing'
    });
    await newDataset.save();

    // Fetch villages to map villageId string (e.g. V1001) to ObjectId
    const allVillages = await Village.find({}, '_id villageId');
    const villageMap = new Map();
    allVillages.forEach(v => {
      villageMap.set(v.villageId, v._id);
      villageMap.set(v._id.toString(), v._id);
    });
    const fallbackVillageId = allVillages.length > 0 ? allVillages[0]._id : null;

    const results = [];
    const standardFields = ['household_id', 'survey_id', 'village_id', 'district', 'age', 'gender', 'education', 'occupation', 'employment_status', 'income', 'hours_worked', 'household_size', 'interview_duration', 'survey_date', 'enumerator_id'];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        let valid = 0;
        let warnings = 0;
        let critical = 0;
        let uniqueVillages = new Set();

        // 1. Prepare batch for ML
        const mlBatch = results.map(row => {
          const dynamicData = {};
          Object.keys(row).forEach(key => {
            if (!standardFields.includes(key)) {
              dynamicData[key] = row[key];
            }
          });
          
          return {
            ...dynamicData,
            age: parseFloat(row.age) || 0,
            income: parseFloat(row.income) || 0,
            hours_worked: parseFloat(row.hours_worked) || 0,
            household_size: parseFloat(row.household_size) || 1,
            gender: row.gender || 'Unknown',
            education: row.education || 'Unknown',
            occupation: row.occupation || 'Unknown',
            employment_status: row.employment_status || 'Unknown'
          };
        });

        // 2. Call ML Service (Batch)
        let mlResults = [];
        try {
          const mlRes = await axios.post(`${process.env.ML_SERVICE_URL}/ml/predict`, {
            records: mlBatch
          });
          mlResults = mlRes.data.results;
        } catch (err) {
          console.error("ML Service Batch Error:", err.message);
          // Fallback if ML service is down
          mlResults = mlBatch.map(() => ({
            isAnomaly: false,
            anomalyScore: 0,
            severity: "LOW",
            reasons: [],
            modelVersion: "unknown"
          }));
        }

        // 3. Process each record and save
        const savedRecords = [];
        for (let i = 0; i < results.length; i++) {
          const row = results[i];
          const mlResult = mlResults[i];
          const { score: ruleScore, messages } = runRuleValidation(row);

          const ruleRisk = 100 - ruleScore;
          // Heavily weight ML score if it's high, otherwise combine
          const combinedRiskScore = (mlResult.anomalyScore * 0.7) + (ruleRisk * 0.3);

          let recordRiskLevel = 'Normal';
          let validationStatus = 'Validated';
          
          let flagReason = messages.join('; ');
          if (mlResult.isAnomaly) {
             flagReason += (flagReason ? '; ' : '') + 'ML Anomaly Detected';
          }

          if (mlResult.severity === 'HIGH' || combinedRiskScore >= 80) {
            recordRiskLevel = 'High Risk';
            validationStatus = 'Flagged';
            critical++;
          } else if (mlResult.severity === 'MEDIUM' || combinedRiskScore >= 60) {
            recordRiskLevel = 'Medium Risk';
            validationStatus = 'Flagged';
            warnings++;
          } else {
            if (combinedRiskScore >= 30) {
              recordRiskLevel = 'Low Risk';
            }
            valid++;
          }

          if (row.village_id) {
            uniqueVillages.add(row.village_id);
          }

          // Extract dynamic fields
          const dynamicData = {};
          Object.keys(row).forEach(key => {
            if (!standardFields.includes(key)) {
              dynamicData[key] = row[key];
            }
          });

          const newRecord = new SurveyRecord({
            household_id: row.household_id || 'UNKNOWN',
            survey_id: row.survey_id || 'UNKNOWN',
            uploadId: newDataset._id,
            enumerator_id: req.user.id,
            village_id: req.user.villageId || villageMap.get(row.village_id) || fallbackVillageId,
            district: row.district,
            age: row.age,
            gender: row.gender,
            education: row.education,
            occupation: row.occupation,
            employment_status: row.employment_status,
            income: row.income,
            hours_worked: row.hours_worked,
            household_size: row.household_size,
            interview_duration: row.interview_duration,
            survey_date: row.survey_date || new Date(),
            dynamicData: dynamicData,
            
            validationStatus,
            ruleValidationScore: ruleScore,
            ruleMessages: messages,
            
            isolationForestScore: mlResult.anomalyScore,
            lofScore: 0, // Deprecated in new pipeline
            anomalyReasons: mlResult.reasons,
            modelVersion: mlResult.modelVersion,
            analyzedAt: new Date(),
            
            combinedRiskScore,
            riskLevel: recordRiskLevel,
            flagReason
          });
          
          savedRecords.push(newRecord);
        }

        // Bulk insert for speed
        if (savedRecords.length > 0) {
           await SurveyRecord.insertMany(savedRecords);
        }

        // Update Dataset
        newDataset.processingStatus = 'Completed';
        newDataset.numberOfRecords = results.length;
        newDataset.villages = Array.from(uniqueVillages);
        newDataset.anomalyStats = { valid, warnings, critical };
        await newDataset.save();

        fs.unlinkSync(req.file.path);
      });

      // Send response immediately while processing continues in background
      res.json({
        message: 'Upload started successfully',
        uploadId: newDataset._id
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSurveys = async (req, res) => {
  try {
    const query = req.user.role === 'enumerator' ? { enumerator_id: req.user.id } : {};
    const records = await SurveyRecord.find(query)
      .populate('enumerator_id', 'name')
      .populate('village_id', 'name district')
      .limit(100)
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUploads = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'enumerator') {
      query.enumeratorId = req.user.id;
    } else if (req.query.enumeratorId) {
      query.enumeratorId = req.query.enumeratorId;
    }
    const uploads = await Dataset.find(query)
      .populate('enumeratorId', 'name email')
      .sort({ uploadDate: -1 });
    res.json(uploads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUploadDetails = async (req, res) => {
  try {
    const upload = await Dataset.findById(req.params.uploadId).populate('enumeratorId', 'name email');
    if (!upload) return res.status(404).json({ message: 'Dataset not found' });
    
    // Auth check
    if (req.user.role === 'enumerator' && upload.enumeratorId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access to dataset' });
    }
    
    res.json(upload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUploadRecords = async (req, res) => {
  try {
    const { uploadId } = req.params;
    const { page = 1, limit = 10, search, riskLevel } = req.query;
    
    const query = { uploadId };
    
    if (search) {
      query.household_id = { $regex: search, $options: 'i' };
    }
    if (riskLevel && riskLevel !== 'All') {
      query.riskLevel = riskLevel;
    }

    const records = await SurveyRecord.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
      
    const total = await SurveyRecord.countDocuments(query);

    res.json({
      records,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUpload = async (req, res) => {
  try {
    const { uploadId } = req.params;
    const upload = await Dataset.findById(uploadId);
    
    if (!upload) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    // Check authorization (must be the owner enumerator or an admin)
    if (req.user.role === 'enumerator' && upload.enumeratorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized: You can only delete your own datasets' });
    }

    // Delete all survey records belonging to this dataset/upload
    await SurveyRecord.deleteMany({ uploadId: uploadId });

    // Delete the dataset metadata entry
    await Dataset.findByIdAndDelete(uploadId);

    res.json({ message: 'Dataset and all its associated survey records successfully deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
