const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo');
const multer = require('multer');
const fs = require('fs');
const xlsx = require('xlsx');
const rateLimit = require('express-rate-limit');

// Models
const User = require('../src_backend/models/User');
const Product = require('../src_backend/models/Product');
const Order = require('../src_backend/models/Order');
const Cart = require('../src_backend/models/Cart');

// Config
const connectDB = require('../src_backend/config/database');
const configurePassport = require('../src_backend/config/passport');

// Utils
const { 
    sendOTPEmail, 
    sendOrderConfirmationEmail 
} = require('../src_backend/utils/emailService');

const app = express();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Middleware
app.set('trust proxy', 1);
app.use(cors({
    origin: true, // In production, we can be more specific, but 'true' works for multiple subdomains
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database
connectDB();

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/React',
        ttl: 24 * 60 * 60,
        autoRemove: 'native'
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());
configurePassport();

// Multer (using /tmp for Vercel)
const upload = multer({ dest: '/tmp' });

// --- MIDDLEWARES ---

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: 'Not authenticated' });
};

const isAdmin = async (req, res, next) => {
    // Check for Bot Token (Remote Access)
    const botToken = req.headers['x-bot-token'];
    if (botToken && botToken === process.env.ADMIN_BOT_TOKEN) {
        return next();
    }

    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    const user = await User.findById(req.user._id);
    if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    next();
};

// --- AUTH ROUTES ---

app.get('/api/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ authenticated: true, user: req.user });
    } else {
        res.json({ authenticated: false });
    }
});

