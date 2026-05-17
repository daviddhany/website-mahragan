require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Teacher = require('./models/Teacher');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school_activity_app';

async function seed() {
  await mongoose.connect(MONGODB_URI);

  const adminPhone = '01000000000';
  const adminPassword = 'admin12345';

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await Teacher.updateOne(
    { phone: adminPhone },
    {
      $set: {
        fullName: 'Main Admin',
        phone: adminPhone,
        passwordHash,
        role: 'admin'
      }
    },
    { upsert: true }
  );

  console.log('Seed complete');
  console.log(`Admin login: ${adminPhone} / ${adminPassword}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});