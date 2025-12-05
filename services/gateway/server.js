const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const cors = require('cors');

const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 3000;  // HARDCODED LOCALHOST PORT

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to all requests
app.use(limiter);

// CORS
app.use(cors({
    origin: 'http://localhost:5173', // Allow React Frontend
    credentials: true
}));

// Debug logging
app.use((req, res, next) => {
    console.log(`[Gateway] ${req.method} ${req.url}`);
    next();
});

// Proxy Instances - HARDCODED TO LOCALHOST ONLY
const authProxy = createProxyMiddleware({ 
    target: 'http://localhost:3001',  // HARDCODED LOCALHOST
    changeOrigin: true,
    ws: true,
    secure: false
});

const productProxy = createProxyMiddleware({ 
    target: 'http://localhost:3002',  // HARDCODED LOCALHOST
    changeOrigin: true,
    secure: false
});

const orderProxy = createProxyMiddleware({ 
    target: 'http://localhost:3003',  // HARDCODED LOCALHOST
    changeOrigin: true,
    secure: false
});

// Manual Routing to prevent path stripping
app.use((req, res, next) => {
    const reqPath = req.path;

    // Order Service
    if (reqPath.startsWith('/api/user/orders') || 
        reqPath.startsWith('/api/orders') || 
        reqPath.startsWith('/api/purchase') || 
        reqPath.startsWith('/api/report') ||
        reqPath.startsWith('/api/cart')) {
        return orderProxy(req, res, next);
    }

    // Product Service
    if (reqPath.startsWith('/api/products')) {
        return productProxy(req, res, next);
    }

    // Auth Service
    if (reqPath.startsWith('/api/auth') || 
        reqPath.startsWith('/api/login') || 
        reqPath.startsWith('/api/signup') || 
        reqPath.startsWith('/api/logout') || 
        reqPath.startsWith('/api/admin') ||  // Admin endpoints
        reqPath.startsWith('/api/user') || 
        reqPath.startsWith('/auth')) {
        return authProxy(req, res, next);
    }

    next();
});

// Serve Static Files (React Build)
// In development, React runs on 5173, in production we serve from dist
const staticMiddleware = express.static(path.join(__dirname, '../../client/dist'));

// Only serve static files for non-API routes (Fallback)
app.use((req, res, next) => {
    staticMiddleware(req, res, next);
});

app.listen(PORT, () => {
    console.log(`Gateway running on port ${PORT}`);
    console.log(`Proxying Auth -> http://localhost:3001`);
    console.log(`Proxying Products -> http://localhost:3002`);
    console.log(`Proxying Orders -> http://localhost:3003`);
});

