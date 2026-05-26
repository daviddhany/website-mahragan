const express = require('express');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Activity = require('../models/Activity');
const { requireStudent } = require('../middleware/auth');
const { makeUpload } = require('../middleware/upload');
const {
  generateStudentCode,
  requireFields,
  normalizeClassName,
  normalizeStudentYear
} = require('../utils');

const router = express.Router();

const photoUpload = makeUpload('uploads/student-photos');
const birthUpload = makeUpload('uploads/birth-certificates');
const paymentUpload = makeUpload('uploads/payment-proofs');

router.post('/register', async (req, res) => {
  try {

    const needed = [
      'fullName',
      'gender',
      'className',
      'studentYear',
      'birthDate',
      'password',
      'parentPhone',
      'address',
      'canTravel',
      'paymentMethod'
    ];

    const missing = requireFields(req.body, needed);

    if (missing.length) {
      return res.status(400).json({
        error: `من فضلك أكمل البيانات المطلوبة: ${missing.join(', ')}`
      });
    }

    if (String(req.body.fullName).trim().split(/\s+/).length < 4) {
      return res.status(400).json({
        error: 'الاسم يجب أن يكون رباعي'
      });
    }

    if (!/^\d{11}$/.test(req.body.parentPhone)) {
      return res.status(400).json({
        error: 'رقم ولي الأمر يجب أن يكون 11 رقم'
      });
    }

    if (req.body.studentPhone && !/^\d{11}$/.test(req.body.studentPhone)) {
      return res.status(400).json({
        error: 'رقم تليفون المخدوم يجب أن يكون 11 رقم'
      });
    }

    
    const exists = await Student.findOne({
      nationalId: req.body.nationalId
    });

   

    const className = normalizeClassName(req.body.className);

    const studentYear = normalizeStudentYear(
      req.body.studentYear
    );

    const passwordHash = await bcrypt.hash(
      req.body.password,
      12
    );

    const studentCode = await generateStudentCode(
      req.body.gender,
      className,
      studentYear
    );

    const canTravel = req.body.canTravel === 'true';

    const paymentMethod =
      req.body.paymentMethod === 'instapay'
        ? 'instapay'
        : 'servant';

    const student = await Student.create({
      studentCode,
      fullName: req.body.fullName,
      gender: req.body.gender,
      className,
      studentYear,
      birthDate: req.body.birthDate,
      studentPhone: req.body.studentPhone || '',
      passwordHash,
      parentPhone: req.body.parentPhone,
      address: req.body.address,
      canTravel,
      paymentMethod
    });

    res.status(201).json({
      message: 'Student registered',
      studentCode: student.studentCode
    });

  } catch (err) {

    if (err.code === 11000) {
      return res.status(409).json({
        error: 'كود المخدوم موجود بالفعل'
      });
    }

    console.error(err);

    res.status(500).json({
      error: 'فشل إنشاء الحساب. من فضلك راجع البيانات وحاول مرة أخرى'
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
      error: 'فشل تحميل بيانات المخدوم'
    });
  }
});

router.put('/me', requireStudent, async (req, res) => {
  try {

    const allowed = [
      'fullName',
      'parentPhone',
      'studentPhone',
      'address',
      'birthDate',
      'canTravel',
      'paymentMethod'
    ];

    const updates = {};

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (
      updates.fullName &&
      String(updates.fullName).trim().split(/\s+/).length < 4
    ) {
      return res.status(400).json({
        error: 'الاسم يجب أن يكون رباعي'
      });
    }

    if (
      updates.parentPhone &&
      !/^\d{11}$/.test(updates.parentPhone)
    ) {
      return res.status(400).json({
        error: 'رقم ولي الأمر يجب أن يكون 11 رقم'
      });
    }

    if (
      updates.studentPhone &&
      !/^\d{11}$/.test(updates.studentPhone)
    ) {
      return res.status(400).json({
        error: 'رقم تليفون المخدوم يجب أن يكون 11 رقم'
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
      error: 'فشل تعديل بيانات المخدوم'
    });
  }
});

router.post(
  '/me/upload/student-photo',
  requireStudent,
  photoUpload.single('file'),

  async (req, res) => {
    try {

      if (!req.file) {
        return res.status(400).json({
          error: 'الصورة الشخصية مطلوبة'
        });
      }

      await Student.findByIdAndUpdate(
        req.session.userId,
        {
          studentPhotoPath: req.file.path
        }
      );

      res.json({
        message: 'تم رفع الصورة الشخصية'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: 'فشل رفع الصورة الشخصية'
      });
    }
  }
);

router.post(
  '/me/upload/birth-certificate',
  requireStudent,
  birthUpload.single('file'),

  async (req, res) => {
    try {

      if (!req.file) {
        return res.status(400).json({
          error: 'الملف مطلوب'
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
        message: 'تم رفع شهادة الميلاد'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: 'فشل رفع شهادة الميلاد'
      });
    }
  }
);

router.post(
  '/me/upload/payment-proof',
  requireStudent,
  paymentUpload.single('file'),

  async (req, res) => {
    try {

      if (!req.file) {
        return res.status(400).json({
          error: 'الملف مطلوب'
        });
      }

      await Student.findByIdAndUpdate(
        req.session.userId,
        {
          paymentProofPath: req.file.path
        }
      );

      res.json({
        message: 'تم رفع إيصال الدفع'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: 'فشل رفع إيصال الدفع'
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
      error: 'فشل تحميل الأنشطة'
    });
  }
});

router.put('/me/activities', requireStudent, async (req, res) => {
  try {

    const student = await Student.findById(
      req.session.userId
    );

    const activityIds = Array.isArray(req.body.activityIds)
      ? req.body.activityIds
      : [];

    if (activityIds.length === 0) {
      return res.status(400).json({
        error: 'من فضلك اختر نشاط واحد على الأقل'
      });
    }

    const valid = await Activity.find({
      _id: { $in: activityIds },
      isActive: true
    }).select('_id name category');

    const hasSportsActivity = valid.some((activity) => {
      const name = String(activity.name || '');
      const category = String(activity.category || '');
      return name.includes('رياضي') || category.includes('رياضي');
    });

    if (hasSportsActivity && !student.studentPhotoPath) {
      return res.status(400).json({
        error: 'يجب رفع الصورة الشخصية عند اختيار نشاط رياضي'
      });
    }

    if (hasSportsActivity && !student.birthCertificatePath) {
      return res.status(400).json({
        error: 'يجب رفع شهادة الميلاد عند اختيار نشاط رياضي'
      });
    }

    if (
      student.paymentMethod === 'instapay' &&
      !student.paymentProofPath
    ) {
      return res.status(400).json({
        error: 'يجب رفع إيصال الدفع عند اختيار الدفع عن طريق إنستا باي'
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
      message: 'تم إرسال التسجيل بنجاح'
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'فشل إرسال التسجيل'
    });
  }
});

module.exports = router;
