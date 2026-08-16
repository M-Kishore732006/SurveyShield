const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g., 'Approve Record', 'Upload Data', 'Create Enumerator'
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetRecordId: { type: mongoose.Schema.Types.ObjectId }, // optional
  details: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
