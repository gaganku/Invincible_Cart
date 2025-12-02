const mongoose = require('mongoose');
const User = require('./src_backend/models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/React')
  .then(async () => {
    console.log('Connected to DB');
    const users = await User.find({});
    console.log('Users found:', users.length);
    users.forEach(u => {
      console.log(`- Username: ${u.username}, Email: ${u.email}, Password: ${u.password}, Verified: ${u.isVerified}`);
    });
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
