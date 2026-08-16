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
    const newVillage = new Village(req.body);
    await newVillage.save();
    res.status(201).json(newVillage);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getVillages = async (req, res) => {
  try {
    const villages = await Village.find().populate('enumerators', 'name email');
    res.json(villages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createEnumerator = async (req, res) => {
  try {
    const { name, email, password, phone, state, district, villageId } = req.body;
    
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
      await Village.findByIdAndUpdate(villageId, { $push: { enumerators: newUser._id } });
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
