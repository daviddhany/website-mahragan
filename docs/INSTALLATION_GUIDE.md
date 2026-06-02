# Installation Guide

## 1. Requirements

- Node.js 18 or newer
- MongoDB database (local MongoDB or MongoDB Atlas)
- Cloudinary account if you want cloud file uploads

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Example configuration:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/student_activity_management
SESSION_SECRET=replace-with-a-long-random-secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

For MongoDB Atlas, use a connection string like:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/student_activity_management
```

## 4. Run the App

```bash
npm start
```

Open:

```text
http://localhost:3000
```

## 5. Create Admin User

Use the seed script or create an admin user manually in the database. Change all demo credentials before production.

## 6. Production Checklist

- Use HTTPS.
- Set a strong `SESSION_SECRET`.
- Use MongoDB Atlas or another production database.
- Configure Cloudinary credentials.
- Remove sample data.
- Test student registration, login, uploads, activities, teams, and exports.
- Update organization name, logo, colors, and default activity categories.

## 7. Main Pages

- Home / Landing page
- Student registration
- Student login
- Student dashboard
- Teacher login
- Teacher dashboard
- Admin management pages
- Reports page

## 8. Support Notes

This is a source-code product. Buyers are expected to know how to install Node.js applications or hire a developer for setup.
