const mongoose = require('mongoose');
const User = require('./src_backend/models/User');
const bcrypt = require('bcryptjs'); // Assuming bcryptjs is used, or I'll check package.json
require('dotenv').config();

async function createUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping_cart');
        console.log('Connected to MongoDB');

        // 1. Create Admin User
        const adminUsername = 'admin_user';
        const adminPassword = 'Admin123!';
        
        // Check if exists
        let admin = await User.findOne({ username: adminUsername });
        if (admin) {
            console.log('Admin user already exists');
        } else {
            // Hash password (assuming the app handles hashing in the route, but usually models have pre-save hooks or we hash manually. 
            // The User model I saw didn't have a pre-save hash hook, so I should check how auth service handles it.
            // But for now I'll assume I need to hash it manually if the model doesn't.)
            // Wait, let me check package.json to see if bcrypt or bcryptjs is used.
            // Actually, to be safe, I'll check the auth service code quickly to see how they hash passwords.
        }
    } catch (err) {
        console.error(err);
    }
}
