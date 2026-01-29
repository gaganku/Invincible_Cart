const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const sendWhatsAppMessage = async (to, body) => {
    try {
        // Ensure recipient is in the correct WhatsApp format
        const recipient = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
        
        console.log(`[WhatsAppService] Sending message to ${recipient}...`);
        
        const message = await client.messages.create({
            body: body,
            from: 'whatsapp:+14155238886', // Twilio Sandbox Number
            to: recipient
        });

        console.log(`[WhatsAppService] Message sent successfully. SID: ${message.sid}`);
        return { success: true, sid: message.sid };
    } catch (error) {
        console.error(`[WhatsAppService] Error sending message to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Sends a structured order confirmation receipt
 */
const sendOrderConfirmation = async (user, order) => {
    if (!user.phoneNumber) {
        console.log(`[WhatsAppService] No phone number for user ${user.username}, skipping notification.`);
        return;
    }

    const messageBody = `🎉 *Order Confirmed!* \n\n` +
                        `Hi ${user.username}, thank you for shopping with us! \n\n` +
                        `📦 *Order Details:* \n` +
                        `- ID: #${order._id.toString().slice(-6)}\n` +
                        `- Item: ${order.productName || 'Your purchase'}\n` +
                        `- Total: $${order.totalAmount || order.price}\n\n` +
                        `🚚 We will notify you when it ships! \n\n` +
                        `_Track your order anytime by typing "track #${order._id.toString().slice(-6)}" on WhatsApp._`;

    return await sendWhatsAppMessage(user.phoneNumber, messageBody);
};

module.exports = {
    sendWhatsAppMessage,
    sendOrderConfirmation
};
