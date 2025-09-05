const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Store bot configurations (in production, use a database)
const botConfigs = new Map();

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to call Gemini AI (proxy to avoid CORS issues)
app.post('/api/gemini', async (req, res) => {
    try {
        const { message, apiKey } = req.body;
        
        if (!message || !apiKey) {
            return res.status(400).json({ error: 'Message and API key are required' });
        }

        const response = await callGeminiAPI(message, apiKey);
        res.json({ response });
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        res.status(500).json({ error: 'Failed to get AI response' });
    }
});

// Telegram webhook setup
app.post('/api/telegram/setup', async (req, res) => {
    try {
        const { botToken, webhookUrl, apiKey } = req.body;
        
        if (!botToken) {
            return res.status(400).json({ error: 'Bot token is required' });
        }

        // Set webhook for the bot
        const baseUrl = 'https://tnano.netlify.app';
        const telegramUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
        const webhookResponse = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: webhookUrl || `${baseUrl}/webhook/${botToken}`
            })
        });

        const result = await webhookResponse.json();
        
        if (result.ok) {
            // Store bot configuration
            botConfigs.set(botToken, {
                token: botToken,
                webhookUrl: webhookUrl || `${baseUrl}/webhook/${botToken}`,
                apiKey: apiKey, // Store API key for this bot
                setupTime: new Date()
            });
            
            res.json({ 
                success: true, 
                webhookUrl: webhookUrl || `${baseUrl}/webhook/${botToken}`,
                message: 'Telegram bot webhook set successfully'
            });
        } else {
            res.status(400).json({ error: result.description || 'Failed to set webhook' });
        }
    } catch (error) {
        console.error('Error setting up Telegram bot:', error);
        res.status(500).json({ error: 'Failed to setup Telegram bot' });
    }
});

// Telegram webhook endpoint
app.post('/webhook/:botToken', async (req, res) => {
    try {
        const { botToken } = req.params;
        const update = req.body;

        // Verify bot token exists in our configs
        if (!botConfigs.has(botToken)) {
            return res.status(404).json({ error: 'Bot not found' });
        }

        // Process the update
        await processTelegramUpdate(update, botToken);
        
        res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Error processing Telegram webhook:', error);
        res.status(500).json({ error: 'Failed to process update' });
    }
});

// Get bot info
app.get('/api/telegram/info/:botToken', async (req, res) => {
    try {
        const { botToken } = req.params;
        
        const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        const result = await response.json();
        
        if (result.ok) {
            res.json(result.result);
        } else {
            res.status(400).json({ error: result.description || 'Failed to get bot info' });
        }
    } catch (error) {
        console.error('Error getting bot info:', error);
        res.status(500).json({ error: 'Failed to get bot info' });
    }
});

// Process Telegram updates
async function processTelegramUpdate(update, botToken) {
    if (!update.message || !update.message.text) {
        return;
    }

    const chatId = update.message.chat.id;
    const messageText = update.message.text;
    const userId = update.message.from.id;

    console.log(`Received message from ${userId}: ${messageText}`);

    try {
        // Get API key from bot configuration or environment
        // In production, you'd want to store user-specific API keys
        let geminiApiKey = process.env.GEMINI_API_KEY;
        
        // For now, we'll prompt users to set their API key via web interface
        // and store it with the bot config
        const botConfig = botConfigs.get(botToken);
        if (botConfig && botConfig.apiKey) {
            geminiApiKey = botConfig.apiKey;
        }
        
        if (!geminiApiKey) {
            await sendTelegramMessage(botToken, chatId, 
                'Sorry, the AI service is not configured. Please set up your API key via the web interface at https://tnano.netlify.app');
            return;
        }

        // Handle special commands
        if (messageText.startsWith('/')) {
            await handleTelegramCommand(botToken, chatId, messageText, update.message.from);
            return;
        }

        // Get AI response
        const aiResponse = await callGeminiAPI(messageText, geminiApiKey);
        
        // Send response back to Telegram
        await sendTelegramMessage(botToken, chatId, aiResponse);
        
    } catch (error) {
        console.error('Error processing message:', error);
        await sendTelegramMessage(botToken, chatId, 
            'Sorry, I encountered an error processing your message. Please try again later.');
    }
}

// Handle Telegram commands
async function handleTelegramCommand(botToken, chatId, command, user) {
    const cmd = command.toLowerCase();
    
    switch (cmd) {
        case '/start':
            const welcomeMessage = `
🤖 *Welcome to Nano Banana AI!*

Hello ${user.first_name}! I'm your AI assistant powered by Google's Gemini AI.

*Available commands:*
/start - Show this welcome message
/help - Get help information
/about - Learn more about me

Just send me any message and I'll do my best to help you!
            `;
            await sendTelegramMessage(botToken, chatId, welcomeMessage, 'Markdown');
            break;
            
        case '/help':
            const helpMessage = `
🆘 *Help - Nano Banana AI*

I can help you with:
• Answering questions
• Explaining concepts
• Writing and editing text
• Solving problems
• Creative tasks
• And much more!

Just type your question or request, and I'll respond as quickly as possible.

*Tips:*
• Be specific in your questions
• You can ask follow-up questions
• I can handle multiple languages
            `;
            await sendTelegramMessage(botToken, chatId, helpMessage, 'Markdown');
            break;
            
        case '/about':
            const aboutMessage = `
ℹ️ *About Nano Banana AI*

I'm an AI assistant powered by Google's Gemini AI model. I was created to help users with various tasks through natural conversation.

*Features:*
• Natural language understanding
• Multi-topic conversations
• Real-time responses
• Available 24/7

*Version:* 1.0
*Powered by:* Google Gemini AI
*Created by:* Nano Banana AI Team
            `;
            await sendTelegramMessage(botToken, chatId, aboutMessage, 'Markdown');
            break;
            
        default:
            await sendTelegramMessage(botToken, chatId, 
                'Unknown command. Type /help to see available commands.');
    }
}

// Call Gemini AI API
async function callGeminiAPI(message, apiKey) {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    
    const requestBody = {
        contents: [{
            parts: [{
                text: message
            }]
        }],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`Gemini API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
    } else {
        throw new Error('Invalid response format from Gemini API');
    }
}

// Send message to Telegram
async function sendTelegramMessage(botToken, chatId, text, parseMode = null) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const payload = {
        chat_id: chatId,
        text: text
    };
    
    if (parseMode) {
        payload.parse_mode = parseMode;
    }
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (!result.ok) {
            console.error('Failed to send Telegram message:', result);
        }
        
        return result;
    } catch (error) {
        console.error('Error sending Telegram message:', error);
        throw error;
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        activeBots: botConfigs.size
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Nano Banana AI Server running on port ${PORT}`);
    console.log(`📱 Web interface: http://localhost:${PORT}`);
    console.log(`🤖 Telegram webhook base: http://localhost:${PORT}/webhook/`);
});

module.exports = app;
