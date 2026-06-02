const express = require('express');
const bcrypt = require('bcryptjs');
const Teacher = require('../models/Teacher');
const { requireAdmin } = require('../middleware/auth');
const { normalizeClassName, normalizeStudentYear } = require('../utils');

const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  const search = String(req.query.search || '').trim();
const filter = { role: { $in: ['admin', 'teacher', 'serviceLeader'] } };
  if (search) {
    filter.$or = [
      { fullName: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
      { assignedClass: new RegExp(search, 'i') },
      { assignedYear: new RegExp(search, 'i') }
    ];
  }

  const teachers = await Teacher.find(filter).select('-passwordHash').sort({ role: 1, assignedClass: 1, assignedYear: 1, fullName: 1 });
  res.json(teachers);
});

router.post('/', requireAdmin, async (req, res) => {
  const {
    fullName,
    email,
    phone,
    password,
    assignedClass,
    assignedYear,
    assignedGender,
    role
  } = req.body;

  const teacherRole = ['admin', 'serviceLeader', 'teacher'].includes(role) ? role : 'teacher';

  if (!fullName || !email || !password) {
    return res.status(400).json({
      error: 'Please complete user details'
    });
  }

  if (teacherRole !== 'admin' && (!assignedClass || !assignedGender || (teacherRole === 'teacher' && !assignedYear))) {
    return res.status(400).json({
      error: 'Please complete staff details'
    });
  }

  const normalizedAssignedClass = teacherRole === 'admin' ? undefined : normalizeClassName(assignedClass);
  const normalizedAssignedYear = teacherRole === 'teacher' && assignedYear ? normalizeStudentYear(assignedYear) : undefined;

  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
    return res.status(400).json({ error: 'Email must be valid' });
  }

  if (phone && !/^\d{11}$/.test(phone)) {
    return res.status(400).json({ error: 'Phone number must be exactly 11 digits' });
  }

  const allowedClasses = [
    'Department A',
    'Department B',
    'Department C',
    'Upper Department',
    'Middle Department'
  ];

  if (teacherRole !== 'admin' && !allowedClasses.includes(normalizedAssignedClass)) {
    return res.status(400).json({ error: 'Invalid department' });
  }

  const allowedYears = [
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
    'Grade 6',
    'Grade 7',
    'Grade 8',
    'Grade 9'
  ];

  if (teacherRole === 'teacher' && !allowedYears.includes(normalizedAssignedYear)) {
    return res.status(400).json({ error: 'Invalid grade' });
  }

  if (teacherRole !== 'admin' && !['male', 'female'].includes(assignedGender)) {
    return res.status(400).json({ error: 'Invalid gender' });
  }

  const exists = await Teacher.findOne({ email: cleanEmail });

  if (exists) {
    return res.status(409).json({
      error: 'Email already exists'
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const teacherData = {
    fullName,
    email: cleanEmail,
    phone: phone || '',
    passwordHash,
    role: teacherRole
  };

  if (teacherRole !== 'admin') {
    teacherData.assignedClass = normalizedAssignedClass;
    teacherData.assignedYear = normalizedAssignedYear;
    teacherData.assignedGender = assignedGender;
  }

  const teacher = await Teacher.create(teacherData);

  res.status(201).json({
    message: 'User created successfully',
    teacher: {
      id: teacher._id,
      fullName: teacher.fullName,
      email: teacher.email,
      phone: teacher.phone,
      assignedClass: teacher.assignedClass,
      assignedYear: teacher.assignedYear,
      assignedGender: teacher.assignedGender,
      role: teacher.role
    }
  });
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);

  if (!teacher) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!['teacher', 'serviceLeader'].includes(teacher.role)) {
    return res.status(403).json({ error: 'Admins cannot be deleted here' });
  }

  await Teacher.deleteOne({ _id: teacher._id });

  res.json({ message: 'User deleted successfully' });
});

module.exports = router;
