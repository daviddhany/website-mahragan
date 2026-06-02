# Church Registration & Team Management System

A complete Node.js + MongoDB web application for managing church, school, ministry, or festival registration.

## Main Features

- Online student/participant registration
- Student login and password change
- Teacher/servant dashboard
- Admin dashboard
- Role-based access control
- Activity and category management
- Team creation and team member management
- Registration open/close control
- Payment confirmation tracking
- File uploads for required documents
- Search and filtering
- CSV/Excel export
- Clean hidden page URLs
- MongoDB session storage
- Password hashing with bcrypt
- Production-ready environment configuration

## Tech Stack

- Node.js 20
- Express.js
- MongoDB + Mongoose
- HTML, CSS, JavaScript
- Cloudinary for file uploads
- Express Session + Connect Mongo
- Helmet and rate limiting

## Quick Start

```bash
npm install
cp .env.example .env
npm run seed
npm start
```

Open the app:

```text
http://localhost:3000
```

## Environment Setup

Create a `.env` file using `.env.example`.

Required values:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/church_registration_app
SESSION_SECRET=replace_with_a_random_secret_at_least_32_characters
ADMIN_PHONE=01000000000
ADMIN_PASSWORD=ChangeThisStrongPassword123!
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Create First Admin

```bash
npm run seed
```

The admin phone and password are read from `.env`.

## Production Checklist

Before using this system with real data:

- Change all `.env` values.
- Use a strong `SESSION_SECRET`.
- Use a strong admin password.
- Use HTTPS.
- Restrict MongoDB Atlas network access when possible.
- Do not upload real client data in demo copies.
- Back up the database regularly.
- Review `docs/INSTALLATION_GUIDE.md`.

## Buyer Notes

This package does not include real student data, database credentials, Cloudinary keys, or private deployment secrets. Buyers must provide their own database and Cloudinary account.

## Customization

You can customize:

- Logos inside `public/`
- Page text inside `public/*.html`
- Styles inside `public/styles.css`
- Services/classes inside the relevant models and route validation files
- Activities and categories from the admin dashboard

## License

See `BUYER_LICENSE.txt`.
