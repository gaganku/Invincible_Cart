require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src_backend/models/Product');

async function addCategories() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping_cart');
        console.log('Connected to MongoDB');

        // Add categories to each product
        const updates = [
            { id: 1, categories: ['Electronics', 'Audio', 'Premium'] },
            { id: 2, categories: ['Electronics', 'Wearables', 'Fitness'] },
            { id: 3, categories: ['Electronics', 'Audio', 'Portable'] },
            { id: 4, categories: ['Electronics', 'Photography', 'Outdoor'] },
            { id: 5, categories: ['Gaming', 'Electronics', 'Accessories'] }
        ];

        for (const update of updates) {
            const result = await Product.updateOne(
                { id: update.id },
                { $set: { categories: update.categories } }
            );
            console.log(`Updated product ${update.id}: ${update.categories.join(', ')}`);
        }

        console.log('\n✅ All products updated with categories!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addCategories();
