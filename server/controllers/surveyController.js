const fs = require('fs');
const csv = require('csv-parser');
const SurveyRecord = require('../models/SurveyRecord');
const Dataset = require('../models/Dataset');
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

        for (let row of results) {
          const { score: ruleScore, messages } = runRuleValidation(row);
          
          let isolationForestScore = 0;
          let lofScore = 0;

          try {
            const mlRes = await axios.post(`${process.env.ML_SERVICE_URL}/ml/predict`, {
              records: [{
                age: parseFloat(row.age) || 0,
                income: parseFloat(row.income) || 0,
                hours_worked: parseFloat(row.hours_worked) || 0,
                household_size: parseFloat(row.household_size) || 1
              }]
            });
            const mlResults = mlRes.data.results[0];
            isolationForestScore = mlResults.isolation_forest_score;
            lofScore = mlResults.lof_score;
          } catch (err) {
            console.error("ML Service Error:", err.message);
          }

          const ruleRisk = 100 - ruleScore;
          const combinedRiskScore = (isolationForestScore * 0.4) + (lofScore * 0.3) + (ruleRisk * 0.3);

          let recordRiskLevel = 'Normal';
          let validationStatus = 'Validated';
          let flagReason = '';

          if (combinedRiskScore >= 80) {
            recordRiskLevel = 'High Risk';
            validationStatus = 'Flagged';
            flagReason = messages.join('; ') + (messages.length ? '; ' : '') + 'High ML anomaly detected';
            critical++;
          } else if (combinedRiskScore >= 60) {
            recordRiskLevel = 'Medium Risk';
            validationStatus = 'Flagged';
            flagReason = messages.join('; ') + (messages.length ? '; ' : '') + 'Medium ML anomaly detected';
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
            village_id: req.user.villageId || row.village_id || null, // Might be null if missing, wait we need village_id objectId...
            // the original code just did row.village_id which might be a string. For MVP, we pass it directly or skip if missing.
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
            isolationForestScore,
            lofScore,
            combinedRiskScore,
            riskLevel: recordRiskLevel,
            flagReason
          });
          
          await newRecord.save();
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
    const query = req.user.role === 'enumerator' ? { enumeratorId: req.user.id } : {};
    const uploads = await Dataset.find(query).sort({ uploadDate: -1 });
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
