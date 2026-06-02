const express = require('express');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Activity = require('../models/Activity');
const { getEffectiveRegistrationSettings, requireRegistrationOpen } = require('../helpers/registrationControl');
const { requireStudent } = require('../middleware/auth');
const { makeUpload } = require('../middleware/upload');
const {
  generateStudentCode,
  requireFields,
  normalizeClassName,
  normalizeStudentYear,
  getEntryYearFromStudentYear
} = require('../utils');

const router = express.Router();

function normalizeDuplicateText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, '')
    .replace(/\s+/g, ' ');
}

function getBirthDateRange(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}


const photoUpload = makeUpload('uploads/student-photos');
const birthUpload = makeUpload('uploads/birth-certificates');
const paymentUpload = makeUpload('uploads/payment-proofs');


router.get('/registration-status', async (req, res) => {
  const { settings, effectiveRegistrationOpen } = await getEffectiveRegistrationSettings();

  res.json({
    registrationOpen: effectiveRegistrationOpen,
    registrationClosesAt: settings.registrationClosesAt
      ? settings.registrationClosesAt.toISOString()
      : null
  });
});

router.post('/register', async (req, res) => {
  try {

    const { effectiveRegistrationOpen } = await getEffectiveRegistrationSettings();

    if (!effectiveRegistrationOpen) {
      return res.status(403).json({
        error: 'Registration is currently closed by the administrator'
      });
    }

    const needed = [
      'fullName',
      'gender',
      'className',
      'studentYear',
      'birthDate',
      'password',
      'parentPhone',
      'address'
    ];

    const missing = requireFields(req.body, needed);

    if (missing.length) {
      return res.status(400).json({
        error: `Please complete the required fields: ${missing.join(', ')}`
      });
    }

    if (String(req.body.fullName).trim().split(/\s+/).length < 3) {
      return res.status(400).json({
        error: 'Full name must contain at least three names'
      });
    }

    if (!/^\d{11}$/.test(req.body.parentPhone)) {
      return res.status(400).json({
        error: 'Guardian phone must be 11 digits'
      });
    }

    if (req.body.studentPhone && !/^\d{11}$/.test(req.body.studentPhone)) {
      return res.status(400).json({
        error: 'Student phone must be 11 digits'
      });
    }

    const className = normalizeClassName(req.body.className);

    const studentYear = normalizeStudentYear(
      req.body.studentYear
    );

    const entryYear = getEntryYearFromStudentYear(studentYear);

    if (!entryYear) {
      return res.status(400).json({
        error: 'Invalid grade'
      });
    }

    const allowedYearsByClass = {
      'Department A': ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'],
      'Department B': ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'],
      'Department C': ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'],
      'Upper Primary': ['Grade 5', 'Grade 6'],
      'Middle School': ['Grade 7', 'Grade 8', 'Grade 9']
    };

    if (!allowedYearsByClass[className] || !allowedYearsByClass[className].includes(studentYear)) {
      return res.status(400).json({
        error: 'Selected grade does not match the selected department'
      });
    }

    const birthDateRange = getBirthDateRange(req.body.birthDate);

    if (!birthDateRange) {
      return res.status(400).json({
        error: 'Invalid date of birth'
      });
    }

    const possibleDuplicateStudents = await Student.find({
      parentPhone: String(req.body.parentPhone || '').trim(),
      className,
      studentYear,
      birthDate: {
        $gte: birthDateRange.start,
        $lt: birthDateRange.end
      }
    }).select('fullName studentCode');

    const normalizedNewName = normalizeDuplicateText(req.body.fullName);

    const duplicateStudent = possibleDuplicateStudents.find((student) => {
      return normalizeDuplicateText(student.fullName) === normalizedNewName;
    });

    if (duplicateStudent) {
      return res.status(409).json({
        error: `This student is already registered with code ${duplicateStudent.studentCode}`
      });
    }

    const passwordHash = await bcrypt.hash(
      req.body.password,
      12
    );

    const studentCode = await generateStudentCode(
      req.body.gender,
      className,
      entryYear
    );


    const student = await Student.create({
      studentCode,
      fullName: req.body.fullName,
      gender: req.body.gender,
      className,
      studentYear,
      entryYear,
      birthDate: req.body.birthDate,
      studentPhone: req.body.studentPhone || '',
      passwordHash,
      parentPhone: req.body.parentPhone,
      address: req.body.address
    });

    res.status(201).json({
      message: 'Student registered',
      studentCode: student.studentCode,
      student: {
        studentCode: student.studentCode,
        fullName: student.fullName,
        gender: student.gender,
        className: student.className,
        studentYear: student.studentYear,
        entryYear: student.entryYear,
        birthDate: student.birthDate ? student.birthDate.toISOString().slice(0, 10) : '',
        parentPhone: student.parentPhone,
        studentPhone: student.studentPhone,
        address: student.address
      }
    });

  } catch (err) {

    if (err.code === 11000) {
      const duplicatedField = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'field';
      return res.status(409).json({
        error: duplicatedField === 'studentCode'
          ? 'Student code already exists'
          : `Duplicate data in database: ${duplicatedField}`
      });
    }

    console.error(err);

    res.status(500).json({
      error: 'Failed to create account. Please review the data and try again'
    });
  }
});

