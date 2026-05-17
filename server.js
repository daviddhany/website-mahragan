require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('mongo-sanitize');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const { requireTeacher } = require('./middleware/auth');

const teacherRoutes = require('./routes/teachers');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const activityRoutes = require('./routes/activities');
const adminRoutes = require('./routes/admin');
const teamRoutes = require('./routes/teams');

const app = express();

// ===== Google Cloud Storage setup =====
const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  credentials: JSON.parse(process.env.GCLOUD_KEY_JSON),
});
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

// Multer memory storage for uploads
const upload = multer({ storage: multer.memoryStorage() });

// ===== App setup =====
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school_activity_app';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sanitize inputs
app.use((req, res, next) => {
  req.body = mongoSanitize(req.body);
  req.query = mongoSanitize(req.query);
  req.params = mongoSanitize(req.params);
  next();
});

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'محاولات كثيرة. حاول مرة أخرى لاحقًا.' },
});
app.use('/api/auth', authLimiter);
app.use('/api/students/register', authLimiter);

// ===== Session setup =====
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-this-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGODB_URI }),
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 4,
    },
  })
);

// ===== Routes =====
app.use('/api/teachers', teacherRoutes);
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/admin', adminRoutes);

// Home redirect
app.get('/', (req, res) => res.redirect('/public/index.html'));

// ===== Upload/download routes using GCS =====
const allowedFolders = ['student-photos', 'birth-certificates', 'payment-proofs'];

// Upload endpoint
app.post('/api/upload/:folder', requireTeacher, upload.single('file'), async (req, res) => {
  const folder = req.params.folder;
  if (!allowedFolders.includes(folder)) return res.status(403).send('Forbidden');

  try {
    const file = req.file;
    if (!file) return res.status(400).send('No file uploaded');

    const blob = bucket.file(`${folder}/${file.originalname}`);
    const blobStream = blob.createWriteStream({ resumable: false, contentType: file.mimetype });

    blobStream.on('finish', async () => {
      await blob.makePrivate(); // secure by default
      res.status(200).send(`Uploaded: ${file.originalname}`);
    });

    blobStream.on('error', (err) => res.status(500).send(err.message));
    blobStream.end(file.buffer);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Download endpoint using signed URLs
app.get('/protected/download/:folder/:filename', requireTeacher, async (req, res) => {
  const { folder, filename } = req.params;
  if (!allowedFolders.includes(folder)) return res.status(403).send('Forbidden');

  try {
    const file = bucket.file(`${folder}/${filename}`);
    const [exists] = await file.exists();
    if (!exists) return res.status(404).send('File not found');

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    res.redirect(url);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ===== Error handler =====
app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message || 'Request failed' });
  next();
});

// ===== Connect MongoDB =====
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });