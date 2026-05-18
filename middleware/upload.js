const path = require('path');
const multer = require('multer');
const Student = require('../models/Student');

const defaultAllowed = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

function makeUpload(folder, allowedExtensions = defaultAllowed) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, folder),

    filename: async (req, file, cb) => {
      try {
        console.log("UPLOAD FILE NAME CODE IS RUNNING");
        const ext = path.extname(file.originalname).toLowerCase();

        const student = await Student.findById(req.session.userId);
        if (!student) return cb(new Error('Student not found'));

        let type = 'file';

        if (folder.includes('student-photos')) {
          type = 'student-photo';
        }

        if (folder.includes('birth-certificates')) {
          type = 'birth-certificate';
        }

        if (folder.includes('payment-proofs')) {
          type = 'payment-proof';
        }

        const fileName = `${student.studentCode}-${type}${ext}`;

        cb(null, fileName);

      } catch (err) {
        cb(err);
      }
    }
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return cb(new Error('Only allowed file types can be uploaded'));
      }
      cb(null, true);
    }
  });
}

module.exports = { makeUpload };
