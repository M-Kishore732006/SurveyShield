const CrossSurveyResult = require('../models/CrossSurveyResult');
const SurveyRecord = require('../models/SurveyRecord');
const Dataset = require('../models/Dataset');

exports.analyze = async (req, res) => {
  try {
    // 1. Get the latest dataset (Current)
    const datasets = await Dataset.find().sort({ uploadDate: -1 });
    if (datasets.length < 1) {
      return res.status(400).json({ message: 'No datasets available to analyze.' });
    }

    const currentDataset = datasets[0];
    const historicalDatasets = datasets.slice(1);
    const historicalIds = historicalDatasets.map(d => d._id);

    // 2. Compute averages for Current Dataset
    const currentRecords = await SurveyRecord.find({ uploadId: currentDataset._id });
    
    // 3. Compute averages for Historical Datasets
    const historicalRecords = await SurveyRecord.find({ uploadId: { $in: historicalIds } });

    if (currentRecords.length === 0 || historicalRecords.length === 0) {
       return res.status(400).json({ message: 'Not enough records to perform historical comparison.' });
    }

    // Helper to calculate average
    const getAvg = (records, field) => {
        const valid = records.map(r => parseFloat(r[field])).filter(v => !isNaN(v));
        if (valid.length === 0) return 0;
        return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1);
    };

    const currentHours = getAvg(currentRecords, 'hours_worked');
    const histHours = getAvg(historicalRecords, 'hours_worked');
    
    const currentSize = getAvg(currentRecords, 'household_size');
    const histSize = getAvg(historicalRecords, 'household_size');

    // Helper to calculate deviation and severity
    const evaluate = (indicator, curr, hist, relatedValue) => {
        const diff = (curr - hist);
        const percentDiff = hist > 0 ? (Math.abs(diff) / hist) * 100 : 0;
        
        let severity = 'LOW';
        let crossSurveyScore = 20;
        
        if (percentDiff > 30) {
            severity = 'CRITICAL';
            crossSurveyScore = 95;
        } else if (percentDiff > 15) {
            severity = 'HIGH';
            crossSurveyScore = 80;
        } else if (percentDiff > 5) {
            severity = 'MEDIUM';
            crossSurveyScore = 50;
        }

        const deviationStr = diff > 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`;
        const explanation = severity === 'LOW' 
            ? `Minimal deviation. Consistent with historical records.` 
            : `${indicator} is significantly different (${deviationStr}) from historical baselines.`;

        return {
            indicator,
            geography: 'Aggregate',
            currentValue: parseFloat(curr),
            historicalValue: parseFloat(hist),
            relatedValue,
            deviation: deviationStr,
            statisticalScore: crossSurveyScore,
            crossSurveyScore,
            mlScore: crossSurveyScore - 5, // Just mock ML alignment
            severity,
            explanation
        };
    };

    // 4. Generate results
    const result1 = evaluate('Working Hours', currentHours, histHours, 45);
    const result2 = evaluate('Household Size', currentSize, histSize, 4.1);

    // 5. Clear previous and save new
    await CrossSurveyResult.deleteMany({});
    await CrossSurveyResult.insertMany([result1, result2]);

    res.json({ message: 'Analysis completed successfully', status: 'success' });
  } catch (error) {
    res.status(500).json({ message: 'Analysis failed', error: error.message });
  }
};

exports.getResults = async (req, res) => {
  try {
    const results = await CrossSurveyResult.find().sort({ indicator: 1 });
    res.json({ results });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch results', error: error.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const results = await CrossSurveyResult.find();
    
    let consistent = 0, warnings = 0, highInconsistencies = 0, criticalInconsistencies = 0;
    
    results.forEach(r => {
        if (r.severity === 'LOW') consistent++;
        else if (r.severity === 'MEDIUM') warnings++;
        else if (r.severity === 'HIGH') highInconsistencies++;
        else if (r.severity === 'CRITICAL') criticalInconsistencies++;
    });

    res.json({
      totalIndicators: results.length,
      consistent,
      warnings,
      highInconsistencies,
      criticalInconsistencies
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch summary', error: error.message });
  }
};
