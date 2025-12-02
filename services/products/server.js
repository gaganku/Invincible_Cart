const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Models
const Product = require('../../src_backend/models/Product');

// Config
const connectDB = require('../../src_backend/config/database');

const app = express();
const PORT = 3002;

// Middleware
app.set('trust proxy', 1);
app.use(cors({
    origin: 'http://localhost:5173', // Allow React Frontend
    credentials: true
}));
app.use(bodyParser.json());

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

// Admin middleware
const isAdmin = async (req, res, next) => {
    if (!req.session || !req.session.passport || !req.session.passport.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const User = require('../../src_backend/models/User');
        const user = await User.findById(req.session.passport.user);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Database
connectDB().then(() => {
    // Routes
    app.get('/api/products', async (req, res) => {
        try {
            const products = await Product.find();
            res.json(products);
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Admin: Add New Product
    app.post('/api/products', isAdmin, async (req, res) => {
        try {
            const { name, description, image, price, stock } = req.body;
            
            // Get the highest ID and increment
            const lastProduct = await Product.findOne().sort({ id: -1 });
            const newId = lastProduct ? lastProduct.id + 1 : 1;
            
            const product = new Product({
                id: newId,
                name,
                description,
                image,
                price,
                stock
            });
            
            await product.save();
            res.status(201).json(product);
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Admin: Update Product
    app.patch('/api/products/:id', isAdmin, async (req, res) => {
        try {
            const { name, description, image, price, stock } = req.body;
            const product = await Product.findOne({ id: req.params.id });
            
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            if (name !== undefined) product.name = name;
            if (description !== undefined) product.description = description;
            if (image !== undefined) product.image = image;
            if (price !== undefined) product.price = price;
            if (stock !== undefined) product.stock = stock;
            
            await product.save();
            res.json(product);
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Admin: Delete Product
    app.delete('/api/products/:id', isAdmin, async (req, res) => {
        try {
            const product = await Product.findOneAndDelete({ id: req.params.id });
            
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            res.json({ message: 'Product deleted successfully' });
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Seed Products (Simplified)
    const seedProducts = async () => {
        try {
            const count = await Product.countDocuments();
            if (count === 0) {
                const initialProducts = [
                    {
                        id: 1,
                        name: "Premium Wireless Headphones",
                        description: "High-fidelity sound with active noise cancellation.",
                        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
                        price: 299.99,
                        stock: 10
                    },
                    {
                        id: 2,
                        name: "Smart Fitness Watch",
                        description: "Track your health metrics with precision.",
                        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
                        price: 199.99,
                        stock: 15
                    },
                    {
                        id: 3,
                        name: "Portable Bluetooth Speaker",
                        description: "360-degree sound in a compact design.",
                        image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80",
                        price: 79.99,
                        stock: 20
                    },
                    {
                        id: 4,
                        name: "4K Action Camera",
                        description: "Capture your adventures in stunning detail.",
                        image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80",
                        price: 349.99,
                        stock: 5
                    },
                    {
                        id: 5,
                        name: "Mechanical Gaming Keyboard",
                        description: "RGB backlighting with tactile switches.",
                        image: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=500&q=80",
                        price: 129.99,
                        stock: 8
                    }
                ];
                await Product.insertMany(initialProducts);
                console.log('Products seeded');
            }
        } catch (err) {
            console.error('Error seeding products:', err);
        }
    };
    seedProducts();

    app.listen(PORT, () => {
        console.log(`Product Service running on port ${PORT}`);
    });
});
