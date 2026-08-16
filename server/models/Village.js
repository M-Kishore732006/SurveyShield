const mongoose = require('mongoose');

const villageSchema = new mongoose.Schema({
  villageId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  
  // Assigned Enumerators
  enumerators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Statistics
  totalRecords: { type: Number, default: 0 },
  flaggedRecords: { type: Number, default: 0 },
  highRiskRecords: { type: Number, default: 0 },
  qualityScore: { type: Number, default: 100 },
  status: { type: String, enum: ['Good', 'Needs Monitoring', 'Poor'], default: 'Good' },
}, { timestamps: true });

module.exports = mongoose.model('Village', villageSchema);
