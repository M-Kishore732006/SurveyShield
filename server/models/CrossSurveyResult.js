const mongoose = require('mongoose');

const CrossSurveyResultSchema = new mongoose.Schema({
  currentDatasetId: String,
  historicalDatasetId: String,
  relatedDatasetId: String,
  indicator: String,
  geography: String,
  currentValue: Number,
  historicalValue: Number,
  relatedValue: Number,
  deviation: String,
  statisticalScore: Number,
  crossSurveyScore: Number,
  mlScore: Number,
  overallRisk: Number,
  severity: String,
  explanation: String,
  analyzedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CrossSurveyResult', CrossSurveyResultSchema);
