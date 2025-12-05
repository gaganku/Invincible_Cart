require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src_backend/models/Product');

async function checkCategories() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping_cart');
    const products = await Product.find({}, 'name categories');
    console.log('\n📦 Products with Categories:\n');
    products.forEach(p => {
        console.log(`✅ ${p.name}`);
        console.log(`   Categories: ${p.categories.join(', ') || 'None'}\n`);
    });
    process.exit(0);
}

checkCategories();
