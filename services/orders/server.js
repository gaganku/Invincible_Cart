const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const xlsx = require('xlsx');

// Models
const Order = require('../../src_backend/models/Order');
const Product = require('../../src_backend/models/Product');
const User = require('../../src_backend/models/User');
const Cart = require('../../src_backend/models/Cart');

// Config
const connectDB = require('../../src_backend/config/database');

// Email Service
const { sendOrderConfirmationEmail } = require('../../src_backend/utils/emailService');

const app = express();
const PORT = 3003;

// Middleware
app.set('trust proxy', 1);
app.use(cors({
    origin: 'http://localhost:5173', // Allow React Frontend
    credentials: true
}));
app.use(bodyParser.json());

// Database
connectDB();

// Session (Must match Auth Service for shared sessions)
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

// Note: We don't need Passport here, just session checking

// Middleware to check auth
const isAuthenticated = (req, res, next) => {
    // Check if user session exists (set by Auth Service)
    if (req.session && req.session.passport && req.session.passport.user) {
        return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
};

const isAdmin = async (req, res, next) => {
    if (req.session && req.session.passport && req.session.passport.user) {
        const user = await User.findById(req.session.passport.user);
        if (user && user.isAdmin) {
            return next();
        }
    }
    res.status(403).json({ error: 'Admin access required' });
};

// Routes

// Purchase
app.post('/api/purchase', isAuthenticated, async (req, res) => {
    try {
        const { productId } = req.body;
        
        // Get user from session
        const user = await User.findById(req.session.passport.user);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (!user.isVerified) {
            return res.status(403).json({ error: 'Please verify your email/phone before purchasing.' });
        }

        const product = await Product.findOne({ id: productId });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        if (product.stock <= 0) return res.status(400).json({ error: 'Out of stock' });

        // Check if user already bought this (Limit 1)
        const existingOrder = await Order.findOne({ 
            userId: user._id, 
            'productId': product._id,
            status: { $ne: 'cancelled' }
        });

        if (existingOrder) {
            return res.status(400).json({ error: 'You can only buy one item of each type.' });
        }

        // Create Order
        const order = new Order({
            userId: user._id,
            productId: product._id,
            amount: product.price,
            status: 'pending',
            date: new Date()
        });

        // Decrement Stock
        product.stock -= 1;
        await product.save();
        await order.save();

        // Send Email
        if (user.email) {
            try {
                await sendOrderConfirmationEmail(user.email, order, product);
            } catch (e) { console.error(e); }
        }

        res.json({ message: 'Purchase successful', productName: product.name });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// User Orders
app.get('/api/user/orders', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.passport.user);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const orders = await Order.find({ userId: user._id })
            .populate('productId')
            .sort({ date: -1 });
        console.log('[GET ORDERS] Found', orders.length, 'orders for user:', user._id);
        console.log('[GET ORDERS] Orders:', JSON.stringify(orders, null, 2));
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- CART ENDPOINTS ---

// Get Cart
app.get('/api/cart', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.passport.user;
        let cart = await Cart.findOne({ userId }).populate('items.productId');
        
        if (!cart) {
            cart = new Cart({ userId, items: [] });
            await cart.save();
        }
        
        // Filter out null products (if deleted)
        cart.items = cart.items.filter(item => item.productId);
        res.json(cart);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add to Cart
app.post('/api/cart', isAuthenticated, async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.passport.user;

        const product = await Product.findOne({ _id: productId }); // Use _id
        if (!product) return res.status(404).json({ error: 'Product not found' });
        if (product.stock <= 0) return res.status(400).json({ error: 'Out of stock' });

        // Decrement Stock (Reservation)
        product.stock -= 1;
        await product.save();

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Check if item exists
        const itemIndex = cart.items.findIndex(p => p.productId.toString() === productId);

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity++;
        } else {
            cart.items.push({ productId, quantity: 1 });
        }

        await cart.save();
        
        // Populate for response
        await cart.populate('items.productId');
        res.json(cart);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Remove from Cart
app.delete('/api/cart/:productId', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.passport.user;
        const productId = req.params.productId;

        let cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ error: 'Cart not found' });

        // Find item to get quantity and restore stock
        const itemToRemove = cart.items.find(item => item.productId.toString() === productId);
        
        if (itemToRemove) {
            const product = await Product.findById(productId);
            if (product) {
                product.stock += itemToRemove.quantity;
                await product.save();
            }
        }

        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        await cart.save();
        
        await cart.populate('items.productId');
        res.json(cart);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Checkout Cart
app.post('/api/cart/checkout', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.passport.user;
        const { paymentData } = req.body; // Accept payment data from frontend
        const user = await User.findById(userId);
        const cart = await Cart.findOne({ userId }).populate('items.productId');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const orders = [];
        const errors = [];

        for (const item of cart.items) {
            const product = item.productId;
            
            if (!product) continue;

            if (product.stock < item.quantity) {
                errors.push(`Not enough stock for ${product.name}`);
                continue;
            }

            // Determine order status based on payment
            const orderStatus = paymentData && paymentData.status === 'confirmed' ? 'confirmed' : 'pending';
            
            const order = new Order({
                userId: user._id,
                productId: product._id,
                amount: product.price * item.quantity,
                status: orderStatus, // Set to 'confirmed' if payment successful
                date: new Date()
            });

            console.log('[CHECKOUT] Creating order:', {
                userId: user._id,
                productId: product._id,
                amount: product.price * item.quantity,
                status: orderStatus
            });

            // Stock already decremented when added to cart
            await order.save();
            console.log('[CHECKOUT] Order saved successfully:', order._id);
            orders.push(order);
        }

        if (orders.length > 0) {
            // Clear cart
            cart.items = [];
            await cart.save();
            
            // Send email for first order (simplified)
            if (user.email) {
                 try {
                    await sendOrderConfirmationEmail(user.email, orders[0], orders[0].productId); 
                 } catch(e) {}
            }
            
            res.json({ message: 'Checkout successful', orders });
        } else {
            res.status(400).json({ error: errors.join(', ') || 'Checkout failed' });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: All Orders
app.get('/api/orders', isAdmin, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'username email')
            .populate('productId', 'name price');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: Report
app.get('/api/report', isAdmin, async (req, res) => {
    try {
        const orders = await Order.find().populate('userId').populate('productId');
        
        const data = orders.map(order => ({
            OrderID: order._id.toString(),
            Username: order.userId ? order.userId.username : 'Unknown',
            Email: order.userId ? order.userId.email : 'Unknown',
            Product: order.productId ? order.productId.name : 'Unknown',
            Price: order.amount,
            Date: order.date,
            Status: order.status
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, "Orders");
        
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'csv' });
        
        res.setHeader('Content-Disposition', 'attachment; filename="orders_report.csv"');
        res.setHeader('Content-Type', 'text/csv');
        res.send(buffer);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Order Service running on port ${PORT}`);
});
