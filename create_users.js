const mongoose = require('mongoose');
const User = require('./src_backend/models/User');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function createUsers() {
    try {
        // Force the correct database name if not in env
        let mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.log('No MONGODB_URI found in .env, using default.');
            mongoUri = 'mongodb://localhost:27017/React';
        }
        
        await mongoose.connect(mongoUri);
        console.log(`Connected to MongoDB: ${mongoUri}`);

        // Helper to create or update user
        const upsertUser = async (userData) => {
            // Try to find by username OR email
            let user = await User.findOne({ 
                $or: [
                    { username: userData.username },
                    { email: userData.email }
                ] 
            });

            if (user) {
                console.log(`User ${userData.username} (or email) exists. Updating...`);
                user.username = userData.username; // Ensure username matches
                user.email = userData.email;       // Ensure email matches
                user.password = userData.password;
                user.isAdmin = userData.isAdmin;
                user.isVerified = userData.isVerified;
                user.phoneNumber = userData.phoneNumber;
                await user.save();
                console.log(`User ${userData.username} updated.`);
            } else {
                user = new User(userData);
                await user.save();
                console.log(`User ${userData.username} created.`);
            }
        };

        // 1. Create Admin User
        await upsertUser({
            username: 'admin_user',
            password: 'Admin123!',
            email: 'admin@example.com',
            isAdmin: true,
            isVerified: true,
            phoneNumber: '1234567890'
        });

        // 2. Create Regular User
        await upsertUser({
            username: 'regular_user',
            password: 'User123!',
            email: 'user@example.com',
            isAdmin: false,
            isVerified: true,
            phoneNumber: '0987654321'
        });

        console.log('\n--- Credentials ---');
        console.log('Admin: admin_user / Admin123!');
        console.log('User:  regular_user / User123!');
        console.log('-------------------\n');

        mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

createUsers();
