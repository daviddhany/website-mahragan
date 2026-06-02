require('dotenv').config();

const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_activity_management';

async function cleanup() {
  await mongoose.connect(MONGODB_URI);

  const admins = await Teacher.find({ role: 'admin' }).sort({ email: 1, createdAt: 1 });
  const idsToDelete = [];
  const seenEmails = new Set();

  for (const admin of admins) {
    const email = String(admin.email || '').trim().toLowerCase();

    if (!email) {
      idsToDelete.push(admin._id);
      continue;
    }

    if (seenEmails.has(email)) {
      idsToDelete.push(admin._id);
    } else {
      seenEmails.add(email);
    }
  }

  if (idsToDelete.length) {
    await Teacher.deleteMany({ _id: { $in: idsToDelete } });
  }

  console.log(`Admin cleanup complete. Removed ${idsToDelete.length} duplicate/broken admin record(s).`);
  await mongoose.disconnect();
}

cleanup().catch(err => {
  console.error(err);
  process.exit(1);
});
