require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Teacher = require('./models/Teacher');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_activity_management';
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || 'Admin123456!');

async function resetAdmin() {
  await mongoose.connect(MONGODB_URI);

  if (!/^\S+@\S+\.\S+$/.test(ADMIN_EMAIL)) {
    throw new Error('ADMIN_EMAIL must be a valid email address.');
  }

  if (ADMIN_PASSWORD.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  }

  await Teacher.deleteMany({ role: 'admin' });

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await Teacher.create({
    fullName: 'Main Admin',
    email: ADMIN_EMAIL,
    phone: '',
    passwordHash,
    role: 'admin',
    assignedGender: 'all'
  });

  console.log('Admin reset complete.');
  console.log(`Database: ${MONGODB_URI}`);
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);

  await mongoose.disconnect();
}

resetAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
