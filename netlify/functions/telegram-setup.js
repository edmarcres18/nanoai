const fetch = require('node-fetch');

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
        const { botToken, webhookUrl, apiKey } = JSON.parse(event.body);
        
        if (!botToken) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Bot token is required' })
            };
        }

        // Set webhook for the bot
        const baseUrl = 'https://tnano.netlify.app';
        const telegramUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
        const webhookResponse = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: webhookUrl || `${baseUrl}/.netlify/functions/telegram-webhook/${botToken}`
            })
        });

        const result = await webhookResponse.json();
        
        if (result.ok) {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    success: true, 
                    webhookUrl: webhookUrl || `${baseUrl}/.netlify/functions/telegram-webhook/${botToken}`,
                    message: 'Telegram bot webhook set successfully'
                })
            };
        } else {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ error: result.description || 'Failed to set webhook' })
            };
        }
    } catch (error) {
        console.error('Error setting up Telegram bot:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Failed to setup Telegram bot' })
        };
    }
};
