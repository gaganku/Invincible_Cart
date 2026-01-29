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

    const adminNumber = process.env.ADMIN_PHONE_NUMBER || '918123065334';
    const isAdminUser = from.includes(adminNumber);
    const botHeaders = { 'x-bot-token': process.env.ADMIN_BOT_TOKEN };

    try {
        let responseMsg = '';
        let user = null;

        // 🆔 IDENTITY MATCHING: Find database user by WhatsApp number
        try {
            const { data: foundUser } = await axios.get(`${APP_URL}/api/admin/users/by-phone/${from}`, { headers: botHeaders });
            user = foundUser;
            console.log(`[Bridge] Identified User: ${user.username}`);
        } catch (e) {
            console.log(`[Bridge] Visitor (No account found for ${from})`);
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
                if (incomingMsg === '1') { userState[from].step = 'entering_value'; userState[from].field = 'price'; responseMsg = `💰 New Price:`; }
                else if (incomingMsg === '2') { userState[from].step = 'entering_value'; userState[from].field = 'stock'; responseMsg = `📦 New Stock:`; }
            } else {
                if (incomingMsg === '1') {
                    delete userState[from];
                    responseMsg = `📌 *${prod.name}*\n\n${prod.description}\n\nPrice: $${prod.price}\nCategory: ${prod.category}\nLink: ${APP_URL}`;
                } else if (incomingMsg === '2') {
                    if (!user) {
                        responseMsg = '⚠️ Please register on our website with this phone number to use the Cart feature!';
                        delete userState[from];
                    } else {
                        await axios.post(`${APP_URL}/api/admin/cart/${user._id}`, { productId: prod.id }, { headers: botHeaders });
                        delete userState[from];
                        responseMsg = `🛒 Added *${prod.name}* to your cart! \n\nCheck it out here: ${APP_URL}/cart`;
                    }
                }
            }
        }
        else if (state.step === 'entering_value' && isAdminUser) {
            await axios.patch(`${APP_URL}/api/products/${state.product.id}`, { [state.field]: incomingMsg }, { headers: botHeaders });
            delete userState[from];
            responseMsg = `🎉 Updated ${state.field}!`;
        }
        // --- Commands ---
        else {
            // 🔎 ADVANCED SEARCH (Feature 1)
            if (incomingMsg.startsWith('find ') || incomingMsg.startsWith('search ')) {
                const query = body.split(' ').slice(1).join(' ');
                const { data: products } = await axios.get(`${APP_URL}/api/products`);
                const matches = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
                
                if (matches.length === 0) responseMsg = `❌ No results for "${query}".`;
                else {
                    userState[from] = { step: 'picking_product', results: matches };
                    responseMsg = `🔍 Search results for "${query}":\n\n` + matches.map((p, i) => `${i+1}. *${p.name}* ($${p.price})`).join('\n') + `\n\nReply with a number!`;
                }
            }
            // 💰 PRICE FILTERS
            else if (incomingMsg.includes('under ') || incomingMsg.includes('below ')) {
                const max = parseInt(incomingMsg.replace(/\D/g, ''));
                if (isNaN(max)) responseMsg = "Please specify a number, e.g., 'products under 50'.";
                else {
                    const { data: products } = await axios.get(`${APP_URL}/api/products`);
                    const matches = products.filter(p => p.price <= max).slice(0, 5);
                    responseMsg = matches.length ? `💸 Deals under $${max}:\n\n` + matches.map(p => `- *${p.name}* ($${p.price})`).join('\n') : `😔 No items found under $${max}.`;
                }
            }
            // 📦 ORDER MANAGEMENT (Feature 2)
            else if (incomingMsg === 'my orders' || incomingMsg === 'orders') {
                if (!user) responseMsg = "⚠️ I couldn't find an account for this number.";
                else {
                    const { data: orders } = await axios.get(`${APP_URL}/api/admin/orders/user/${user._id}`, { headers: botHeaders });
                    responseMsg = orders.length ? `📦 *Your Recent Orders:*\n\n` + orders.map(o => `ID: #${o._id.slice(-6)}\nItem: ${o.productId?.name}\nStatus: ${o.status}\n---`).join('\n\n') : "You haven't placed any orders yet!";
                }
            }
            else if (incomingMsg.startsWith('track #')) {
                const id = body.split('#')[1];
                try {
                    const { data: order } = await axios.get(`${APP_URL}/api/admin/orders/track/${id}`, { headers: botHeaders });
                    responseMsg = `🚚 *Tracking info for #${id.slice(-6)}*\n\nStatus: *${order.status.toUpperCase()}*\nItem: ${order.productId.name}\nPlaced on: ${new Date(order.date).toLocaleDateString()}`;
                } catch (e) { responseMsg = "❌ Order not found. Double check the ID!"; }
            }
            // 💰 PAYMENTS (Feature 4)
            else if (incomingMsg === 'pay' || incomingMsg === 'checkout') {
                if (!user) responseMsg = "⚠️ Register first!";
                else {
                    const { data: cart } = await axios.get(`${APP_URL}/api/admin/cart/${user._id}`, { headers: botHeaders });
                    const total = cart.items.reduce((sum, i) => sum + (i.productId?.price * i.quantity || 0), 0);
                    if (total === 0) responseMsg = "🛒 Your cart is empty!";
                    else {
                        const upiLink = `upi://pay?pa=your-upi-id@bank&pn=Shop&am=${total}&cu=USD`; // Placeholder
                        responseMsg = `💳 *Checkout Summary*\nTotal: *$${total.toFixed(2)}*\n\nClick link to pay via UPI:\n${upiLink}\n\n_Note: This is a simulation!_`;
                    }
                }
            }
            // 🎫 PROMO CODES
            else if (incomingMsg.startsWith('promo ')) {
                const code = incomingMsg.split(' ')[1];
                if (code === 'GET10') responseMsg = "🎉 *Valid Code!* You've unlocked 10% off. Apply it at checkout on our website.";
                else responseMsg = "❌ Invalid promo code.";
            }
            // AI Shopping Assistant
            else if (incomingMsg.includes('gift') || incomingMsg.includes('recommend')) {
                const { data: products } = await axios.get(`${APP_URL}/api/products`);
                const random = products[Math.floor(Math.random() * products.length)];
                responseMsg = `🎁 *ClawdBot Gift Guide*\n\nBased on your interest, I recommend: *${random.name}*!\n\nIt's a best-seller in our store. Interested? Reply "update ${random.name}" to add to cart!`;
            }
            // 📢 ADMIN COMMANDS (Preserved)
            else if (isAdminUser && incomingMsg === 'report') {
                const { data } = await axios.get(`${APP_URL}/api/admin/stats`, { headers: botHeaders });
                responseMsg = `📊 *Admin Summary*\nRev: $${data.today.revenue.toFixed(2)}\nOrders: ${data.today.orders}`;
            }
            // 🆘 HELP
            else if (incomingMsg.includes('hi') || incomingMsg.includes('help')) {
                responseMsg = (isAdminUser ? `👑 *Admin:* report, stock, broadcast, lookup\n\n` : '') + 
                              `🤖 *Customer Commands:*\n` +
                              `- *find [product]*: Search catalog\n` +
                              `- *under [price]*: e.g. "under 50"\n` +
                              `- *orders*: History of purchases\n` +
                              `- *track #[id]*: Track order\n` +
                              `- *pay*: Checkout your cart\n` +
                              `- *promo [code]*: Apply coupon\n` +
                              `- *gift*: Guided shopping`;
            }
            else {
                responseMsg = "I'm your AI shopping assistant! Try saying 'find camera' or 'gift'.";
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