app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password, phoneNumber } = req.body;
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) return res.status(400).json({ error: 'Username or email already exists' });

        const newUser = new User({
            username, email, password, phoneNumber,
            isVerified: false,
            createdAt: new Date()
        });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        newUser.otpCode = otp;
        newUser.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await newUser.save();

        const emailResult = await sendOTPEmail(email, otp, 'signup');

        req.session.googleAuth = {
            userId: newUser._id,
            otp: otp,
            otpExpires: newUser.otpExpires.getTime(),
            isExistingUser: false,
            emailSuccess: emailResult.success,
            fallbackOtp: emailResult.success ? null : otp
        };

        res.status(201).json({ 
            message: 'User created. Please verify OTP.',
            require2FA: true,
            userId: newUser._id,
            emailSuccess: emailResult.success,
            fallbackOtp: emailResult.success ? null : otp
        });
    } catch (err) {
        res.status(400).json({ error: err.message || 'Error creating user' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        let { username, password } = req.body;
        username = username ? username.trim() : '';
        password = password ? password.trim() : '';
        
        const user = await User.findOne({ username });
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otpCode = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        const emailResult = await sendOTPEmail(user.email, otp, 'login');

        req.session.googleAuth = {
            userId: user._id,
            otp: otp,
            otpExpires: user.otpExpires.getTime(),
            isExistingUser: true,
            emailSuccess: emailResult.success,
            fallbackOtp: emailResult.success ? null : otp
        };

        res.json({ 
            require2FA: true, 
            userId: user._id,
            emailSuccess: emailResult.success,
            fallbackOtp: emailResult.success ? null : otp
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        req.session.destroy();
        res.json({ message: 'Logged out successfully' });
    });
});

// Google Auth
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

const googleCallbackHandler = (req, res, next) => {
    passport.authenticate('google', async (err, user, info) => {
        if (err) return next(err);
        
        const profile = user ? { ...user.toObject(), existingUser: true } : info.profile;
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : (user ? user.email : null);
        if (!email) return res.redirect('/login.html?error=no_email');

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        req.session.googleAuth = {
            profile: { id: profile.id, displayName: profile.displayName, emails: profile.emails },
            otp: otp,
            otpExpires: Date.now() + 10 * 60 * 1000,
            isExistingUser: !!user,
            userId: user ? user._id : null
        };

        const emailResult = await sendOTPEmail(email, otp, 'google-login');
        req.session.googleAuth.emailSuccess = emailResult.success;
        if (!emailResult.success) req.session.googleAuth.fallbackOtp = otp;

        const getFrontendUrl = () => {
            const rawBase = process.env.BASE_URL || process.env.VERCEL_URL || '';
            const domain = rawBase.replace(/^https?:\/\//, '');
            return domain ? `https://${domain}` : '';
        };
        const frontendUrl = getFrontendUrl();
        let redirectUrl = `${frontendUrl}/google-otp`;
        if (emailResult.etherealUrl) redirectUrl += `?preview=${encodeURIComponent(emailResult.etherealUrl)}`;
        
        req.session.save(() => res.redirect(redirectUrl));
    })(req, res, next);
};

app.get('/api/auth/google/callback', googleCallbackHandler);
app.get('/auth/google/callback', googleCallbackHandler);

app.get('/api/auth/google/session-info', (req, res) => {
    const sessionData = req.session.googleAuth;
    if (!sessionData) return res.status(400).json({ error: 'No active session' });
    res.json({
        hasSession: true,
        emailSuccess: sessionData.emailSuccess || false,
        fallbackOtp: (!sessionData.emailSuccess && sessionData.fallbackOtp) ? sessionData.fallbackOtp : undefined
    });
});

app.post('/api/auth/google/complete', async (req, res) => {
    try {
        const { username, phone } = req.body;
        const sessionData = req.session.googleAuth;
        if (!sessionData || !sessionData.otpVerified) return res.status(403).json({ error: 'Unauthorized' });

        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ error: 'Username taken' });

        let user;
        if (sessionData.userId) {
            user = await User.findById(sessionData.userId);
            if (user) {
                user.username = username;
                user.phoneNumber = phone;
                user.isVerified = true;
                await user.save();
            }
        }

        if (!user && sessionData.profile) {
            user = new User({
                username,
                email: sessionData.profile.emails[0].value,
                googleId: sessionData.profile.id,
                displayName: sessionData.profile.displayName,
                phoneNumber: phone,
                isVerified: true
            });
            await user.save();
        }

        if (!user) return res.status(400).json({ error: 'Could not complete profile' });

        req.login(user, (err) => {
            delete req.session.googleAuth;
            req.session.save(() => res.json({ message: 'Success', username: user.username }));
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/google/verify-otp', async (req, res) => {
    try {
        const { otp } = req.body;
        const sessionData = req.session.googleAuth;
        if (!sessionData || sessionData.otp !== otp || Date.now() > sessionData.otpExpires) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }
        sessionData.otpVerified = true;
        if (sessionData.userId) {
            const user = await User.findById(sessionData.userId);
            if (user) {
                user.isVerified = true;
                await user.save();
                return req.login(user, (err) => {
                    delete req.session.googleAuth;
                    req.session.save(() => res.json({ message: 'Success', redirect: '/' }));
                });
            }
        }
        res.json({ message: 'OTP verified', redirect: '/google-complete' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/verify-2fa', async (req, res) => {
    try {
        const { otp } = req.body;
        const sessionData = req.session.googleAuth;

        if (!sessionData || sessionData.otp !== otp || Date.now() > sessionData.otpExpires) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        const user = await User.findById(sessionData.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        user.isVerified = true;
        user.lastLogin = new Date();
        await user.save();

        req.login(user, (err) => {
            if (err) return res.status(500).json({ error: 'Login failed' });
            delete req.session.googleAuth;
            req.session.save(() => res.json({ message: 'Success', username: user.username }));
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- PRODUCT ROUTES ---

app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/products', isAdmin, async (req, res) => {
    try {
        const { name, description, image, price, stock } = req.body;
        const lastProduct = await Product.findOne().sort({ id: -1 });
        const newId = lastProduct ? lastProduct.id + 1 : 1;
        const product = new Product({ id: newId, name, description, image, price, stock });
        await product.save();
        res.status(201).json(product);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

const getProductQuery = (id) => {
    return mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id: Number(id) || id };
};

app.patch('/api/products/:id', isAdmin, async (req, res) => {
    try {
        const query = getProductQuery(req.params.id);
        const product = await Product.findOneAndUpdate(query, req.body, { new: true });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/products/:id', isAdmin, async (req, res) => {
    try {
        const query = getProductQuery(req.params.id);
        const product = await Product.findOneAndDelete(query);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- ORDER & CART ROUTES ---

app.get('/api/cart', isAuthenticated, async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
        if (!cart) cart = await Cart.create({ userId: req.user._id, items: [] });
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/cart', isAuthenticated, async (req, res) => {
    try {
        const { productId } = req.body;
        const query = getProductQuery(productId);
        const product = await Product.findOne(query);
        if (!product || product.stock <= 0) return res.status(400).json({ error: 'Out of stock' });

        product.stock -= 1;
        await product.save();

        let cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) cart = new Cart({ userId: req.user._id, items: [] });

        const itemIndex = cart.items.findIndex(i => i.productId.toString() === productId);
        if (itemIndex > -1) cart.items[itemIndex].quantity++;
        else cart.items.push({ productId, quantity: 1 });

        await cart.save();
        await cart.populate('items.productId');
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/cart/:productId', isAuthenticated, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) return res.status(404).json({ error: 'Cart not found' });

        const item = cart.items.find(i => i.productId.toString() === req.params.productId);
        if (item) {
            const query = getProductQuery(req.params.productId);
            await Product.findOneAndUpdate(query, { $inc: { stock: item.quantity } });
            cart.items = cart.items.filter(i => i.productId.toString() !== req.params.productId);
            await cart.save();
        }
        await cart.populate('items.productId');
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/cart/checkout', isAuthenticated, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
        if (!cart || cart.items.length === 0) return res.status(400).json({ error: 'Cart empty' });

        const orders = [];
        for (const item of cart.items) {
            const order = new Order({
                userId: req.user._id,
                productId: item.productId._id,
                amount: item.productId.price * item.quantity,
                status: 'confirmed',
                date: new Date()
            });
            await order.save();
            orders.push(order);
        }

        cart.items = [];
        await cart.save();
        
        if (orders.length > 0) {
            await sendOrderConfirmationEmail(req.user.email, req.user.username, {
                productName: orders[0].productId.name,
                quantity: cart.items.length, // approximation
                total: orders.reduce((acc, o) => acc + o.amount, 0)
            });
        }

        res.json({ message: 'Checkout successful', orders });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/user/orders', isAuthenticated, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id }).populate('productId').sort({ date: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- ADMIN ROUTES ---

app.get('/api/orders', isAdmin, async (req, res) => {
    try {
        const orders = await Order.find().populate('userId', 'username email').populate('productId', 'name price');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password -otpCode -otpExpires');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.patch('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isAdmin: req.body.isAdmin }, { new: true });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- PROFILE ROUTES ---

app.patch('/api/user/profile', isAuthenticated, async (req, res) => {
    try {
        const { username, phoneNumber, address } = req.body;
        const user = await User.findById(req.user._id);
        if (username && username !== user.username) {
            if (await User.findOne({ username })) return res.status(400).json({ error: 'Username taken' });
            user.username = username;
        }
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
        if (address !== undefined) user.address = address;
        await user.save();
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/user/profile-photo', isAuthenticated, upload.single('profilePhoto'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    try {
        const user = await User.findById(req.user._id);
        user.profilePhoto = `/api/uploads/${req.file.filename}`;
        await user.save();
        res.json({ message: 'Photo updated', photoUrl: user.profilePhoto });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/user/email/request-change', isAuthenticated, async (req, res) => {
    try {
        const { newEmail } = req.body;
        if (await User.findOne({ email: newEmail })) return res.status(400).json({ error: 'Email taken' });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        req.session.emailChange = { newEmail, otp, otpExpires: Date.now() + 10 * 60 * 1000 };
        const result = await sendOTPEmail(req.user.email, otp, 'email-change');
        res.json({ message: 'Code sent', emailSuccess: result.success, fallbackOtp: result.success ? null : otp });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/user/email/confirm-change', isAuthenticated, async (req, res) => {
    const sessionData = req.session.emailChange;
    if (!sessionData || sessionData.otp !== req.body.otp || Date.now() > sessionData.otpExpires) {
        return res.status(400).json({ error: 'Invalid or expired code' });
    }
    try {
        const user = await User.findById(req.user._id);
        user.email = sessionData.newEmail;
        await user.save();
        delete req.session.emailChange;
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/admin/stats', isAdmin, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const ordersToday = await Order.find({ date: { $gte: today } });
        const totalOrders = await Order.countDocuments();
        const revenueToday = ordersToday.reduce((sum, o) => sum + o.amount, 0);
        const topProducts = await Order.aggregate([
            { $group: { _id: "$productId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 3 }
        ]);

        await Product.populate(topProducts, { path: '_id', select: 'name' });

        res.json({
            today: {
                orders: ordersToday.length,
                revenue: revenueToday
            },
            allTime: {
                orders: totalOrders
            },
            topProducts: topProducts.map(p => ({ name: p._id?.name || 'Unknown', count: p.count }))
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- BOT SPECIFIC ENDPOINTS (Admin Auth Required) ---

// Find user by phone (cleaned)
app.get('/api/admin/users/by-phone/:phone', isAdmin, async (req, res) => {
    try {
        const phone = req.params.phone.replace(/\D/g, '').slice(-10); // Last 10 digits
        const user = await User.findOne({ 
            phoneNumber: { $regex: phone + '$' } 
        }).select('-password -otpCode');
        
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get recent orders for bot
app.get('/api/admin/orders/user/:userId', isAdmin, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId })
            .populate('productId', 'name price')
            .sort({ date: -1 })
            .limit(5);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Direct Cart Management (for Bot)
app.get('/api/admin/cart/:userId', isAdmin, async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.params.userId }).populate('items.productId');
        if (!cart) cart = await Cart.create({ userId: req.params.userId, items: [] });
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/admin/cart/:userId', isAdmin, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const query = getProductQuery(productId);
        const product = await Product.findOne(query);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        let cart = await Cart.findOne({ userId: req.params.userId });
        if (!cart) cart = new Cart({ userId: req.params.userId, items: [] });

        const itemIndex = cart.items.findIndex(i => i.productId.toString() === productId);
        if (itemIndex > -1) cart.items[itemIndex].quantity += (quantity || 1);
        else cart.items.push({ productId, quantity: (quantity || 1) });

        await cart.save();
        res.json({ success: true, cart });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/admin/orders/track/:orderId', isAdmin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).populate('productId', 'name');
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/admin/users/lookup/:username', isAdmin, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('-password -otpCode');
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const orderCount = await Order.countDocuments({ userId: user._id });
        res.json({
            user,
            orderCount
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/admin/low-stock', isAdmin, async (req, res) => {
    try {
        const lowStock = await Product.find({ stock: { $lt: 5 } }).limit(10);
        res.json(lowStock);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/admin/users/phones', isAdmin, async (req, res) => {
    try {
        const users = await User.find({ isVerified: true, phoneNumber: { $exists: true, $ne: '' } }).select('phoneNumber');
        const phones = users.map(u => u.phoneNumber);
        res.json(phones);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/report', isAdmin, async (req, res) => {
    try {
        const orders = await Order.find().populate('userId').populate('productId');
        const data = orders.map(o => ({
            OrderID: o._id,
            Username: o.userId?.username,
            Email: o.userId?.email,
            Product: o.productId?.name,
            Price: o.amount,
            Date: o.date,
            Status: o.status
        }));
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, "Orders");
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'csv' });
        res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
        res.setHeader('Content-Type', 'text/csv');
        res.send(buffer);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = app;
