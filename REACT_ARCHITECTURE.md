# 🏗️ React Shopping Cart - Complete Architecture

## 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                    http://localhost:5173                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              REACT APPLICATION (SPA)                       │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  React Router                                        │ │ │
│  │  │  • /login                                            │ │ │
│  │  │  • /signup                                           │ │ │
│  │  │  • / (Home - Protected)                              │ │ │
│  │  │  • /profile (Protected)                              │ │ │
│  │  │  • /orders (Protected)                               │ │ │
│  │  │  • /admin (Admin Only)                               │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Auth Context (Global State)                         │ │ │
│  │  │  • user: { username, email, isAdmin }                │ │ │
│  │  │  • login(userData)                                   │ │ │
│  │  │  • logout()                                          │ │ │
│  │  │  • checkAuthStatus()                                 │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  API Service                                         │ │ │
│  │  │  • login(), signup(), verify2FA()                    │ │ │
│  │  │  • getProducts(), purchase()                         │ │ │
│  │  │  • getUserOrders(), getAllOrders()                   │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                    API Calls via Vite Proxy
                    (fetch with credentials)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              VITE DEV SERVER (Development Only)                  │
│                      Port 5173                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Proxy Configuration:                                    │   │
│  │  • /api/* → http://localhost:3000                        │   │
│  │  • /auth/* → http://localhost:3000                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   🚪 GATEWAY SERVICE                             │
│                      Port: 3000                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  HTTP Proxy Middleware:                                  │   │
│  │  • /api/auth/* → Auth Service (3001)                     │   │
│  │  • /api/login → Auth Service (3001)                      │   │
│  │  • /api/signup → Auth Service (3001)                     │   │
│  │  • /api/logout → Auth Service (3001)                     │   │
│  │  • /api/products → Product Service (3002)                │   │
│  │  • /api/purchase → Order Service (3003)                  │   │
│  │  • /api/orders → Order Service (3003)                    │   │
│  │  • /api/user/orders → Order Service (3003)               │   │
│  │  • /auth/google/* → Auth Service (3001)                  │   │
│  │                                                           │   │
│  │  Static Files (Production):                              │   │
│  │  • Serves client/dist (React build)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└────┬──────────────┬──────────────┬─────────────────────────────┘
     │              │              │
     ▼              ▼              ▼
┌─────────┐   ┌──────────┐   ┌──────────┐
│  🔐     │   │  📦      │   │  🛒      │
│  AUTH   │   │ PRODUCT  │   │  ORDER   │
│ SERVICE │   │ SERVICE  │   │ SERVICE  │
│  3001   │   │  3002    │   │  3003    │
└────┬────┘   └────┬─────┘   └────┬─────┘
     │             │              │
     └─────────────┴──────────────┘
                   │
                   ▼
         ┌──────────────────┐
         │   🗄️ MongoDB     │
         │    Port: 27017   │
         │                  │
         │  Collections:    │
         │  • users         │
         │  • products      │
         │  • orders        │
         │  • sessions      │
         └──────────────────┘
```

## 🎯 React Component Tree

```
App (Router)
├── AuthProvider (Context)
│   ├── Login
│   │   └── (handles 2FA, Google OAuth)
│   ├── Signup
│   │   └── (handles 2FA verification)
│   ├── GoogleOTP
│   ├── GoogleComplete
│   │
│   ├── ProtectedRoute
│   │   ├── Home
│   │   │   ├── Navbar
│   │   │   └── (Product Grid)
│   │   ├── Profile
│   │   │   ├── Navbar
│   │   │   └── (User Details)
│   │   ├── Orders
│   │   │   ├── Navbar
│   │   │   └── (Order List)
│   │   └── Cart
│   │       ├── Navbar
│   │       └── (Placeholder)
│   │
│   └── AdminRoute
│       └── Admin
│           ├── Navbar
│           ├── (Stats Cards)
│           └── (Orders Table)
```

## 🔄 Data Flow Examples

### Flow 1: User Login with 2FA

```
┌─────────┐
│  USER   │ Enters username/password
└────┬────┘
     │
     ▼
┌─────────────────┐
│  Login.jsx      │
│  handleLogin()  │
└────┬────────────┘
     │ api.login(username, password)
     ▼
┌─────────────────┐
│  api.js         │
│  POST /api/login│
└────┬────────────┘
     │ fetch with credentials: 'include'
     ▼
┌─────────────────┐
│  Vite Proxy     │ Proxy to localhost:3000
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Gateway (3000) │ Route to Auth Service
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Auth Service    │
│  (3001)         │
│  POST /api/login│
└────┬────────────┘
     │ 1. Find user in MongoDB
     │ 2. Verify password
     │ 3. Generate OTP
     │ 4. Send email
     │ 5. Store OTP in session
     ▼
┌─────────────────┐
│  Response       │
│  {require2FA:   │
│   true,         │
│   fallbackOtp}  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Login.jsx      │
│  setShow2FA()   │
│  (Show OTP form)│
└────┬────────────┘
     │
     ▼
┌─────────┐
│  USER   │ Enters OTP code
└────┬────┘
     │
     ▼
┌─────────────────┐
│  Login.jsx      │
│  handleVerify2FA│
└────┬────────────┘
     │ api.verify2FA(otp)
     ▼
┌─────────────────┐
│  Auth Service   │
│  POST /api/auth │
│  /verify-2fa    │
└────┬────────────┘
     │ 1. Validate OTP
     │ 2. Create session (Passport)
     │ 3. Mark user verified
     ▼
┌─────────────────┐
│  Response       │
│  {message,      │
│   username}     │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Login.jsx      │
│  login(userData)│
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  AuthContext    │
│  setUser()      │
│  localStorage   │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  React Router   │
│  navigate('/')  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Home.jsx       │
│  (Logged In!)   │
└─────────────────┘
```

### Flow 2: Viewing Products

```
┌─────────┐
│  USER   │ Navigates to /
└────┬────┘
     │
     ▼
┌─────────────────┐
│  Home.jsx       │
│  useEffect()    │
└────┬────────────┘
     │ loadProducts()
     ▼
┌─────────────────┐
│  api.js         │
│  GET /api/      │
│  products       │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Gateway        │ → Product Service (3002)
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Product Service│
│  GET /api/      │
│  products       │
└────┬────────────┘
     │ Product.find()
     ▼
┌─────────────────┐
│  MongoDB        │
│  products       │
│  collection     │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Response       │
│  [{product1},   │
│   {product2}...]│
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Home.jsx       │
│  setProducts()  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  React Render   │
│  Product Cards  │
└─────────────────┘
```

### Flow 3: Making a Purchase

```
┌─────────┐
│  USER   │ Clicks "Buy Now"
└────┬────┘
     │
     ▼
┌─────────────────┐
│  Home.jsx       │
│  handlePurchase │
└────┬────────────┘
     │ api.purchase(productId)
     ▼
┌─────────────────┐
│  api.js         │
│  POST /api/     │
│  purchase       │
└────┬────────────┘
     │ credentials: 'include' (session cookie)
     ▼
┌─────────────────┐
│  Gateway        │ → Order Service (3003)
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Order Service  │
│  POST /api/     │
│  purchase       │
└────┬────────────┘
     │ 1. Check auth (session)
     │ 2. Verify user is verified
     │ 3. Find product
     │ 4. Check stock > 0
     │ 5. Check no duplicate order
     │ 6. Create Order
     │ 7. Decrement stock
     │ 8. Send confirmation email
     ▼
┌─────────────────┐
│  MongoDB        │
│  • Save order   │
│  • Update stock │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Response       │
│  {message,      │
│   productName}  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Home.jsx       │
│  alert()        │
│  loadProducts() │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  UI Update      │
│  Stock updated  │
└─────────────────┘
```

## 🔐 Authentication Flow

### Session Management

```
┌─────────────────────────────────────┐
│  Session Cookie                     │
│  • Name: connect.sid                │
│  • Secure: production only          │
│  • SameSite: lax (dev), none (prod) │
│  • HttpOnly: true                   │
│  • MaxAge: 24 hours                 │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  MongoDB Sessions Collection        │
│  {                                  │
│    _id: "session_id",               │
│    expires: Date,                   │
│    session: {                       │
│      passport: {                    │
│        user: ObjectId  // userId    │
│      }                              │
│    }                                │
│  }                                  │
└─────────────────────────────────────┘
```

### Protected Route Check

```
┌─────────────────┐
│  User navigates │
│  to /orders     │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  ProtectedRoute │
│  Component      │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  useAuth()      │
│  Check user     │
└────┬────────────┘
     │
   ┌─┴─┐
   │ ? │ user exists?
   └─┬─┘
     │
  Yes│         No
     │          │
     ▼          ▼
┌─────────┐  ┌─────────────┐
│ Render  │  │ Navigate to │
│ Children│  │ /login      │
└─────────┘  └─────────────┘
```

## 📦 File Structure with Responsibilities

```
client/src/
│
├── main.jsx                 # React app entry point
├── App.jsx                  # Router setup, route definitions
├── App.css                  # Global styles, CSS variables
│
├── context/
│   └── AuthContext.jsx      # Global auth state, login/logout
│
├── services/
│   └── api.js               # All API endpoint calls
│
├── components/
│   ├── Navbar.jsx           # Navigation bar
│   └── Navbar.css
│
└── pages/
    ├── Login.jsx            # Login with 2FA
    ├── Signup.jsx           # Signup with verification
    ├── GoogleOTP.jsx        # Google OAuth OTP
    ├── GoogleComplete.jsx   # Complete Google profile
    ├── Home.jsx             # Product catalog
    ├── Profile.jsx          # User profile
    ├── Orders.jsx           # Order history
    ├── Cart.jsx             # Shopping cart (placeholder)
    ├── Admin.jsx            # Admin dashboard
    │
    ├── Auth.css             # Auth pages styling
    ├── Home.css             # Home page styling
    ├── Orders.css           # Orders page styling
    ├── Profile.css          # Profile page styling
    ├── Cart.css             # Cart page styling
    └── Admin.css            # Admin page styling
```

---

**This architecture provides:**
- ✅ Separation of concerns
- ✅ Reusable components
- ✅ Centralized state management
- ✅ Type-safe API calls
- ✅ Protected routing
- ✅ Modern development workflow
