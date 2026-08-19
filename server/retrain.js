const mongoose = require('mongoose');
const axios = require('axios');
const SurveyRecord = require('./models/SurveyRecord');

mongoose.connect('mongodb://mkishore732006mahes_db_user:732006@ac-2haexfx-shard-00-00.ilic4ds.mongodb.net:27017,ac-2haexfx-shard-00-01.ilic4ds.mongodb.net:27017,ac-2haexfx-shard-00-02.ilic4ds.mongodb.net:27017/?ssl=true&replicaSet=atlas-axed89-shard-0&authSource=admin&appName=Cluster0')
.then(async () => {
    const records = await SurveyRecord.find({ validationStatus: { $ne: 'Flagged' } }).limit(10000).lean();
    console.log("Found records:", records.length);
    const trainingData = records.map(r => ({
         ...(r.dynamicData || {}),
         age: parseFloat(r.age) || 0,
         income: parseFloat(r.income) || 0,
         hours_worked: parseFloat(r.hours_worked) || 0,
         household_size: parseFloat(r.household_size) || 1,
         gender: r.gender || 'Unknown',
         education: r.education || 'Unknown',
         occupation: r.occupation || 'Unknown',
         employment_status: r.employment_status || 'Unknown'
    }));
    console.log("Training data length:", trainingData.length);
    const mlRes = await axios.post('http://localhost:8001/ml/train', { records: trainingData });
    console.log(mlRes.data.metadata);
    process.exit(0);
}).catch(console.error);
