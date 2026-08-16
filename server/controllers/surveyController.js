const fs = require('fs');
const csv = require('csv-parser');
const SurveyRecord = require('../models/SurveyRecord');
const axios = require('axios'); // for ML service calls later

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
  
  // Logical consistency
  if (data.employment_status && data.employment_status.toLowerCase() === 'unemployed' && hoursWorked > 0) {
    score -= 25;
    messages.push('Unemployed individual reports working hours');
  }

  score = Math.max(0, score); // cap at 0
  
  return { score, messages };
};

exports.uploadSurveyData = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const results = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      let processed = 0;
      let flagged = 0;
      let highRisk = 0;

      for (let row of results) {
        // Run rule-based validation
        const { score: ruleScore, messages } = runRuleValidation(row);
        
        let isolationForestScore = 0;
        let lofScore = 0;

        try {
          // Call ML Service for prediction
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

        // Calculate Combined Risk Score (e.g., 40% IF, 30% LOF, 30% Rule-based)
        // Note: Rule score is 100=good, 0=bad. ML scores are 100=anomalous, 0=normal.
        // Let's invert rule score so 100=anomalous for combination
        const ruleRisk = 100 - ruleScore;
        const combinedRiskScore = (isolationForestScore * 0.4) + (lofScore * 0.3) + (ruleRisk * 0.3);

        let recordRiskLevel = 'Normal';
        let validationStatus = 'Validated';
        let flagReason = '';

        if (combinedRiskScore >= 80) {
          recordRiskLevel = 'High Risk';
          validationStatus = 'Flagged';
          flagReason = messages.join('; ') + (messages.length ? '; ' : '') + 'High ML anomaly detected';
          highRisk++;
          flagged++;
        } else if (combinedRiskScore >= 60) {
          recordRiskLevel = 'Medium Risk';
          validationStatus = 'Flagged';
          flagReason = messages.join('; ') + (messages.length ? '; ' : '') + 'Medium ML anomaly detected';
          flagged++;
        } else if (combinedRiskScore >= 30) {
          recordRiskLevel = 'Low Risk';
        }

        const newRecord = new SurveyRecord({
          household_id: row.household_id,
          survey_id: row.survey_id,
          enumerator_id: req.user.id,
          village_id: req.user.villageId || row.village_id,
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
        processed++;
      }

      // Cleanup uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        message: 'Upload complete',
        totalReceived: results.length,
        processed,
        flagged,
        highRisk
      });
    });
};

exports.getSurveys = async (req, res) => {
  try {
    const query = req.user.role === 'enumerator' ? { enumerator_id: req.user.id } : {};
    const records = await SurveyRecord.find(query)
      .populate('enumerator_id', 'name')
      .populate('village_id', 'name district')
      .limit(100) // pagination should be added
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
