# Student Activity Management System

A complete Node.js + MongoDB web application for managing student registrations, activity enrollment, teacher/admin dashboards, file uploads, team assignment, payment confirmation, and exports.

## Main Features

- Public student registration form
- Student login using generated student code
- Student dashboard with file upload and activity selection
- Teacher dashboard for viewing assigned students
- Admin dashboard for users, activities, categories, teams, reports, and exports
- Team builder with drag-and-drop / mobile move controls
- Registration open/close control with optional auto-close time
- Excel/CSV export endpoints
- MongoDB database using Mongoose
- Cloudinary-ready file upload configuration
- Clean URL routing

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- HTML, CSS, JavaScript
- bcryptjs authentication
- express-session + connect-mongo
- multer / Cloudinary storage

## Quick Start

```bash
npm install
cp .env.example .env
npm start
```

Then open:

```text
http://localhost:3000
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/student_activity_management
SESSION_SECRET=change-this-secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Demo Admin

Create your first admin account using the seed script or your own database setup. Change all demo credentials before production use.

## Production Notes

Before selling or deploying for a client:

- Change all secrets in `.env`
- Use a real MongoDB Atlas database
- Configure Cloudinary or another upload provider
- Remove sample data
- Use HTTPS
- Set strong passwords

## License

See `BUYER_LICENSE.txt`.
