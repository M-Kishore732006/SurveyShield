const mongoose = require('mongoose');

const datasetSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  enumeratorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadDate: { type: Date, default: Date.now },
  numberOfRecords: { type: Number, default: 0 },
  villages: [{ type: String }],
  processingStatus: { type: String, enum: ['Processing', 'Completed', 'Failed'], default: 'Processing' },
  anomalyStats: {
    valid: { type: Number, default: 0 },
    warnings: { type: Number, default: 0 },
    critical: { type: Number, default: 0 }
  },
  dataQuality: {
    totalRecords: { type: Number, default: 0 },
    validRecords: { type: Number, default: 0 },
    missingValues: { type: Number, default: 0 },
    duplicateRecords: { type: Number, default: 0 },
    invalidValues: { type: Number, default: 0 },
    dataQualityScore: { type: Number, default: 0 }
  }
}, { timestamps: true });

datasetSchema.index({ enumeratorId: 1 });
datasetSchema.index({ uploadDate: -1 });

module.exports = mongoose.model('Dataset', datasetSchema);
