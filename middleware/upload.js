const path = require('path');
const multer = require('multer');
const Student = require('../models/Student');

// List of dangerous extensions to block
const blockedExtensions = ['.exe', '.bat', '.sh', '.js', '.cmd'];

function makeUpload(folder, allowedExtensions = null) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, folder),

    filename: async (req, file, cb) => {
      try {
        const ext = path.extname(file.originalname).toLowerCase();

        // Prevent dangerous extensions
        if (blockedExtensions.includes(ext)) {
          return cb(new Error('File type not allowed'));
        }

        const student = await Student.findById(req.session.userId);
        if (!student) return cb(new Error('Student not found'));

        let type = 'file';
        if (folder.includes('student-photos')) type = 'student-photo';
        if (folder.includes('birth-certificates')) type = 'birth-certificate';
        if (folder.includes('payment-proofs')) type = 'payment-proof';

        const fileName = `${student.studentCode}-${type}${ext}`;
        cb(null, fileName);
      } catch (err) {
        cb(err);
      }
    }
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();

      // Block dangerous extensions
      if (blockedExtensions.includes(ext)) {
        return cb(new Error('File type not allowed'));
      }

      // Check allowed extensions if provided
      if (allowedExtensions && !allowedExtensions.includes(ext)) {
        return cb(new Error('Only allowed file types can be uploaded'));
      }

      cb(null, true);
    }
  });
}

module.exports = { makeUpload };
