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

    // Admin Security Check: Use number from .env or fallback
    const adminNumber = process.env.ADMIN_PHONE_NUMBER || '918123065334';
    const isAdminUser = from.includes(adminNumber);

    try {
        let responseMsg = '';
        const botHeaders = { 'x-bot-token': process.env.ADMIN_BOT_TOKEN };
        console.log(`[Bridge] Bot Token present: ${!!process.env.ADMIN_BOT_TOKEN}`);

        // 📊 FEATURE 1: Daily Report
        if (incomingMsg.includes('report') || incomingMsg.includes('stats')) {
            console.log('[Bridge] Routing to Report...');
            if (!isAdminUser) {
                console.log('[Bridge] Unauthorized admin attempt.');
                return res.status(200).send('Unauthorized');
            }
            const { data } = await axios.get(`${APP_URL}/api/admin/stats`, { headers: botHeaders });
            console.log('[Bridge] Stats fetched.');
            responseMsg = `📊 *Daily Summary*\n\n` +
                          `💰 Revenue: $${data.today.revenue.toFixed(2)}\n` +
                          `📦 Orders Today: ${data.today.orders}\n` +
                          `📈 All-time Orders: ${data.allTime.orders}\n\n` +
                          `🔥 *Top Products:*\n` +
                          data.topProducts.map(p => `- ${p.name} (${p.count})`).join('\n');
        }
        // ⚠️ FEATURE 2: Low Stock
        else if (incomingMsg.includes('low stock') || incomingMsg === 'stock') {
            console.log('[Bridge] Routing to Stock...');
            if (!isAdminUser) return res.status(200).send('Unauthorized');
            const { data } = await axios.get(`${APP_URL}/api/admin/low-stock`, { headers: botHeaders });
            console.log('[Bridge] Stock fetched.');
            if (data.length === 0) {
                responseMsg = '✅ All items are well stocked!';
            } else {
                responseMsg = '⚠️ *Low Stock Alert:*\n\n' +
                              data.map(p => `*${p.name}*\nID: ${p.id} | Stock: ${p.stock}`).join('\n\n');
            }
        }
        // 🔍 FEATURE 3: User Lookup
        else if (incomingMsg.startsWith('lookup ')) {
            console.log('[Bridge] Routing to Lookup...');
            if (!isAdminUser) return res.status(200).send('Unauthorized');
            const username = incomingMsg.split(' ')[1];
            const { data } = await axios.get(`${APP_URL}/api/admin/users/lookup/${username}`, { headers: botHeaders });
            console.log('[Bridge] User found.');
            responseMsg = `👤 *User Details: ${data.user.username}*\n\n` +
                          `📧 Email: ${data.user.email}\n` +
                          `📱 Phone: ${data.user.phoneNumber || 'N/A'}\n` +
                          `📦 Total Orders: ${data.orderCount}\n` +
                          `🛡️ Admin: ${data.user.isAdmin ? 'Yes' : 'No'}`;
        }
        // ✏️ FEATURE 4: Quick Update (Update 7 stock 50)
        else if (incomingMsg.startsWith('update ')) {
            console.log('[Bridge] Routing to Update...');
            if (!isAdminUser) return res.status(200).send('Unauthorized');
            const parts = incomingMsg.split(' '); // update [id] [field] [value]
            const id = parts[1];
            const field = parts[2];
            const value = parts[3];

            if (!['price', 'stock'].includes(field)) {
                responseMsg = '❌ Invalid field. Use "price" or "stock".';
            } else {
                await axios.patch(`${APP_URL}/api/products/${id}`, { [field]: value }, { headers: botHeaders });
                console.log('[Bridge] Product updated.');
                responseMsg = `✅ Updated *${field}* of product *${id}* to *${value}*!`;
            }
        }
        // 📢 FEATURE 5: Marketing Broadcasts
        else if (incomingMsg.startsWith('broadcast: ')) {
            console.log('[Bridge] Routing to Broadcast...');
            if (!isAdminUser) return res.status(200).send('Unauthorized');
            const broadcastMsg = body.substring(11).trim(); // Keep original casing
            
            // 📞 Get all phone numbers from Backend
            const { data: phones } = await axios.get(`${APP_URL}/api/admin/users/phones`, { headers: botHeaders });
            
            console.log(`[Bridge] Broadcasting to ${phones.length} users...`);
            let count = 0;
            for (const phone of phones) {
                try {
                    await client.messages.create({
                        body: `📢 *Shop Alert:* \n\n${broadcastMsg}`,
                        from: 'whatsapp:+14155238886',
                        to: phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`
                    });
                    count++;
                } catch (e) {
                    console.error(`[Bridge] Failed to send to ${phone}:`, e.message);
                }
            }
            responseMsg = `✅ Broadcast finished! Sent to *${count}* users.`;
        }
        // 🛍️ Standard Consumer Actions
        else if (incomingMsg.includes('product') || incomingMsg.includes('shop')) {
            console.log('[Bridge] Routing to Products...');
            const { data: products } = await axios.get(`${APP_URL}/api/products`);
            console.log('[Bridge] Products list fetched.');
            responseMsg = '🛍️ *Latest Arrivals:*\n\n' +
                          products.slice(0, 5).map(p => `*${p.name}*\nPrice: $${p.price}\nLink: ${APP_URL}\n`).join('\n');
        } 
        // 🆘 FEATURE 6: Help Command
        else if (incomingMsg === '/help' || incomingMsg === 'help') {
            console.log('[Bridge] Routing to Help...');
            if (isAdminUser) {
                responseMsg = `👑 *ClawdBot Admin Help*\n\n` +
                              `📊 *report*: Get daily sales summary\n` +
                              `⚠️ *stock*: See items with < 5 units\n` +
                              `👤 *lookup [user]*: Search user details\n` +
                              `✏️ *update [id] [field] [val]*: Edit product\n` +
                              `   _Example: update 7 price 29.99_\n` +
                              `📢 *broadcast: [msg]*: Send mass alert\n\n` +
                              `🛍️ *products*: See catalog (customer view)`;
            } else {
                responseMsg = `🤖 *ClawdBot Shopping Help*\n\n` +
                              `🛍️ *products*: See our latest arrivals\n` +
                              `🛒 *cart*: View your current cart (Coming Soon)\n` +
                              `💬 *hi*: Get a friendly greeting`;
            }
        }
        else if (incomingMsg.includes('hi') || incomingMsg.includes('hello')) {
            console.log('[Bridge] Routing to Greeting...');
            responseMsg = 'Hello! 🤖 I am your *ClawdBot* helper.\n\n' +
                          (isAdminUser ? '👑 *Admin Commands:* \n- "report"\n- "stock"\n- "lookup [user]"\n- "update [id] [price/stock] [val]"' : 'Ask me for "products" to see stock!');
        }
        else {
            console.log('[Bridge] Unknown command.');
            responseMsg = 'I didn\'t quite catch that. Try saying "show products"!';
        }

        console.log(`[Bridge] Sending WhatsApp message via Twilio to ${from}...`);
        const sentMsg = await client.messages.create({
            body: responseMsg,
            from: 'whatsapp:+14155238886',
            to: from
        });
        console.log(`[Bridge] SMS sent successfully. SID: ${sentMsg.sid}`);

        res.status(200).send('Done');
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(200).send('Error handled'); // Keep Twilio happy
    }
});

app.listen(port, () => {
    console.log(`\n🚀 WhatsApp Bridge is running on http://localhost:${port}`);
    console.log(`👉 Step 1: Run "ngrok http ${port}" to get a public URL.`);
    console.log(`👉 Step 2: Set the ngrok URL as your WhatsApp Sandbox webhook in Twilio.`);
});
