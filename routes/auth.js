const express = require('express');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const bcrypt = require('bcryptjs');

const router = express.Router();

// ================= STUDENT LOGIN =================
router.post('/student/login', async (req, res) => {
  try {
    const { studentCode, password } = req.body;

    const cleanCode = String(studentCode || '').trim().toUpperCase();

    if (!cleanCode) {
      return res.status(400).json({ error: 'Student code is required' });
    }

    const student = await Student.findOne({ studentCode: cleanCode });

    if (!student) {
      return res.status(401).json({ error: 'Student code or password is incorrect' });
    }

    const ok = await bcrypt.compare(password, student.passwordHash);

    if (!ok) {
      return res.status(401).json({ error: 'Student code or password is incorrect' });
    }

    req.session.userId = student._id.toString();
    req.session.userType = 'student';

    res.json({
      message: 'Logged in',
      userType: 'student',
      mustChangePassword: student.mustChangePassword
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ================= TEACHER / ADMIN LOGIN =================
router.post('/teacher/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    const teacher = await Teacher.findOne({ phone });

    if (!teacher) {
      return res.status(401).json({ error: 'Phone number or password is incorrect' });
    }

    const ok = await bcrypt.compare(password, teacher.passwordHash);

    if (!ok) {
      return res.status(401).json({ error: 'Phone number or password is incorrect' });
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
    res.status(500).json({ error: 'Login failed' });
  }
});

// ================= CURRENT USER =================
router.get('/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Login required' });
  }

  if (req.session.userType === 'teacher') {
    const teacher = await Teacher.findById(req.session.userId).select('-passwordHash');

    if (!teacher) {
      return res.status(401).json({ error: 'teacher not found' });
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
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old and new passwords are required' });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const teacher = await Teacher.findById(req.session.userId);

    if (!teacher) {
      return res.status(404).json({ error: 'teacher not found' });
    }

    const oldPasswordOk = await bcrypt.compare(oldPassword, teacher.passwordHash);

    if (!oldPasswordOk) {
      return res.status(401).json({ error: 'Old password is incorrect' });
    }

    teacher.passwordHash = await bcrypt.hash(newPassword, 12);
    await teacher.save();

    res.json({ message: 'Password changed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ================= STUDENT PASSWORD CHANGE =================
router.put('/student/change-password', async (req, res) => {
  try {
    if (!req.session.userId || req.session.userType !== 'student') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old and new passwords are required' });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from the old password' });
    }

    const student = await Student.findById(req.session.userId);

    if (!student) {
      return res.status(404).json({ error: 'student not found' });
    }

    const oldPasswordOk = await bcrypt.compare(oldPassword, student.passwordHash);

    if (!oldPasswordOk) {
      return res.status(401).json({ error: 'Old password is incorrect' });
    }

    student.passwordHash = await bcrypt.hash(newPassword, 12);
    student.mustChangePassword = false;
    await student.save();

    res.json({ message: 'Password changed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;