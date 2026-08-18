const Village = require('../models/Village');
const User = require('../models/User');
const SurveyRecord = require('../models/SurveyRecord');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalEnumerators = await User.countDocuments({ role: 'enumerator' });
    const totalVillages = await Village.countDocuments();
    const totalSurveyRecords = await SurveyRecord.countDocuments();
    const recordsValidated = await SurveyRecord.countDocuments({ validationStatus: { $ne: 'Pending' } });
    const recordsFlagged = await SurveyRecord.countDocuments({ validationStatus: 'Flagged' });
    const highRiskRecords = await SurveyRecord.countDocuments({ riskLevel: 'High Risk' });

    // Mock trend and distributions for now
    res.json({
      totalEnumerators,
      totalVillages,
      totalSurveyRecords,
      recordsValidated,
      recordsFlagged,
      highRiskRecords,
      averageDataQualityScore: 85, // Placeholder
      recentAlerts: [] // Placeholder
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createVillage = async (req, res) => {
  try {
    const { villageId, name, district, state, enumerator } = req.body;

    if (enumerator) {
      const existingUser = await User.findById(enumerator);
      if (existingUser && existingUser.villageId) {
        return res.status(400).json({ error: 'This enumerator is already assigned to another village' });
      }
    }

    const newVillage = new Village({ villageId, name, district, state, enumerator });
    await newVillage.save();

    if (enumerator) {
      await User.findByIdAndUpdate(enumerator, { villageId: newVillage._id });
    }

    res.status(201).json(newVillage);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getVillages = async (req, res) => {
  try {
    const villages = await Village.find().populate('enumerator', 'name email');
    res.json(villages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createEnumerator = async (req, res) => {
  try {
    const { name, email, password, phone, state, district, villageId } = req.body;
    
    if (villageId) {
      const existingVillage = await Village.findById(villageId);
      if (existingVillage && existingVillage.enumerator) {
        return res.status(400).json({ error: 'This village is already assigned to another enumerator' });
      }
    }

    const newUser = new User({
      name,
      email,
      password,
      role: 'enumerator',
      phone,
      state,
      district,
      villageId
    });

    await newUser.save();
    
    if (villageId) {
      await Village.findByIdAndUpdate(villageId, { enumerator: newUser._id });
    }

    res.status(201).json({ message: 'Enumerator created successfully', enumerator: { _id: newUser._id, name: newUser.name }});
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getEnumerators = async (req, res) => {
  try {
    const enumerators = await User.find({ role: 'enumerator' }).populate('villageId', 'name district');
    res.json(enumerators);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteEnumerator = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user || user.role !== 'enumerator') {
      return res.status(404).json({ message: 'Enumerator not found' });
    }

    if (user.villageId) {
      await Village.findByIdAndUpdate(user.villageId, { $unset: { enumerator: "" } });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: 'Enumerator deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFlaggedRecords = async (req, res) => {
  try {
    const records = await SurveyRecord.find({ validationStatus: 'Flagged' })
      .populate('enumerator_id', 'name')
      .populate('village_id', 'name district')
      .sort({ combinedRiskScore: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.reviewRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;
    
    const record = await SurveyRecord.findById(id);
    if (!record) return res.status(404).json({ message: 'Record not found' });

    record.reviewStatus = action;
    record.adminComment = comment;
    record.reviewedBy = req.user.id;
    record.reviewedAt = new Date();
    
    // Also log audit
    const AuditLog = require('../models/AuditLog');
    await new AuditLog({
      action: `Reviewed Record: ${action}`,
      performedBy: req.user.id,
      targetRecordId: record._id,
      details: comment
    }).save();

    await record.save();
    res.json({ message: 'Record updated successfully', record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.trainMLModel = async (req, res) => {
  try {
    const axios = require('axios');
    // Fetch historical data for training (e.g. up to 10,000 normal/validated records)
    const records = await SurveyRecord.find({ validationStatus: { $ne: 'Flagged' } })
      .limit(10000)
      .lean();
      
    if (records.length < 5) {
      return res.status(400).json({ message: 'Not enough historical data to train the model. Need at least 5 validated records.' });
    }
    
    // Map to a clean JSON array
    const trainingData = records.map(r => {
       const dynamicFields = r.dynamicData || {};
       return {
         ...dynamicFields,
         age: r.age,
         income: r.income,
         hours_worked: r.hours_worked,
         household_size: r.household_size,
         gender: r.gender,
         education: r.education,
         occupation: r.occupation,
         employment_status: r.employment_status
       };
    });
    
    // Trigger Python ML Service
    const mlRes = await axios.post(`${process.env.ML_SERVICE_URL}/ml/train`, {
      records: trainingData
    });
    
    // Optionally save the model metadata to our DB if we want a ModelRegistry collection, 
    // but returning it to the admin is enough for now.
    res.json({
      message: 'Machine Learning Model retrained successfully!',
      metadata: mlRes.data.metadata
    });
    
  } catch (err) {
    console.error("Training Error:", err.message);
    res.status(500).json({ error: 'Failed to train ML model: ' + (err.response?.data?.detail || err.message) });
  }
};
