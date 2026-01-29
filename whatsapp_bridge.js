/**
 * 🛒 WhatsApp Bridge Service
 * Connects your local "clawdbot" to your Vercel App via WhatsApp.
 */

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const twilio = require('twilio');

const app = express();
const port = process.env.BRIDGE_PORT || 5000;

// In-memory state tracking (Simple)
const userState = {}; 

// Update this with your actual Vercel URL
const APP_URL = process.env.APP_URL || 'https://invincible-cart.vercel.app';

// Twilio Setup (Get these from your Twilio Console)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('✅ WhatsApp Bridge is alive and listening!');
});

app.post('/whatsapp', async (req, res) => {
    const body = req.body.Body || '';
    const incomingMsg = body.trim().toLowerCase();
    const from = req.body.From || '';

    console.log(`📩 Message: "${incomingMsg}" from ${from}`);

    // Admin Security: Check for a list of admin numbers (comma separated)
    const adminList = (process.env.ADMIN_PHONE_NUMBERS || '918123065334').split(',').map(n => n.trim());
    const isAdminUser = adminList.some(adminNum => from.includes(adminNum));
    
    const botHeaders = { 'x-bot-token': process.env.ADMIN_BOT_TOKEN };

    try {
        let responseMsg = '';
        let user = null;

        // 🆔 IDENTITY MATCHING
        try {
            const { data: foundUser } = await axios.get(`${APP_URL}/api/admin/users/by-phone/${from}`, { headers: botHeaders });
            user = foundUser;
            console.log(`[Bridge] User Identified: ${user.username}`);
        } catch (e) {
            console.log(`[Bridge] Visitor ${from} (No account)`);
        }

        const state = userState[from] || { step: 'idle' };

        // 🛑 CONVERSATION STATE MACHINE 🛑
        
        if (state.step === 'picking_product') {
            const index = parseInt(incomingMsg) - 1;
            if (!isNaN(index) && state.results[index]) {
                const selected = state.results[index];
                userState[from] = { ...state, step: 'picking_field', product: selected };
                responseMsg = `✅ Selected: *${selected.name}*\n\n` +
                              (isAdminUser ? `What would you like to update?\n1. *Price*\n2. *Stock*` : `Would you like to:\n1. *View Details*\n2. *Add to Cart*`);
            } else if (incomingMsg === 'cancel') {
                delete userState[from];
                responseMsg = '❌ Cancelled.';
            } else {
                responseMsg = '❓ Invalid choice. Reply with a number or "cancel".';
            }
        }
        else if (state.step === 'picking_field') {
            const prod = state.product;
            if (isAdminUser) {
                if (incomingMsg === '1') { userState[from].step = 'entering_value'; userState[from].field = 'price'; responseMsg = `💰 New Price for ${prod.name}:`; }
                else if (incomingMsg === '2') { userState[from].step = 'entering_value'; userState[from].field = 'stock'; responseMsg = `📦 New Stock for ${prod.name}:`; }
            } else {
                if (incomingMsg === '1') {
                    delete userState[from];
                    responseMsg = `📌 *${prod.name}*\n\n${prod.description}\n\nPrice: $${prod.price}\nCategory: ${prod.category}\nLink: ${APP_URL}`;
                } else if (incomingMsg === '2') {
                    await axios.post(`${APP_URL}/api/admin/cart/${user._id}`, { productId: prod.id }, { headers: botHeaders });
                    delete userState[from];
                    responseMsg = `🛒 Added *${prod.name}* to your cart! \n\nCheck it out here: ${APP_URL}/cart`;
                }
            }
        }
        else if (state.step === 'entering_value' && isAdminUser) {
            await axios.patch(`${APP_URL}/api/products/${state.product.id}`, { [state.field]: incomingMsg }, { headers: botHeaders });
            delete userState[from];
            responseMsg = `🎉 Updated *${state.product.name}*!`;
        }
        // --- Commands ---
        else {
            // --- GATEKEEPER CHECK: Redirect unregistered visitors ---
            if (!isAdminUser && !user && incomingMsg !== 'hi' && !incomingMsg.includes('help')) {
                const phoneOnly = from.replace(/\D/g, ''); // 918123065334
                responseMsg = `👋 *Welcome to our Shop!* \n\nYou need a registered account to browse or shop via WhatsApp.\n\n🔗 *Register Here (Pre-filled):* ${APP_URL}/signup?phone=${phoneOnly}\n\n_Once registered, you can immediately start searching!_`;
            }
            // 🔎 ADVANCED SEARCH
            else if (incomingMsg.startsWith('find ') || incomingMsg.startsWith('search ')) {
                const query = body.split(' ').slice(1).join(' ');
                const { data: products } = await axios.get(`${APP_URL}/api/products`);
                const matches = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
                
                if (matches.length === 0) responseMsg = `❌ No results for "${query}".`;
                else {
                    userState[from] = { step: 'picking_product', results: matches };
                    responseMsg = `🔍 Results for "${query}":\n\n` + matches.map((p, i) => `${i+1}. *${p.name}* ($${p.price})`).join('\n') + `\n\nReply with a number!`;
                }
            }
            // 💰 PRICE FILTERS
            else if (incomingMsg.includes('under ') || incomingMsg.includes('below ')) {
                const max = parseInt(incomingMsg.replace(/\D/g, ''));
                if (isNaN(max)) responseMsg = "Please specify a number, e.g., 'under 50'.";
                else {
                    const { data: products } = await axios.get(`${APP_URL}/api/products`);
                    const matches = products.filter(p => p.price <= max).slice(0, 5);
                    responseMsg = matches.length ? `💸 Deals under $${max}:\n\n` + matches.map(p => `- *${p.name}* ($${p.price})`).join('\n') : `😔 No items found under $${max}.`;
                }
            }
            // 📦 ORDER MANAGEMENT
            else if (incomingMsg === 'my orders' || incomingMsg === 'orders') {
                const { data: orders } = await axios.get(`${APP_URL}/api/admin/orders/user/${user._id}`, { headers: botHeaders });
                responseMsg = orders.length ? `📦 *Your Recent Orders:*\n\n` + orders.map(o => `ID: #${o._id.slice(-6)}\nItem: ${o.productId?.name}\nStatus: ${o.status}\n---`).join('\n\n') : "You haven't placed any orders yet!";
            }
            else if (incomingMsg.startsWith('track #')) {
                const id = body.split('#')[1];
                try {
                    const { data: order } = await axios.get(`${APP_URL}/api/admin/orders/track/${id}`, { headers: botHeaders });
                    responseMsg = `🚚 *Tracking info for #${id.slice(-6)}*\nStatus: *${order.status.toUpperCase()}*\nItem: ${order.productId.name}`;
                } catch (e) { responseMsg = "❌ Order not found!"; }
            }
            // 🤖 AI SHOPPING ASSISTANT
            else if (incomingMsg.includes('gift') || incomingMsg.includes('recommend')) {
                const { data: products } = await axios.get(`${APP_URL}/api/products`);
                const random = products[Math.floor(Math.random() * products.length)];
                responseMsg = `🎁 *Gift Recommendation:*\n\nHow about the *${random.name}*? ($${random.price})\n\nInterested? Reply "update ${random.name}" to add it to cart!`;
            }
            // 💰 PAYMENTS
            else if (incomingMsg === 'pay' || incomingMsg === 'checkout') {
                const { data: cart } = await axios.get(`${APP_URL}/api/admin/cart/${user._id}`, { headers: botHeaders });
                const total = cart.items.reduce((sum, i) => sum + (i.productId?.price * i.quantity || 0), 0);
                if (total === 0) responseMsg = "🛒 Your cart is empty!";
                else responseMsg = `💳 *Checkout Summary*\nTotal: *$${total.toFixed(2)}*\n\nClick link to pay via UPI:\nupi://pay?pa=your-upi-id@bank&am=${total.toFixed(2)}&cu=USD\n\n_Note: This is a simulation!_`;
            }
            // 👑 ADMIN COMMANDS
            else if (isAdminUser && incomingMsg === 'report') {
                const { data } = await axios.get(`${APP_URL}/api/admin/stats`, { headers: botHeaders });
                responseMsg = `📊 *Admin Report*\nToday: $${data.today.revenue.toFixed(2)}\nOrders: ${data.today.orders}`;
            }
            else if (isAdminUser && incomingMsg.startsWith('broadcast: ')) {
                const msg = body.substring(11).trim();
                const { data: phones } = await axios.get(`${APP_URL}/api/admin/users/phones`, { headers: botHeaders });
                for (const p of phones) await client.messages.create({ body: `📢 ${msg}`, from: 'whatsapp:+14155238886', to: p.startsWith('whatsapp:') ? p : `whatsapp:${p}` });
                responseMsg = `✅ Broadcast sent to ${phones.length} users.`;
            }
            // 🆘 HELP & ONBOARDING
            else if (incomingMsg.includes('hi') || incomingMsg.includes('help') || incomingMsg.includes('connect')) {
                if (incomingMsg.includes('connect') && user) {
                    responseMsg = `✅ *Account Linked!* \n\nHello ${user.username}, your website account is now synced with WhatsApp. \n\nTry 'orders' or 'find laptop'!`;
                }
                else if (!isAdminUser && !user) {
                    responseMsg = `👋 *Hi! I am ClawdBot.* \n\nI can help you shop and track orders, but you need an account first.\n\n🔗 *Register:* ${APP_URL}/signup\n\nOnce registered, try 'find laptop'!`;
                } else {
                    responseMsg = (isAdminUser ? `👑 *Admin:* report, stock, broadcast, lookup\n\n` : '') + 
                                  `🛍️ *Shopping:* find [product], under [price], orders, track, pay, gift`;
                }
            }
            else {
                responseMsg = user ? "I didn't quite catch that. Try 'help'!" : "Welcome! Please type 'hi' or 'register' to get started.";
            }
        }

        const sentMsg = await client.messages.create({ body: responseMsg, from: 'whatsapp:+14155238886', to: from });
        console.log(`[Bridge] Sent to ${from}. SID: ${sentMsg.sid}`);
        res.status(200).send('Done');
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(200).send('Error');
    }
});

app.listen(port, () => {
    console.log(`\n🚀 WhatsApp Bridge is running on http://localhost:${port}`);
    console.log(`👉 Step 1: Run "ngrok http ${port}" to get a public URL.`);
    console.log(`👉 Step 2: Set the ngrok URL as your WhatsApp Sandbox webhook in Twilio.`);
});
