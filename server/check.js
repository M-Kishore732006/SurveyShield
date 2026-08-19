const mongoose = require('mongoose');
const SurveyRecord = require('./models/SurveyRecord');
mongoose.connect('mongodb://mkishore732006mahes_db_user:732006@ac-2haexfx-shard-00-00.ilic4ds.mongodb.net:27017,ac-2haexfx-shard-00-01.ilic4ds.mongodb.net:27017,ac-2haexfx-shard-00-02.ilic4ds.mongodb.net:27017/?ssl=true&replicaSet=atlas-axed89-shard-0&authSource=admin&appName=Cluster0')
.then(async () => {
    const total = await SurveyRecord.countDocuments();
    const validated = await SurveyRecord.countDocuments({ validationStatus: { $ne: 'Flagged' } });
    console.log('Total records:', total);
    console.log('Validated records:', validated);
    process.exit(0);
});
