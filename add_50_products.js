require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src_backend/models/Product');

const coolProducts = [
    // Laptops & Computers (6-10)
    { id: 6, name: "MacBook Pro 16-inch", description: "Powerful laptop with M3 Pro chip and stunning Retina display", image: "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=500", price: 2499.99, stock: 20, categories: ["Electronics", "Computers", "Premium"] },
    { id: 7, name: "Dell XPS 15", description: "Ultra-thin laptop with 4K OLED display", image: "https://images.pexels.com/photos/7974/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=500", price: 1799.99, stock: 20, categories: ["Electronics", "Computers", "Work"] },
    { id: 8, name: "Gaming Desktop PC", description: "RTX 4080 powered gaming beast", image: "https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=500", price: 2899.99, stock: 20, categories: ["Electronics", "Gaming", "Computers"] },
    { id: 9, name: "iPad Pro 12.9-inch", description: "Tablet with M2 chip and ProMotion display", image: "https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=500", price: 1099.99, stock: 20, categories: ["Electronics", "Tablets", "Premium"] },
    { id: 10, name: "Microsoft Surface Pro 9", description: "Versatile 2-in-1 laptop and tablet", image: "https://images.pexels.com/photos/5082579/pexels-photo-5082579.jpeg?auto=compress&cs=tinysrgb&w=500", price: 1299.99, stock: 20, categories: ["Electronics", "Tablets", "Work"] },
    
    // Smartphones (11-14)
    { id: 11, name: "iPhone 15 Pro Max", description: "Titanium design with A17 Pro chip", image: "https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=500", price: 1199.99, stock: 20, categories: ["Electronics", "Smartphones", "Premium"] },
    { id: 12, name: "Samsung Galaxy S24 Ultra", description: "AI-powered flagship with S Pen", image: "https://images.pexels.com/photos/15463611/pexels-photo-15463611.jpeg?auto=compress&cs=tinysrgb&w=500", price: 1299.99, stock: 20, categories: ["Electronics", "Smartphones", "Premium"] },
    { id: 13, name: "Google Pixel 8 Pro", description: "Best Android camera phone", image: "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=500", price: 999.99, stock: 20, categories: ["Electronics", "Smartphones", "Photography"] },
    { id: 14, name: "OnePlus 12", description: "Flagship killer with amazing value", image: "https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=500", price: 799.99, stock: 20, categories: ["Electronics", "Smartphones"] },
    
    // Gaming Consoles & Accessories (15-20)
    { id: 15, name: "PlayStation 5", description: "Next-gen gaming console", image: "https://images.pexels.com/photos/371924/pexels-photo-371924.jpeg?auto=compress&cs=tinysrgb&w=500", price: 499.99, stock: 20, categories: ["Gaming", "Electronics", "Entertainment"] },
    { id: 16, name: "Xbox Series X", description: "Most powerful Xbox ever", image: "https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?auto=compress&cs=tinysrgb&w=500", price: 499.99, stock: 20, categories: ["Gaming", "Electronics", "Entertainment"] },
    { id: 17, name: "Nintendo Switch OLED", description: "Portable gaming console with vibrant screen", image: "https://images.pexels.com/photos/371924/pexels-photo-371924.jpeg?auto=compress&cs=tinysrgb&w=500", price: 349.99, stock: 20, categories: ["Gaming", "Electronics", "Portable"] },
    { id: 18, name: "Gaming Mouse Pro", description: "Ultra-lightweight with 20000 DPI", image: "https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg?auto=compress&cs=tinysrgb&w=500", price: 89.99, stock: 20, categories: ["Gaming", "Accessories", "Electronics"] },
    { id: 19, name: "RGB Gaming Headset", description: "7.1 surround sound with noise cancellation", image: "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500", price: 149.99, stock: 20, categories: ["Gaming", "Audio", "Accessories"] },
    { id: 20, name: "Pro Gaming Chair", description: "Ergonomic design with lumbar support", image: "https://images.pexels.com/photos/6492397/pexels-photo-6492397.jpeg?auto=compress&cs=tinysrgb&w=500", price: 399.99, stock: 20, categories: ["Gaming", "Furniture", "Office"] },
    
    // Audio Equipment (21-25)
    { id: 21, name: "Sony WH-1000XM5", description: "Industry-leading noise cancellation", image: "https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg?auto=compress&cs=tinysrgb&w=500", price: 399.99, stock: 20, categories: ["Audio", "Electronics", "Premium"] },
    { id: 22, name: "AirPods Pro 2", description: "Spatial audio with dynamic head tracking", image: "https://images.pexels.com/photos/4219654/pexels-photo-4219654.jpeg?auto=compress&cs=tinysrgb&w=500", price: 249.99, stock: 20, categories: ["Audio", "Electronics", "Premium"] },
    { id: 23, name: "JBL Flip 6", description: "Waterproof portable speaker", image: "https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg?auto=compress&cs=tinysrgb&w=500", price: 129.99, stock: 20, categories: ["Audio", "Portable", "Electronics"] },
    { id: 24, name: "Sonos Beam Soundbar", description: "Compact smart soundbar with Dolby Atmos", image: "https://images.pexels.com/photos/1279101/pexels-photo-1279101.jpeg?auto=compress&cs=tinysrgb&w=500", price: 499.99, stock: 20, categories: ["Audio", "Home", "Premium"] },
    { id: 25, name: "Audio-Technica ATH-M50x", description: "Professional studio monitor headphones", image: "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500", price: 149.99, stock: 20, categories: ["Audio", "Professional", "Electronics"] },
    
    // Cameras & Photography (26-30)
    { id: 26, name: "Sony A7 IV", description: "Hybrid full-frame mirrorless camera", image: "https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg?auto=compress&cs=tinysrgb&w=500", price: 2499.99, stock: 20, categories: ["Photography", "Electronics", "Professional"] },
    { id: 27, name: "Canon EOS R6", description: "Professional mirrorless camera", image: "https://images.pexels.com/photos/2121607/pexels-photo-2121607.jpeg?auto=compress&cs=tinysrgb&w=500", price: 2399.99, stock: 20, categories: ["Photography", "Electronics", "Professional"] },
    { id: 28, name: "DJI Mini 3 Pro", description: "Compact drone with 4K camera", image: "https://images.pexels.com/photos/2876511/pexels-photo-2876511.jpeg?auto=compress&cs=tinysrgb&w=500", price: 759.99, stock: 20, categories: ["Photography", "Outdoor", "Electronics"] },
    { id: 29, name: "GoPro Hero 12 Black", description: "Ultimate action camera", image: "https://images.pexels.com/photos/821738/pexels-photo-821738.jpeg?auto=compress&cs=tinysrgb&w=500", price: 449.99, stock: 20, categories: ["Photography", "Outdoor", "Electronics"] },
    { id: 30, name: "Instax Mini 12", description: "Instant camera with auto exposure", image: "https://images.pexels.com/photos/325153/pexels-photo-325153.jpeg?auto=compress&cs=tinysrgb&w=500", price: 79.99, stock: 20, categories: ["Photography", "Fun", "Electronics"] },
    
    // Smartwatches & Wearables (31-34)
    { id: 31, name: "Apple Watch Ultra 2", description: "Rugged titanium smartwatch", image: "https://images.pexels.com/photos/393047/pexels-photo-393047.jpeg?auto=compress&cs=tinysrgb&w=500", price: 799.99, stock: 20, categories: ["Wearables", "Fitness", "Premium"] },
    { id: 32, name: "Samsung Galaxy Watch 6", description: "Advanced health tracking", image: "https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=500", price: 349.99, stock: 20, categories: ["Wearables", "Fitness", "Electronics"] },
    { id: 33, name: "Fitbit Charge 6", description: "Fitness tracker with GPS", image: "https://images.pexels.com/photos/4058316/pexels-photo-4058316.jpeg?auto=compress&cs=tinysrgb&w=500", price: 159.99, stock: 20, categories: ["Wearables", "Fitness", "Health"] },
    { id: 34, name: "Oura Ring Gen3", description: "Smart ring for sleep & health tracking", image: "https://images.pexels.com/photos/265722/pexels-photo-265722.jpeg?auto=compress&cs=tinysrgb&w=500", price: 299.99, stock: 20, categories: ["Wearables", "Health", "Premium"] },
    
    // Smart Home (35-39)
    { id: 35, name: "Echo Dot 5th Gen", description: "Smart speaker with Alexa", image: "https://images.pexels.com/photos/4790268/pexels-photo-4790268.jpeg?auto=compress&cs=tinysrgb&w=500", price: 49.99, stock: 20, categories: ["Smart Home", "Audio", "Electronics"] },
    { id: 36, name: "Nest Learning Thermostat", description: "Smart energy-saving thermostat", image: "https://images.pexels.com/photos/221047/pexels-photo-221047.jpeg?auto=compress&cs=tinysrgb&w=500", price: 249.99, stock: 20, categories: ["Smart Home", "Electronics", "Energy"] },
    { id: 37, name: "Ring Video Doorbell Pro", description: "1080p HD video doorbell", image: "https://images.pexels.com/photos/8961157/pexels-photo-8961157.jpeg?auto=compress&cs=tinysrgb&w=500", price: 249.99, stock: 20, categories: ["Smart Home", "Security", "Electronics"] },
    { id: 38, name: "Philips Hue Starter Kit", description: "Smart LED light bulbs", image: "https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=500", price: 199.99, stock: 20, categories: ["Smart Home", "Lighting", "Electronics"] },
    { id: 39, name: "Robot Vacuum Cleaner", description: "Self-cleaning with mapping technology", image: "https://images.pexels.com/photos/4239037/pexels-photo-4239037.jpeg?auto=compress&cs=tinysrgb&w=500", price: 399.99, stock: 20, categories: ["Smart Home", "Cleaning", "Electronics"] },
    
    // Monitors & Displays (40-42)
    { id: 40, name: "LG 27-inch 4K Monitor", description: "UHD IPS display with HDR", image: "https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=500", price: 449.99, stock: 20, categories: ["Electronics", "Monitors", "Work"] },
    { id: 41, name: "Samsung Odyssey G9", description: "49-inch curved gaming monitor", image: "https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg?auto=compress&cs=tinysrgb&w=500", price: 1299.99, stock: 20, categories: ["Electronics", "Gaming", "Monitors"] },
    { id: 42, name: "Portable Monitor 15.6-inch", description: "USB-C powered portable display", image: "https://images.pexels.com/photos/1229861/pexels-photo-1229861.jpeg?auto=compress&cs=tinysrgb&w=500", price: 199.99, stock: 20, categories: ["Electronics", "Monitors", "Portable"] },
    
    // Fashion & Accessories (43-45)
    { id: 43, name: "Designer Backpack", description: "Premium laptop backpack with USB charging", image: "https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&w=500", price: 89.99, stock: 20, categories: ["Fashion", "Accessories", "Travel"] },
    { id: 44, name: "Leather Messenger Bag", description: "Vintage genuine leather bag", image: "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=500", price: 149.99, stock: 20, categories: ["Fashion", "Accessories", "Premium"] },
    { id: 45, name: "Polarized Sunglasses", description: "UV protection with titanium frame", image: "https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=500", price: 199.99, stock: 20, categories: ["Fashion", "Accessories", "Outdoor"] },
    
    // Sports & Fitness (46-50)
    { id: 46, name: "Adjustable Dumbbells Set", description: "5-52.5 lbs quick-adjust dumbbells", image: "https://images.pexels.com/photos/3076509/pexels-photo-3076509.jpeg?auto=compress&cs=tinysrgb&w=500", price: 299.99, stock: 20, categories: ["Fitness", "Sports", "Home"] },
    { id: 47, name: "Yoga Mat Premium", description: "Eco-friendly non-slip exercise mat", image: "https://images.pexels.com/photos/3822621/pexels-photo-3822621.jpeg?auto=compress&cs=tinysrgb&w=500", price: 49.99, stock: 20, categories: ["Fitness", "Sports", "Health"] },
    { id: 48, name: "Protein Blender Bottle", description: "Electric shaker bottle with USB charging", image: "https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg?auto=compress&cs=tinysrgb&w=500", price: 29.99, stock: 20, categories: ["Fitness", "Health", "Accessories"] },
    { id: 49, name: "Running Shoes Pro", description: "Lightweight breathable athletic shoes", image: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=500", price: 129.99, stock: 20, categories: ["Sports", "Fashion", "Fitness"] },
    { id: 50, name: "Hydration Backpack", description: "2L water reservoir for hiking & cycling", image: "https://images.pexels.com/photos/1687845/pexels-photo-1687845.jpeg?auto=compress&cs=tinysrgb&w=500", price: 59.99, stock: 20, categories: ["Sports", "Outdoor", "Accessories"] },
    
    // Tech Accessories (51-55)
    { id: 51, name: "USB-C Hub 7-in-1", description: "Multi-port adapter for MacBook", image: "https://images.pexels.com/photos/4226256/pexels-photo-4226256.jpeg?auto=compress&cs=tinysrgb&w=500", price: 49.99, stock: 20, categories: ["Electronics", "Accessories", "Work"] },
    { id: 52, name: "Wireless Charging Pad", description: "Fast 15W Qi wireless charger", image: "https://images.pexels.com/photos/4218549/pexels-photo-4218549.jpeg?auto=compress&cs=tinysrgb&w=500", price: 39.99, stock: 20, categories: ["Electronics", "Accessories"] },
    { id: 53, name: "Power Bank 20000mAh", description: "Fast charging portable battery", image: "https://images.pexels.com/photos/4218888/pexels-photo-4218888.jpeg?auto=compress&cs=tinysrgb&w=500", price: 59.99, stock: 20, categories: ["Electronics", "Accessories", "Portable"] },
    { id: 54, name: "Blue Light Blocking Glasses", description: "Reduce eye strain from screens", image: "https://images.pexels.com/photos/947885/pexels-photo-947885.jpeg?auto=compress&cs=tinysrgb&w=500", price: 39.99, stock: 20, categories: ["Health", "Accessories", "Work"] },
    { id: 55, name: "Webcam 4K Pro", description: "Ultra HD webcam with auto-focus", image: "https://images.pexels.com/photos/2419375/pexels-photo-2419375.jpeg?auto=compress&cs=tinysrgb&w=500", price: 149.99, stock: 20, categories: ["Electronics", "Work", "Accessories"] }
];

async function addProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping_cart');
        console.log('🔗 Connected to MongoDB\n');

        // First, delete existing products to start fresh
        const deleteResult = await Product.deleteMany({});
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing products\n`);

        // Insert all new products
        const result = await Product.insertMany(coolProducts);
        console.log(`✅ Successfully added ${result.length} cool products!\n`);

        // Show category summary
        const categories = new Set();
        coolProducts.forEach(p => p.categories.forEach(cat => categories.add(cat)));
        console.log(`📊 Categories created: ${Array.from(categories).sort().join(', ')}\n`);

        console.log('🎉 Your store is now stocked with amazing products!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addProducts();
