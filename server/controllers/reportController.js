const PDFDocument = require('pdfkit');
const Village = require('../models/Village');
const SurveyRecord = require('../models/SurveyRecord');

exports.generateVillageReportPDF = async (req, res) => {
  try {
    const { villageId } = req.params;
    
    // Fetch village details
    const village = await Village.findById(villageId);
    if (!village) {
      return res.status(404).json({ message: 'Village not found' });
    }

    // Fetch aggregate statistics
    const stats = await SurveyRecord.aggregate([
      { $match: { village_id: village._id } },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          valid: { $sum: { $cond: [{ $in: ['$riskLevel', ['Normal', 'Low Risk']] }, 1, 0] } },
          warnings: { $sum: { $cond: [{ $eq: ['$riskLevel', 'Medium Risk'] }, 1, 0] } },
          anomalies: { $sum: { $cond: [{ $eq: ['$riskLevel', 'High Risk'] }, 1, 0] } },
          avgAnomalyScore: { $avg: '$isolationForestScore' },
          maxAnomalyScore: { $max: '$isolationForestScore' },
          minAnomalyScore: { $min: '$isolationForestScore' },
          lowScoreCount: { $sum: { $cond: [{ $lte: ['$isolationForestScore', 30] }, 1, 0] } },
          mediumScoreCount: { $sum: { $cond: [{ $and: [{ $gt: ['$isolationForestScore', 30] }, { $lte: ['$isolationForestScore', 70] }] }, 1, 0] } },
          highScoreCount: { $sum: { $cond: [{ $and: [{ $gt: ['$isolationForestScore', 70] }, { $lte: ['$isolationForestScore', 90] }] }, 1, 0] } },
          criticalScoreCount: { $sum: { $cond: [{ $gt: ['$isolationForestScore', 90] }, 1, 0] } },
        }
      }
    ]);

    const reportData = stats[0] || {
      totalRecords: 0,
      valid: 0,
      warnings: 0,
      anomalies: 0,
      avgAnomalyScore: 0,
      maxAnomalyScore: 0,
      minAnomalyScore: 0,
      lowScoreCount: 0,
      mediumScoreCount: 0,
      highScoreCount: 0,
      criticalScoreCount: 0
    };

    const anomalyRate = reportData.totalRecords > 0 
      ? ((reportData.anomalies / reportData.totalRecords) * 100).toFixed(2) 
      : 0;

    // Create PDF Document
    const doc = new PDFDocument({ margin: 50 });
    
    // Setup response headers for PDF download
    res.setHeader('Content-disposition', `attachment; filename="Village_Report_${village.name.replace(/\s+/g, '_')}.pdf"`);
    res.setHeader('Content-type', 'application/pdf');
    
    doc.pipe(res);

    // Title & Header
    doc.fontSize(24).font('Helvetica-Bold').text('SurveyShield Validation Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica').fillColor('#64748b').text('Village-Level Anomaly Summary', { align: 'center' });
    doc.moveDown(2);

    // Village Details Box
    doc.rect(50, doc.y, 500, 60).fill('#f8fafc').stroke('#e2e8f0');
    const boxTop = doc.y + 15;
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(12).text('Village Details', 65, boxTop);
    doc.font('Helvetica').fontSize(10)
       .text(`Village Name: ${village.name}`, 65, boxTop + 20)
       .text(`District: ${village.district}`, 250, boxTop + 20)
       .text(`State: ${village.state}`, 400, boxTop + 20);
    
    doc.moveDown(4);

    // Statistics Grid
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text('Data Quality Summary', 50, doc.y);
    doc.moveDown(1);
    
    const drawStatRow = (label1, value1, label2, value2) => {
        doc.font('Helvetica').fontSize(11).fillColor('#475569').text(label1, 50, doc.y, { continued: true })
           .font('Helvetica-Bold').fillColor('#0f172a').text(`  ${value1}`, { align: 'left', width: 250 });
           
        doc.moveUp();
        doc.font('Helvetica').fontSize(11).fillColor('#475569').text(label2, 300, doc.y, { continued: true })
           .font('Helvetica-Bold').fillColor('#0f172a').text(`  ${value2}`, { align: 'left' });
        doc.moveDown(0.5);
    };

    drawStatRow('Total Records:', reportData.totalRecords, 'Valid Records:', reportData.valid);
    drawStatRow('Warnings (Medium Risk):', reportData.warnings, 'Anomalies (High Risk):', reportData.anomalies);
    doc.moveDown(1);
    drawStatRow('Average Anomaly Score:', (reportData.avgAnomalyScore || 0).toFixed(2), 'Max Anomaly Score:', (reportData.maxAnomalyScore || 0).toFixed(2));
    drawStatRow('Anomaly Rate:', `${anomalyRate}%`, 'Report Date:', new Date().toLocaleDateString());

    doc.moveDown(3);

    // Score Distribution Chart (Text-based for PDF)
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text('Anomaly Score Distribution', 50, doc.y);
    doc.moveDown(1);

    const drawDistributionBar = (label, count, total, color) => {
        const percentage = total > 0 ? (count / total) : 0;
        const barWidth = percentage * 300; // max width 300
        
        doc.font('Helvetica').fontSize(10).fillColor('#475569').text(label, 50, doc.y);
        doc.rect(120, doc.y - 10, barWidth, 15).fill(color);
        doc.fillColor('#0f172a').text(count.toString(), 130 + barWidth, doc.y - 8);
        doc.moveDown(1.5);
    };

    drawDistributionBar('LOW (0-30)', reportData.lowScoreCount, reportData.totalRecords, '#10b981');
    drawDistributionBar('MEDIUM (31-70)', reportData.mediumScoreCount, reportData.totalRecords, '#f59e0b');
    drawDistributionBar('HIGH (71-90)', reportData.highScoreCount, reportData.totalRecords, '#f43f5e');
    drawDistributionBar('CRITICAL (91-100)', reportData.criticalScoreCount, reportData.totalRecords, '#7f1d1d');

    doc.moveDown(3);
    
    // Conclusion text
    doc.font('Helvetica-Oblique').fontSize(10).fillColor('#64748b')
       .text('This report summarizes the AI-driven data validation results for the selected village. ' +
             'Detailed individual anomalous records are excluded from this summary view but can be accessed ' +
             'via the SurveyShield Admin Dashboard.', 50, doc.y, { align: 'center', width: 500 });

    // Finalize PDF file
    doc.end();

  } catch (err) {
    console.error('PDF Generation Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
};
