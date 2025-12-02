const mongoose = require('mongoose');
const User = require('./src_backend/models/User');
require('dotenv').config();

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping_cart');
        console.log('Connected to MongoDB');

        // Update specific users to be admins
        await User.updateOne({ username: 'admin_user11' }, { $set: { isAdmin: true } });
        await User.updateOne({ username: 'new one' }, { $set: { isAdmin: true } });
        
        console.log('Updated users to be admins');

        const users = await User.find({}, 'username isAdmin email');
        console.log('Users:', users);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUsers();
