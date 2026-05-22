const express = require('express');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const bcrypt = require('bcryptjs');

const router = express.Router();

// ================= STUDENT LOGIN =================
router.post('/student/login', async (req, res) => {
  try {
    const { nationalId, password } = req.body;

    if (!/^\d{14}$/.test(String(nationalId || ''))) {
      return res.status(400).json({ error: 'الرقم القومي يجب أن يكون 14 رقم' });
    }

    const student = await Student.findOne({ nationalId });

    if (!student) {
      return res.status(401).json({ error: 'الرقم القومي أو كلمة السر غير صحيحة' });
    }

    const ok = await bcrypt.compare(password, student.passwordHash);

    if (!ok) {
      return res.status(401).json({ error: 'الرقم القومي أو كلمة السر غير صحيحة' });
    }

    req.session.userId = student._id.toString();
    req.session.userType = 'student';

    res.json({
      message: 'Logged in',
      userType: 'student'
    });
  } catch (err) {
    res.status(500).json({ error: 'فشل تسجيل الدخول' });
  }
});

// ================= TEACHER / ADMIN LOGIN =================
router.post('/teacher/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    const teacher = await Teacher.findOne({ phone });

    if (!teacher) {
      return res.status(401).json({ error: 'رقم التليفون أو كلمة السر غير صحيحة' });
    }

    const ok = await bcrypt.compare(password, teacher.passwordHash);

    if (!ok) {
      return res.status(401).json({ error: 'رقم التليفون أو كلمة السر غير صحيحة' });
    }

    req.session.userId = teacher._id.toString();
    req.session.userType = 'teacher';
    req.session.role = teacher.role;

    res.json({
      message: 'Logged in',
      userType: 'teacher',
      role: teacher.role
    });
  } catch (err) {
    res.status(500).json({ error: 'فشل تسجيل الدخول' });
  }
});

// ================= CURRENT USER =================
router.get('/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول' });
  }

  if (req.session.userType === 'teacher') {
    const teacher = await Teacher.findById(req.session.userId).select('-passwordHash');

    if (!teacher) {
      return res.status(401).json({ error: 'الخادم غير موجود' });
    }

    return res.json({
      userType: 'teacher',
      role: teacher.role,
      fullName: teacher.fullName,
      phone: teacher.phone,
      assignedClass: teacher.assignedClass,
      assignedYear: teacher.assignedYear,
      assignedGender: teacher.assignedGender
    });
  }

  res.json({
    userType: req.session.userType
  });
});

// ================= LOGOUT =================
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});

// ================= TEACHER PASSWORD CHANGE =================
router.put('/teacher/change-password', async (req, res) => {
  try {
    if (!req.session.userId || req.session.userType !== 'teacher') {
      return res.status(401).json({ error: 'غير مصرح' });
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'كلمة السر القديمة والجديدة مطلوبين' });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'كلمة السر الجديدة يجب أن تكون 8 أحرف على الأقل' });
    }

    const teacher = await Teacher.findById(req.session.userId);

    if (!teacher) {
      return res.status(404).json({ error: 'الخادم غير موجود' });
    }

    const oldPasswordOk = await bcrypt.compare(oldPassword, teacher.passwordHash);

    if (!oldPasswordOk) {
      return res.status(401).json({ error: 'كلمة السر القديمة غير صحيحة' });
    }

    teacher.passwordHash = await bcrypt.hash(newPassword, 12);
    await teacher.save();

    res.json({ message: 'تم تغيير كلمة السر' });
  } catch (err) {
    res.status(500).json({ error: 'فشل تغيير كلمة السر' });
  }
});

module.exports = router;