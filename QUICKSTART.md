# 🚀 Quick Start Guide

## Complete Shopping Cart - React + Node.js Microservices

### 📋 Prerequisites
- Node.js v18 or higher
- MongoDB running on port 27017
- npm (comes with Node.js)

### 🔧 Installation Steps

#### Step 1: Install Backend Dependencies
```bash
cd shopping_cart_react
npm install
```

#### Step 2: Install Frontend Dependencies
```bash
cd client
npm install
cd ..
```

Or use the shortcut:
```bash
npm run install:all
```

#### Step 3: Configure Environment Variables
Make sure `.env` file exists in the root directory with:
```env
MONGODB_URI=mongodb://localhost:27017/shopping_cart
SESSION_SECRET=your-secret-key-change-this
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
BASE_URL=http://localhost:3000
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
NODE_ENV=development
```

#### Step 4: Start MongoDB
```bash
# Windows
mongod

# Or if MongoDB is installed as a service, it should already be running
```

#### Step 5: Run the Application
```bash
# From the root directory (shopping_cart_react)
npm run dev
```

This will start:
- ✅ React Frontend on http://localhost:5173
- ✅ Gateway Service on http://localhost:3000
- ✅ Auth Service on http://localhost:3001
- ✅ Product Service on http://localhost:3002
- ✅ Order Service on http://localhost:3003

### 🌐 Access the Application

Open your browser and go to: **http://localhost:5173**

### 👤 Test Accounts

Create a new account or use Google Sign-In!

### 📁 Project Structure

```
shopping_cart_react/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/       # Navbar, etc.
│   │   ├── context/          # AuthContext
│   │   ├── pages/            # All page components
│   │   ├── services/         # API service
│   │   ├── App.jsx           # Main App
│   │   └── main.jsx          # Entry point
│   └── package.json
│
├── services/                  # Microservices
│   ├── gateway/              # Port 3000
│   ├── auth/                 # Port 3001
│   ├── products/             # Port 3002
│   └── orders/               # Port 3003
│
├── src_backend/              # Shared backend code
│   ├── config/
│   ├── models/
│   ├── middleware/
│   └── utils/
│
├── .env                      # Environment variables
├── package.json              # Root package
└── README.md
```

### 🎯 Features

**Frontend (React):**
- ✅ Modern UI with React Router
- ✅ Context API for state management
- ✅ Protected routes
- ✅ Google OAuth integration
- ✅ 2FA/OTP verification
- ✅ Real-time product updates
- ✅ Admin dashboard
- ✅ Responsive design

**Backend (Microservices):**
- ✅ Auth Service (Login, Signup, Google OAuth, 2FA)
- ✅ Product Service (Catalog, Stock Management)
- ✅ Order Service (Purchases, Order History, Reports)
- ✅ API Gateway (Request Routing)
- ✅ MongoDB (Shared database)
- ✅ Session Management (Shared sessions)
- ✅ Email Service (OTP, Order confirmations)

### 🛠️ Development Commands

```bash
# Install all dependencies
npm run install:all

# Run everything (frontend + backend)
npm run dev

# Run only backend services
npm run server

# Run only React frontend
npm run client

# Build React for production
npm run build
```

### 📊 API Endpoints

All API calls go through the Gateway (port 3000), which proxies to:
- `/api/auth/*` → Auth Service (3001)
- `/api/products` → Product Service (3002)
- `/api/purchase`, `/api/orders` → Order Service (3003)

### 🔍 Troubleshooting

**MongoDB Connection Error:**
- Make sure MongoDB is running on port 27017
- Check MONGODB_URI in `.env`

**Port Already in Use:**
- Make sure no other services are running on ports 3000-3003 or 5173

**Google OAuth Not Working:**
- Configure Google OAuth credentials
- Set correct callback URL in Google Console

### 📝 Notes

- Frontend runs on port 5173 (React dev server with Vite)
- In production, React builds to `client/dist` and is served by Gateway
- All services connect to the same MongoDB instance
- Sessions are shared across all services via MongoDB

### 🎉 You're Ready!

Visit **http://localhost:5173** and start shopping!
