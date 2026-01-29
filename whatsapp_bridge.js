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

app.post('/whatsapp', async (req, res) => {
    const incomingMsg = req.body.Body.trim().toLowerCase();
    const from = req.body.From;

    console.log(`📩 Message: "${incomingMsg}" from ${from}`);

    // Admin Security Check (Optional but recommended)
    const isAdminUser = from.includes('2018'); // Simple check for your number based on previous logs

    try {
        let responseMsg = '';
        const botHeaders = { 'x-bot-token': process.env.ADMIN_BOT_TOKEN };

        // 📊 FEATURE 1: Daily Report
        if (incomingMsg.includes('report') || incomingMsg.includes('stats')) {
            if (!isAdminUser) return res.status(200).send('Unauthorized');
            const { data } = await axios.get(`${APP_URL}/api/admin/stats`, { headers: botHeaders });
            responseMsg = `📊 *Daily Summary*\n\n` +
                          `💰 Revenue: $${data.today.revenue.toFixed(2)}\n` +
                          `📦 Orders Today: ${data.today.orders}\n` +
                          `📈 All-time Orders: ${data.allTime.orders}\n\n` +
                          `🔥 *Top Products:*\n` +
                          data.topProducts.map(p => `- ${p.name} (${p.count})`).join('\n');
        }
        // ⚠️ FEATURE 2: Low Stock
        else if (incomingMsg.includes('low stock') || incomingMsg === 'stock') {
            if (!isAdminUser) return res.status(200).send('Unauthorized');
            const { data } = await axios.get(`${APP_URL}/api/admin/low-stock`, { headers: botHeaders });
            if (data.length === 0) {
                responseMsg = '✅ All items are well stocked!';
            } else {
                responseMsg = '⚠️ *Low Stock Alert:*\n\n' +
                              data.map(p => `*${p.name}*\nID: ${p.id} | Stock: ${p.stock}`).join('\n\n');
            }
        }
        // 🔍 FEATURE 3: User Lookup
        else if (incomingMsg.startsWith('lookup ')) {
            if (!isAdminUser) return res.status(200).send('Unauthorized');
            const username = incomingMsg.split(' ')[1];
            const { data } = await axios.get(`${APP_URL}/api/admin/users/lookup/${username}`, { headers: botHeaders });
            responseMsg = `👤 *User Details: ${data.user.username}*\n\n` +
                          `📧 Email: ${data.user.email}\n` +
                          `📱 Phone: ${data.user.phoneNumber || 'N/A'}\n` +
                          `📦 Total Orders: ${data.orderCount}\n` +
                          `🛡️ Admin: ${data.user.isAdmin ? 'Yes' : 'No'}`;
        }
        // ✏️ FEATURE 4: Quick Update (Update 7 stock 50)
        else if (incomingMsg.startsWith('update ')) {
            if (!isAdminUser) return res.status(200).send('Unauthorized');
            const parts = incomingMsg.split(' '); // update [id] [field] [value]
            const id = parts[1];
            const field = parts[2];
            const value = parts[3];

            if (!['price', 'stock'].includes(field)) {
                responseMsg = '❌ Invalid field. Use "price" or "stock".';
            } else {
                await axios.patch(`${APP_URL}/api/products/${id}`, { [field]: value }, { headers: botHeaders });
                responseMsg = `✅ Updated *${field}* of product *${id}* to *${value}*!`;
            }
        }
        // 🛍️ Standard Consumer Actions
        else if (incomingMsg.includes('product') || incomingMsg.includes('shop')) {
            const { data: products } = await axios.get(`${APP_URL}/api/products`);
            responseMsg = '🛍️ *Latest Arrivals:*\n\n' +
                          products.slice(0, 5).map(p => `*${p.name}*\nPrice: $${p.price}\nLink: ${APP_URL}\n`).join('\n');
        } 
        else if (incomingMsg.includes('hi') || incomingMsg.includes('hello')) {
            responseMsg = 'Hello! 🤖 I am your *ClawdBot* helper.\n\n' +
                          (isAdminUser ? '👑 *Admin Commands:* \n- "report"\n- "stock"\n- "lookup [user]"\n- "update [id] [price/stock] [val]"' : 'Ask me for "products" to see stock!');
        }
        else {
            responseMsg = 'I didn\'t quite catch that. Try saying "show products"!';
        }

        await client.messages.create({
            body: responseMsg,
            from: 'whatsapp:+14155238886',
            to: from
        });

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
