const path = require('path');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Student = require('../models/Student');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const defaultAllowed = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

function makeUpload(folder, allowedExtensions = defaultAllowed) {

  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {

      const ext = path.extname(file.originalname).toLowerCase();

      const student = await Student.findById(req.session.userId);

      if (!student) {
        throw new Error('Student not found');
      }

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

      const public_id = `${student.studentCode}-${type}`;

      return {
        folder: 'students',
        resource_type: 'auto',
        public_id,
      };
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