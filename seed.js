require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Teacher = require('./models/Teacher');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb:;

async function seed() {
  await mongoose.connect(MONGODB_URI);

  const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || 'Admin123456!');

  if (!/^\S+@\S+\.\S+$/.test(adminEmail)) {
    throw new Error('ADMIN_EMAIL must be a valid email address.');
  }

  if (adminPassword.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // Remove old demo admin accounts that were created with phone-only login.
  await Teacher.deleteMany({
    role: 'admin',
    $or: [
      { email: { $exists: false } },
      { email: '' },
      { phone: process.env.ADMIN_PHONE || '01000000000' }
    ]
  });

  const admin = await Teacher.findOne({ email: adminEmail });

  if (admin) {
    admin.fullName = 'Main Admin';
    admin.email = adminEmail;
    admin.phone = '';
    admin.passwordHash = passwordHash;
    admin.role = 'admin';
    admin.assignedClass = undefined;
    admin.assignedYear = undefined;
    admin.assignedGender = 'all';
    await admin.save({ validateBeforeSave: false });
  } else {
    await Teacher.create({
      fullName: 'Main Admin',
      email: adminEmail,
      phone: '',
      passwordHash,
      role: 'admin',
      assignedGender: 'all'
    });
  }

  console.log('Seed complete');
  console.log(`MongoDB: ${MONGODB_URI}`);
  console.log(`Admin email: ${adminEmail}`);
  console.log(`Admin password: ${adminPassword}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
