require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Teacher = require('./models/Teacher');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_activity_management';

async function seed() {
  await mongoose.connect(MONGODB_URI);

  const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123456';

  if (!/^\S+@\S+\.\S+$/.test(adminEmail)) {
    throw new Error('ADMIN_EMAIL must be a valid email address.');
  }

  if (adminPassword.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await Teacher.updateOne(
    { email: adminEmail },
    {
      $set: {
        fullName: 'Main Admin',
        email: adminEmail,
        phone: '',
        passwordHash,
        role: 'admin'
      }
    },
    { upsert: true }
  );

  console.log('Seed complete');
  console.log(`Admin email: ${adminEmail}`);
  console.log(`Admin password: ${adminPassword}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
