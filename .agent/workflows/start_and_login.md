---
description: Start the Shopping Cart application (Backend & Frontend) and log in as Admin.
---

1. Kill any running Node.js processes to ensure a clean state.
// turbo
Run: `taskkill /F /IM node.exe`

2. Ensure the admin user exists in the database.
// turbo
Run: `node create_users.js`

3. Start the Backend Services (Gateway, Auth, Products, Orders).
// turbo
Run: `npm run server`

4. Start the Frontend Client (Vite).
// turbo
Run: `npm run client`

5. Wait for about 10 seconds for the services to fully initialize.

6. Open the browser and log in.
Use the browser tool to:
- Navigate to `http://localhost:5173/login`
- Login with username `admin_user` and password `Admin123!`
- If a 2FA screen appears, read the fallback OTP from the screen (element with class `otp-display`) and enter it.
- Verify the login is successful.
