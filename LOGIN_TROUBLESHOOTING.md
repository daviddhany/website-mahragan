# Login Troubleshooting

The admin/staff login uses email, not phone.

## Correct `.env`

```env
MONGODB_URI=mongodb://127.0.0.1:27017/student_activity_management
SESSION_SECRET=replace_with_a_random_secret_at_least_32_characters
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123456!
```

Do not use `ADMIN_PHONE` for login anymore.

## Reset admin

Run:

```bash
npm run seed
```

Then login from `/public/teacher-login.html` with:

```txt
Email: admin@example.com
Password: Admin123456!
```

If your `.env` has `ADMIN_PASSWORD=123456789`, then the password after seed will be `123456789`, not `Admin123456!`.

## Important

Make sure the `MONGODB_URI` in `.env` is the same database used by the running server. If you seed one database and run the server using another database, login will fail.
