# Login Fix

This version fixes the admin/staff login mismatch.

## Important
The old issue happened because `server.js` used `school_activity_app` while `seed.js` used `student_activity_management`. The app and seed now use the same database fallback.

## Use this `.env`

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/student_activity_management
SESSION_SECRET=replace_with_a_random_secret_at_least_32_characters
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123456!
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Reset admin login

```bash
npm install
npm run reset-admin
npm start
```

Then login from the Admin / Staff Login page with:

```txt
admin@example.com
Admin123456!
```

The login route also accepts old phone login temporarily, but email is the new recommended login method.
