const mongoose = require('mongoose');

const surveyRecordSchema = new mongoose.Schema({
  household_id: { type: String, required: true },
  survey_id: { type: String, required: true },
  uploadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dataset', required: true },
  enumerator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  village_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Village', required: true },
  district: { type: String },
  age: { type: mongoose.Schema.Types.Mixed },
  gender: { type: String },
  education: { type: String },
  occupation: { type: String },
  employment_status: { type: String },
  income: { type: mongoose.Schema.Types.Mixed },
  hours_worked: { type: mongoose.Schema.Types.Mixed },
  household_size: { type: mongoose.Schema.Types.Mixed },
  interview_duration: { type: mongoose.Schema.Types.Mixed }, // in minutes
  survey_date: { type: mongoose.Schema.Types.Mixed, required: true },

  // Dynamic Fields (any CSV headers not matched above)
  dynamicData: { type: Map, of: mongoose.Schema.Types.Mixed },

  // Validation results
  validationStatus: { type: String, enum: ['Pending', 'Validated', 'Flagged'], default: 'Pending' },
  
  // Rule-based validation score
  ruleValidationScore: { type: Number, default: 0 },
  ruleMessages: [{ type: String }],
  
  // ML scores and explanations
  isolationForestScore: { type: Number },
  lofScore: { type: Number },
  anomalyReasons: [{ type: String }],
  modelVersion: { type: String },
  analyzedAt: { type: Date },
  
  // Combined Risk
  combinedRiskScore: { type: Number }, // 0 - 100
  riskLevel: { type: String, enum: ['Normal', 'Low Risk', 'Medium Risk', 'High Risk'] },
  flagReason: { type: String },
  
  // Admin Review
  reviewStatus: { type: String, enum: ['Pending', 'Approved', 'Confirmed Anomaly', 'Re-verification Requested'], default: 'Pending' },
  adminComment: { type: String },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date }

}, { timestamps: true });

// Indexes for querying flagged records easily
surveyRecordSchema.index({ enumerator_id: 1 });
surveyRecordSchema.index({ uploadId: 1 });
surveyRecordSchema.index({ village_id: 1 });
surveyRecordSchema.index({ riskLevel: 1 });
surveyRecordSchema.index({ survey_date: 1 });

module.exports = mongoose.model('SurveyRecord', surveyRecordSchema);
