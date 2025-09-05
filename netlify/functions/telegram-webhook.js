const fetch = require('node-fetch');

// In-memory storage for bot configurations (use a database in production)
const botConfigs = new Map();

exports.handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            }
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Extract bot token from path
        const pathParts = event.path.split('/');
        const botToken = pathParts[pathParts.length - 1];

        if (!botToken) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Bot token not found in path' })
            };
        }

        const update = JSON.parse(event.body);
        
        // Process the Telegram update
        await processTelegramUpdate(update, botToken);
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ok: true })
        };
    } catch (error) {
        console.error('Error processing webhook:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

async function processTelegramUpdate(update, botToken) {
    if (!update.message || !update.message.text) {
        return;
    }

    const chatId = update.message.chat.id;
    const messageText = update.message.text;
    const userId = update.message.from.id;

    console.log(`Received message from ${userId}: ${messageText}`);

    try {
        // Use environment variable for API key
        const geminiApiKey = process.env.GEMINI_API_KEY;
        
        if (!geminiApiKey) {
            await sendTelegramMessage(botToken, chatId, 
                'Sorry, the AI service is not configured. Please contact the administrator.');
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

async function handleTelegramCommand(botToken, chatId, command, user) {
    const cmd = command.toLowerCase();
    
    switch (cmd) {
        case '/start':
            const welcomeMessage = `🤖 *Welcome to Nano Banana AI!*

Hello ${user.first_name}! I'm your AI assistant powered by Google's Gemini AI.

*Available commands:*
/start - Show this welcome message
/help - Get help information
/about - Learn more about me

Just send me any message and I'll do my best to help you!`;
            await sendTelegramMessage(botToken, chatId, welcomeMessage, 'Markdown');
            break;
            
        case '/help':
            const helpMessage = `🆘 *Help - Nano Banana AI*

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
• I can handle multiple languages`;
            await sendTelegramMessage(botToken, chatId, helpMessage, 'Markdown');
            break;
            
        case '/about':
            const aboutMessage = `ℹ️ *About Nano Banana AI*

I'm an AI assistant powered by Google's Gemini AI model. I was created to help users with various tasks through natural conversation.

*Features:*
• Natural language understanding
• Multi-topic conversations
• Real-time responses
• Available 24/7

*Version:* 1.0
*Powered by:* Google Gemini AI
*Created by:* Nano Banana AI Team`;
            await sendTelegramMessage(botToken, chatId, aboutMessage, 'Markdown');
            break;
            
        default:
            await sendTelegramMessage(botToken, chatId, 
                'Unknown command. Type /help to see available commands.');
    }
}

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
