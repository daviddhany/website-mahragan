# Installation Guide

## 1. Requirements

Install these first:

- Node.js 20+
- npm
- MongoDB local database or MongoDB Atlas account
- Cloudinary account for uploaded files

## 2. Extract the Package

Unzip the package on your computer or server.

## 3. Install Dependencies

```bash
npm install
```

## 4. Create Environment File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

On Windows, you can copy it manually and rename it to `.env`.

## 5. Configure Database

For local MongoDB:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/student_activity_management
```

For MongoDB Atlas, paste your Atlas connection string:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/student_activity_management
```

## 6. Configure Cloudinary

Add your Cloudinary values:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 7. Configure Security

Use a long random session secret:

```env
SESSION_SECRET=replace_with_a_random_secret_at_least_32_characters
```

Set first admin credentials:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeThisStrongPassword123!
```

## 8. Create First Admin

```bash
npm run seed
```

## 9. Start the Website

```bash
npm start
```

Open:

```text
http://localhost:3000
```

## 10. Deployment Notes

Recommended hosting:

- Railway
- Render
- VPS
- Any Node.js hosting provider

Make sure production environment variables are added in the hosting dashboard.

## 11. Common Problems

### MongoDB connection failed
Check `MONGODB_URI`, username, password, and network access.

### Upload failed
Check Cloudinary credentials and allowed file type.

### Admin cannot login
Run `npm run seed` again after checking `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

### Session/cookie issues in production
Set `NODE_ENV=production` and use HTTPS.
