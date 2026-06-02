require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Teacher = require('./models/Teacher');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_activity_management';
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || 'Admin123456!');

async function main() {
  await mongoose.connect(MONGODB_URI);
  const admin = await Teacher.findOne({ email: ADMIN_EMAIL });
  console.log('Database:', MONGODB_URI);
  console.log('Looking for:', ADMIN_EMAIL);
  console.log('Admin exists:', Boolean(admin));
  if (admin) {
    const ok = await bcrypt.compare(ADMIN_PASSWORD, admin.passwordHash);
    console.log('Password matches .env:', ok);
    console.log('Role:', admin.role);
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
