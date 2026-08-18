const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Village = require('../models/Village');
const SurveyRecord = require('../models/SurveyRecord');

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/surveyshield');
    console.log('Connected to DB. Clearing old data...');

    await User.deleteMany({});
    await Village.deleteMany({});
    await SurveyRecord.deleteMany({});

    // 1. Create Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@gmail.com',
      password: '123',
      role: 'admin'
    });
    console.log('Admin created.');

    // 2. Create Villages
    const villages = [];
    for (let i = 1; i <= 10; i++) {
      const v = await Village.create({
        villageId: `V${1000 + i}`,
        name: `Village ${i}`,
        district: i % 2 === 0 ? 'District A' : 'District B',
        state: 'State X'
      });
      villages.push(v);
    }
    console.log('10 Villages created.');

    // 3. Create Enumerators
    const enumerators = [];
    for (let i = 1; i <= 10; i++) {
      const vIndex = i - 1; // assign to villages 1-to-1
      const e = await User.create({
        name: `Enumerator ${i}`,
        email: `enum${i}@surveyshield.gov`,
        password: '123',
        role: 'enumerator',
        villageId: villages[vIndex]._id
      });
      
      await Village.findByIdAndUpdate(villages[vIndex]._id, { enumerator: e._id });
      enumerators.push(e);
    }
    console.log('10 Enumerators created.');

    // 4. Generate CSV for Demo Data (Synthetic)
    const records = [];
    records.push('household_id,survey_id,enumerator_id,village_id,district,age,gender,education,occupation,employment_status,income,hours_worked,household_size,interview_duration,survey_date');
    
    // Normal data (80%)
    for (let i = 1; i <= 800; i++) {
      const age = Math.floor(Math.random() * (60 - 18) + 18);
      records.push(`HH${1000+i},S${10000+i},,V${1000 + (i%10 + 1)},District A,${age},M,Secondary,Farming,Employed,${Math.floor(Math.random() * 20000 + 10000)},${Math.floor(Math.random() * 20 + 30)},4,45,2024-05-10`);
    }

    // Anomalous data (20%) - Very high income, low hours, weird age
    for (let i = 801; i <= 1000; i++) {
      records.push(`HH${1000+i},S${10000+i},,V${1000 + (i%10 + 1)},District A,5,M,None,Unemployed,Unemployed,900000,100,1,10,2024-05-10`);
    }

    fs.writeFileSync('demo_survey_data.csv', records.join('\n'));
    console.log('demo_survey_data.csv created in backend folder.');

    console.log('Seed completed.');
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedData();