router.get('/me', requireStudent, async (req, res) => {
  try {

    const student = await Student.findById(
      req.session.userId
    )
      .select('-passwordHash')
      .populate('activities');

    res.json(student);

  } catch (err) {

    res.status(500).json({
      error: 'Failed to load student data'
    });
  }
});

router.put('/me', requireStudent, requireRegistrationOpen, async (req, res) => {
  try {

    const allowed = [
      'fullName',
      'parentPhone',
      'studentPhone',
      'address',
      'birthDate'
    ];

    const updates = {};

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (
      updates.fullName &&
      String(updates.fullName).trim().split(/\s+/).length < 3
    ) {
      return res.status(400).json({
        error: 'Full name must contain at least three names'
      });
    }

    if (
      updates.parentPhone &&
      !/^\d{11}$/.test(updates.parentPhone)
    ) {
      return res.status(400).json({
        error: 'Guardian phone must be 11 digits'
      });
    }

    if (
      updates.studentPhone &&
      !/^\d{11}$/.test(updates.studentPhone)
    ) {
      return res.status(400).json({
        error: 'Student phone must be 11 digits'
      });
    }

    const student = await Student.findByIdAndUpdate(
      req.session.userId,
      updates,
      {
        new: true,
        runValidators: true
      }
    ).select('-passwordHash');

    res.json(student);

  } catch (err) {

    res.status(500).json({
      error: 'Failed to update student data'
    });
  }
});

router.post(
  '/me/upload/student-photo',
  requireStudent,
  requireRegistrationOpen,
  photoUpload.single('file'),

  async (req, res) => {
    try {

      if (!req.file) {
        return res.status(400).json({
          error: 'Profile photo is required'
        });
      }

      await Student.findByIdAndUpdate(
        req.session.userId,
        {
          studentPhotoPath: req.file.path
        }
      );

      res.json({
        message: 'Profile photo uploaded'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: 'Failed to upload profile photo'
      });
    }
  }
);

router.post(
  '/me/upload/birth-certificate',
  requireStudent,
  requireRegistrationOpen,
  birthUpload.single('file'),

  async (req, res) => {
    try {

      if (!req.file) {
        return res.status(400).json({
          error: 'File is required'
        });
      }

      await Student.findByIdAndUpdate(
        req.session.userId,
        {
birthCertificatePath: req.file.path.endsWith('.pdf')
  ? req.file.path.replace('/image/upload/', '/raw/upload/fl_inline/')
  : req.file.path        }
      );

      res.json({
        message: 'Birth certificate uploaded'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: 'Failed to upload birth certificate'
      });
    }
  }
);

router.post(
  '/me/upload/payment-proof',
  requireStudent,
  requireRegistrationOpen,
  paymentUpload.single('file'),

  async (req, res) => {
    try {

      if (!req.file) {
        return res.status(400).json({
          error: 'File is required'
        });
      }

      await Student.findByIdAndUpdate(
        req.session.userId,
        {
          paymentProofPath: req.file.path
        }
      );

      res.json({
        message: 'Payment receipt uploaded'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: 'Failed to upload payment receipt'
      });
    }
  }
);

router.get('/me/activities', requireStudent, async (req, res) => {
  try {

    const student = await Student.findById(
      req.session.userId
    ).select('activities');

    const activities = await Activity.find({
      isActive: true
    }).sort('name');

    res.json({
      selected: student.activities.map(String),
      activities
    });

  } catch (err) {

    res.status(500).json({
      error: 'Failed to load activities'
    });
  }
});

router.put('/me/activities', requireStudent, requireRegistrationOpen, async (req, res) => {
  try {

    const student = await Student.findById(
      req.session.userId
    );

    const activityIds = Array.isArray(req.body.activityIds)
      ? req.body.activityIds
      : [];

    if (activityIds.length === 0) {
      return res.status(400).json({
        error: 'Please choose at least one activity'
      });
    }

    const valid = await Activity.find({
      _id: { $in: activityIds },
      isActive: true
    }).select('_id name category');

    const hasSportsActivity = valid.some((activity) => {
      const name = String(activity.name || '');
      const category = String(activity.category || '');
      return name.includes('Sports') || category.includes('Sports');
    });

    if (hasSportsActivity && !student.studentPhotoPath) {
      return res.status(400).json({
        error: 'Profile photo is required when choosing a sports activity'
      });
    }

    if (hasSportsActivity && !student.birthCertificatePath) {
      return res.status(400).json({
        error: 'Birth certificate is required when choosing a sports activity'
      });
    }


    await Student.findByIdAndUpdate(
      req.session.userId,
      {
        activities: valid.map((a) => a._id),
        submissionComplete: true,
        submittedAt: new Date()
      }
    );

    res.json({
      message: 'Registration submitted successfully'
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'Failed to submit registration'
    });
  }
});

module.exports = router;
