# 🛒 Shopping Cart - React + Node.js Microservices

Modern e-commerce application built with **React** frontend and **Node.js microservices** backend.

## 🏗️ Architecture

### Production (Vite + Vercel Serverless)
In production, the microservices are consolidated into a single monolithic Express backend to work seamlessly with **Vercel Serverless Functions**.

- **Frontend**: Built with Vite, served as static assets.
- **Backend**: Single entry point at `api/index.js` handling all logic (Auth, Product, Orders).

### Local Development (Microservices)
Local development use a distributed microservice architecture behind a Gateway.
- **Gateway**: localhost:3000
- **Auth**: localhost:3001
- **Product**: localhost:3002
- **Order**: localhost:3003

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB (running on port 27017)
- npm or yarn

### Installation

```bash
# Install all dependencies (root + client)
npm run install:all

# Or manually:
npm install
cd client && npm install
```

### Running the Application

```bash
# Start both frontend and backend
npm run dev

# This will start:
# - React Dev Server (http://localhost:5173)
# - Gateway Service (http://localhost:3000)
# - Auth Service (http://localhost:3001)
# - Product Service (http://localhost:3002)
# - Order Service (http://localhost:3003)
```

### Individual Commands

```bash
# Run only backend services
npm run server

# Run only React frontend
npm run client

# Build React for production
npm run build
```

## 📁 Project Structure

```
shopping_cart_react/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/    # React Components
│   │   ├── pages/         # Page Components
│   │   ├── context/       # Context API
│   │   ├── hooks/         # Custom Hooks
│   │   ├── services/      # API Services
│   │   ├── App.jsx        # Main App Component
│   │   └── main.jsx       # Entry Point
│   ├── public/            # Static Assets
│   └── package.json
│
├── api/                   # Consolidated Backend (for Vercel deployment)
│   └── index.js          # Unified entry point
│
├── services/              # Backend Microservices (Local Development)
│   ├── gateway/          # API Gateway (Port 3000)
│   ├── auth/             # Auth Service (Port 3001)
│   ├── products/         # Product Service (Port 3002)
│   └── orders/           # Order Service (Port 3003)
│
├── src_backend/          # Shared Backend Code
│   ├── config/          # Database, Passport, Email
│   ├── models/          # Mongoose Models
│   ├── middleware/      # Auth Middleware
│   └── utils/           # Email Service
│
├── vercel.json          # Vercel Deployment Configuration
├── .env                 # Environment Variables
├── package.json         # Root Package Config
└── README.md            # You are here
```

## 🎯 Features

### Frontend (React)
- ✅ Modern React with Hooks
- ✅ React Router for navigation
- ✅ Context API for state management
- ✅ Responsive design with dark mode support
- ✅ Protected routes
- ✅ Real-time cart updates
- ✅ Google OAuth integration
- ✅ 2FA/OTP verification
- ✅ Admin dashboard with analytics
- ✅ **Multi-category product filtering** 🆕
- ✅ Interactive category tags
- ✅ Advanced search and filters

### Backend (Microservices)
- ✅ Auth Service (Login, Signup, Google OAuth, 2FA)
- ✅ Product Service (Catalog, Stock Management)
- ✅ **Multi-category product support** 🆕
- ✅ Order Service (Purchases, Order History)
- ✅ API Gateway (Request Routing)
- ✅ MongoDB (Data Persistence)
- ✅ Session Management (Shared Sessions)
- ✅ Email Service (OTP, Confirmations)
- ✅ **Monolithic Vercel Support** 🆕
- ✅ **Robust ID Lookup (Numeric + ObjectId)** 🆕
- ✅ **Rate Limiting Protection**

## 🧪 Utility Scripts

I've included scripts to help you set up and seed your database:

```bash
# Generate 100 random products into categories
node add_100_products.js

# Create default admin and regular users
node create_users.js

# Promote specific users to admin
node check_admin_status.js
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/shopping_cart

# Session
SESSION_SECRET=your-secret-key-change-this

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
BASE_URL=http://localhost:3000

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Node Environment
NODE_ENV=development
```

## 📚 API Documentation

See `DETAILED_API_ARCHITECTURE.md` for complete API documentation.

## 🎨 Tech Stack

**Frontend:**
- React 18
- React Router 6
- Vite
- CSS3 (Modern styling)

**Backend:**
- Node.js
- Express.js
- MongoDB + Mongoose
- Passport.js (Google OAuth)
- Nodemailer (Email)
- http-proxy-middleware

## 🏷️ Multi-Category Feature

Products can now belong to multiple categories for better organization and filtering.

### How it works:

**Admin Dashboard:**
1. Navigate to **Products** tab
2. Click **Add Product** or edit existing product
3. Enter comma-separated categories: `Electronics, Gaming, Premium`
4. Categories appear as beautiful gradient tags in the products table

**User Experience:**
1. Visit the **Home Page**
2. See **Filter by Category** section with interactive buttons
3. Click any category to filter products instantly
4. Products show their category tags as badges
5. Click **"🌟 All Products"** to reset filter

**Examples:**
```
Laptop → Electronics, Work, Premium
Gaming Mouse → Gaming, Electronics, Accessories
Wireless Headphones → Electronics, Audio, Gaming
```

## ☁️ Vercel Deployment

1.  **Repo**: Push code to GitHub.
2.  **Import**: Connect your repo to Vercel.
3.  **Env Variables**: Add `MONGODB_URI`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `BASE_URL` (your deployment domain).
4.  **Automatic**: Vercel handles the build and deployment via the `vercel.json` and `api/` folder.

## 📄 License
MIT

