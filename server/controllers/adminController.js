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

    // Check if village ID already exists
    const existingVillage = await Village.findOne({ villageId });
    if (existingVillage) {
      return res.status(400).json({ error: 'Village ID already exists' });
    }

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
    const SurveyRecord = require('../models/SurveyRecord');
    const enumerators = await User.find({ role: 'enumerator' }).populate('villageId', 'name district').lean();
    
    const result = await Promise.all(enumerators.map(async (enumUser) => {
       const recordCount = await SurveyRecord.countDocuments({ enumerator_id: enumUser._id });
       return { ...enumUser, recordCount };
    }));
    
    res.json(result);
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
         age: parseFloat(r.age) || 0,
         income: parseFloat(r.income) || 0,
         hours_worked: parseFloat(r.hours_worked) || 0,
         household_size: parseFloat(r.household_size) || 1,
         gender: r.gender || 'Unknown',
         education: r.education || 'Unknown',
         occupation: r.occupation || 'Unknown',
         employment_status: r.employment_status || 'Unknown'
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

exports.getReportData = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const SurveyRecord = require('../models/SurveyRecord');
    const { filterType, filterId } = req.query;

    if (!filterType || !filterId) {
      return res.status(400).json({ message: 'filterType and filterId are required' });
    }

    let matchQuery = {};
    if (filterType === 'village') {
      matchQuery.village_id = new mongoose.Types.ObjectId(filterId);
    } else if (filterType === 'enumerator') {
      matchQuery.enumerator_id = new mongoose.Types.ObjectId(filterId);
    } else {
      return res.status(400).json({ message: 'Invalid filterType. Must be village or enumerator' });
    }

    // Retrieve records matching filter
    const records = await SurveyRecord.find(matchQuery)
      .populate('enumerator_id', 'name email')
      .populate('village_id', 'name villageId district state')
      .sort({ createdAt: -1 });

    // Calculate aggregations/metrics manually for robustness
    let totalRecords = records.length;
    let normalCount = 0;
    let lowRiskCount = 0;
    let mediumRiskCount = 0;
    let highRiskCount = 0;

    let totalAge = 0, ageCount = 0;
    let totalIncome = 0, incomeCount = 0;
    let totalHours = 0, hoursCount = 0;

    records.forEach(r => {
      // Risk level counts
      if (r.riskLevel === 'High Risk') highRiskCount++;
      else if (r.riskLevel === 'Medium Risk') mediumRiskCount++;
      else if (r.riskLevel === 'Low Risk') lowRiskCount++;
      else normalCount++;

      // Averages parsing
      const ageVal = parseInt(r.age);
      if (!isNaN(ageVal)) {
        totalAge += ageVal;
        ageCount++;
      }

      const incomeVal = parseFloat(r.income);
      if (!isNaN(incomeVal)) {
        totalIncome += incomeVal;
        incomeCount++;
      }

      const hoursVal = parseFloat(r.hours_worked);
      if (!isNaN(hoursVal)) {
        totalHours += hoursVal;
        hoursCount++;
      }
    });

    const averageAge = ageCount > 0 ? parseFloat((totalAge / ageCount).toFixed(1)) : 0;
    const averageIncome = incomeCount > 0 ? parseFloat((totalIncome / incomeCount).toFixed(2)) : 0;
    const averageHoursWorked = hoursCount > 0 ? parseFloat((totalHours / hoursCount).toFixed(1)) : 0;

    res.json({
      summary: {
        totalRecords,
        normalCount,
        lowRiskCount,
        mediumRiskCount,
        highRiskCount,
        averageAge,
        averageIncome,
        averageHoursWorked
      },
      records
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReportTargets = async (req, res) => {
  try {
    const SurveyRecord = require('../models/SurveyRecord');
    const activeVillageIds = await SurveyRecord.distinct('village_id');
    const activeEnumeratorIds = await SurveyRecord.distinct('enumerator_id');

    const villages = await Village.find({ _id: { $in: activeVillageIds } }).populate('enumerator', 'name email');
    const enumerators = await User.find({ _id: { $in: activeEnumeratorIds }, role: 'enumerator' }).populate('villageId', 'name district');

    res.json({ villages, enumerators });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStatisticsTrends = async (req, res) => {
  try {
    const SurveyRecord = require('../models/SurveyRecord');
    const { district } = req.query;

    const query = {};
    if (district) {
      query.district = district;
    }

    const records = await SurveyRecord.find(query).lean();
    const districts = await SurveyRecord.distinct('district');
    
    const yearlyGroups = {};

    records.forEach(r => {
      let year = null;
      if (r.survey_date) {
        const dateStr = String(r.survey_date);
        const matchYear = dateStr.match(/\d{4}/);
        if (matchYear) {
          year = parseInt(matchYear[0]);
        }
      }
      if (!year || isNaN(year) || year < 1900 || year > 2100) {
        year = new Date(r.createdAt).getFullYear();
      }

      if (!yearlyGroups[year]) {
        yearlyGroups[year] = {
          year,
          totalRecords: 0,
          incomes: [],
          hours: [],
          householdSizes: [],
          education: {},
          employment: {}
        };
      }

      const group = yearlyGroups[year];
      group.totalRecords += 1;

      // Income parsing
      const incomeVal = parseFloat(r.income);
      if (!isNaN(incomeVal) && incomeVal >= 0 && incomeVal < 10000000) {
        group.incomes.push(incomeVal);
      }

      // Hours worked parsing
      const hoursVal = parseFloat(r.hours_worked);
      if (!isNaN(hoursVal) && hoursVal >= 0 && hoursVal <= 168) {
        group.hours.push(hoursVal);
      }

      // Household size parsing
      const hhSizeVal = parseInt(r.household_size);
      if (!isNaN(hhSizeVal) && hhSizeVal > 0) {
        group.householdSizes.push(hhSizeVal);
      }

      // Education counting
      const rawEdu = r.education || '8th';
      const mapEducation = (eduVal) => {
        const e = String(eduVal).trim().toLowerCase();
        if (e === 'primary' || e === '8th' || e === '8') return '8th';
        if (e === 'secondary' || e === '10th' || e === '10') return '10th';
        if (e === 'higher' || e === '12th' || e === '12' || e === 'higher secondary') return '12th';
        if (e === 'none') return '8th';
        if (e === 'ug' || e === 'undergraduate' || e.includes('under')) return 'UG';
        if (e === 'pg' || e === 'postgraduate' || e.includes('post')) return 'PG';
        if (e === 'phd' || e === 'doctorate' || e.includes('phd')) return 'PhD';
        return eduVal;
      };
      const edu = mapEducation(rawEdu);
      group.education[edu] = (group.education[edu] || 0) + 1;

      // Employment counting
      const emp = r.employment_status || 'Unknown';
      group.employment[emp] = (group.employment[emp] || 0) + 1;
    });

    const trends = Object.keys(yearlyGroups).map(y => {
      const g = yearlyGroups[y];
      const avgIncome = g.incomes.length > 0 ? parseFloat((g.incomes.reduce((a, b) => a + b, 0) / g.incomes.length).toFixed(2)) : 0;
      const avgHours = g.hours.length > 0 ? parseFloat((g.hours.reduce((a, b) => a + b, 0) / g.hours.length).toFixed(1)) : 0;
      const avgSize = g.householdSizes.length > 0 ? parseFloat((g.householdSizes.reduce((a, b) => a + b, 0) / g.householdSizes.length).toFixed(1)) : 0;

      return {
        year: parseInt(y),
        totalRecords: g.totalRecords,
        averageIncome: avgIncome,
        averageHoursWorked: avgHours,
        averageHouseholdSize: avgSize,
        education: g.education,
        employment: g.employment
      };
    }).sort((a, b) => a.year - b.year);

    res.json({ trends, districts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

