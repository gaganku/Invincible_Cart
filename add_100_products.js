require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src_backend/models/Product');

const categories = [
    "Electronics", "Fashion", "Home & Kitchen", "Books", 
    "Sports & Outdoors", "Toys & Games", "Beauty & Personal Care", 
    "Health & Household", "Automotive", "Grocery & Gourmet Food"
];

const subcategories = {
    "Electronics": ["Phones", "Laptops", "Audio", "Cameras", "Accessories"],
    "Fashion": ["Clothing", "Shoes", "Jewelry", "Watches", "Bags"],
    "Home & Kitchen": ["Kitchenware", "Furniture", "Decor", "Bedding", "Appliances"],
    "Books": ["Fiction", "Non-fiction", "Educational", "Children", "Sci-Fi"],
    "Sports & Outdoors": ["Fitness", "Camping", "Cycling", "Swimming", "Team Sports"],
    "Toys & Games": ["Board Games", "Action Figures", "Dolls", "Puzzles", "Educational Toys"],
    "Beauty & Personal Care": ["Skincare", "Makeup", "Haircare", "Fragrances", "Bath & Body"],
    "Health & Household": ["Supplements", "Vitamins", "First Aid", "Cleaning", "Personal Care"],
    "Automotive": ["Car Care", "Accessories", "Tools", "Electronics", "Replacement Parts"],
    "Grocery & Gourmet Food": ["Snacks", "Beverages", "Breakfast", "Cooking Essentials", "Organic"]
};

const productNames = {
    "Phones": ["Smartphone X", "Mobile Pro", "Neo Phone", "Infinity Talk", "Galaxy Runner"],
    "Laptops": ["Ultrabook Air", "Power Station", "LapTop 360", "Cloud Compute", "ZenBook Prime"],
    "Audio": ["SoundWave Headphones", "Echo Speaker", "Beat Buds", "Audio Pro", "Sonic Boom"],
    "Cameras": ["SnapShot DS", "Vision Pro Camera", "Focus SLR", "Memories Cam", "ClearShot 4K"],
    "Clothing": ["Urban Tee", "Classic Denim", "Silk Scarf", "Winter Parka", "Summer Dress"],
    "Kitchenware": ["Master Chef Pan", "Knife Set Elite", "Blender Pro 5000", "Coffee Brew", "Smart Toaster"],
    "Furniture": ["Luxe Sofa", "Oak Desk", "Velvet Chair", "Queen Bed Frame", "Minimalist Table"],
    "Fiction": ["Echoes of Time", "The Last Frontier", "Shadow in the Mist", "Crimson Sky", "Silent Echo"],
    "Fitness": ["Running Shoes Ultra", "Yoga Mat Pro", "Power Dumbbells", "Fitness Tracker", "Gym Bag"],
    "Snacks": ["Organic Energy Bar", "Crunchy Nut Mix", "Gourmet Chips", "Sweet Delights", "Fruit Medley"]
};

const images = [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80",
    "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c274f?w=500&q=80",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&q=80",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80",
    "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&q=80",
    "https://images.unsplash.com/photo-1503602642458-232111445657?w=500&q=80",
    "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=500&q=80"
];

function generateRandomProduct(id) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const subCats = subcategories[category];
    const subCategory = subCats[Math.floor(Math.random() * subCats.length)];
    
    // Fallback if specific subcategory names aren't defined
    const namePool = productNames[subCategory] || productNames["Snacks"];
    const baseName = namePool[Math.floor(Math.random() * namePool.length)];
    const name = `${baseName} - Model ${id}`;
    
    const description = `This high-quality ${name} belongs to our ${category} collection, specifically in the ${subCategory} department. Perfect for all your needs.`;
    const image = images[Math.floor(Math.random() * images.length)];
    const price = parseFloat((Math.random() * 500 + 10).toFixed(2));
    const stock = Math.floor(Math.random() * 50) + 5;
    
    return {
        id,
        name,
        description,
        image,
        price,
        stock,
        categories: [category, subCategory]
    };
}

async function add100Products() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping_cart');
        console.log('🔗 Connected to MongoDB');

        // Optional: clear existing to avoid ID conflicts
        console.log('🗑️ Clearing existing products for fresh start...');
        await Product.deleteMany({});

        const products = [];
        for (let i = 1; i <= 100; i++) {
            products.push(generateRandomProduct(i));
        }

        const result = await Product.insertMany(products);
        console.log(`✅ Successfully added ${result.length} random products!`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

add100Products();
