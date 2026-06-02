# Fixed Login and Student Code Update

## Admin / Staff login
The admin/staff login now uses email instead of phone number.

Default seeded admin account:

- Email: admin@example.com
- Password: Admin123456!

To create or refresh the admin account, run:

```bash
npm run seed
```

You can change the default credentials in `.env`:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123456!
```

## Student code method
Student codes now use this generic format:

```text
YY + Gender + Department + Serial
```

Example:

```text
25MA001
```

Meaning:

- `25` = entry year 2025
- `M` = Male, `F` = Female
- `A` = Department A
- `001` = serial number

Department codes:

- Department A = A
- Department B = B
- Department C = C
- Upper Department = D
- Middle Department = E
