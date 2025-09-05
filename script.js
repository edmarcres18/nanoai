class NanoBananaAI {
    constructor() {
        this.apiKey = localStorage.getItem('gemini_api_key');
        this.botToken = localStorage.getItem('telegram_bot_token');
        this.webhookUrl = '';
        this.chatHistory = [];
        
        this.initializeElements();
        this.bindEvents();
        this.checkInitialState();
    }

    initializeElements() {
        // API Setup elements
        this.apiSetup = document.getElementById('api-setup');
        this.apiKeyInput = document.getElementById('api-key-input');
        this.saveApiKeyBtn = document.getElementById('save-api-key');
        
        // Chat interface elements
        this.chatInterface = document.getElementById('chat-interface');
        this.chatMessages = document.getElementById('chat-messages');
        this.userInput = document.getElementById('user-input');
        this.sendButton = document.getElementById('send-button');
        
        // Status elements
        this.statusIndicator = document.getElementById('status-indicator');
        this.statusText = document.getElementById('status-text');
        
        // Telegram elements
        this.telegramSection = document.getElementById('telegram-section');
        this.botTokenInput = document.getElementById('bot-token');
        this.setupBotBtn = document.getElementById('setup-bot');
        this.webhookUrlSpan = document.getElementById('webhook-url');
        this.copyWebhookBtn = document.getElementById('copy-webhook');
        
        // Control buttons
        this.toggleTelegramBtn = document.getElementById('toggle-telegram');
        this.clearChatBtn = document.getElementById('clear-chat');
        this.resetApiBtn = document.getElementById('reset-api');
        
        // Loading overlay
        this.loadingOverlay = document.getElementById('loading-overlay');
    }

    bindEvents() {
        // API Key setup
        this.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
        this.apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveApiKey();
        });

        // Chat functionality
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.userInput.addEventListener('input', () => this.autoResizeTextarea());

        // Telegram bot setup
        this.setupBotBtn.addEventListener('click', () => this.setupTelegramBot());
        this.copyWebhookBtn.addEventListener('click', () => this.copyWebhookUrl());

        // Control buttons
        this.toggleTelegramBtn.addEventListener('click', () => this.toggleTelegramSection());
        this.clearChatBtn.addEventListener('click', () => this.clearChat());
        this.resetApiBtn.addEventListener('click', () => this.resetApiKey());
    }

    checkInitialState() {
        if (this.apiKey) {
            this.showChatInterface();
            this.updateStatus(true);
        } else {
            this.showApiSetup();
        }

        if (this.botToken) {
            this.botTokenInput.value = this.botToken;
            this.updateWebhookUrl();
        }
    }

    saveApiKey() {
        const apiKey = this.apiKeyInput.value.trim();
        if (!apiKey) {
            this.showNotification('Please enter a valid API key', 'error');
            return;
        }

        this.apiKey = apiKey;
        localStorage.setItem('gemini_api_key', apiKey);
        this.showChatInterface();
        this.updateStatus(true);
        this.showNotification('API key saved successfully!', 'success');
    }

    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        this.userInput.value = '';
        this.autoResizeTextarea();

        // Show loading
        this.showLoading(true);
        this.sendButton.disabled = true;

        try {
            const response = await this.callGeminiAPI(message);
            this.addMessage(response, 'bot');
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            this.addMessage('Sorry, I encountered an error. Please check your API key and try again.', 'bot');
        } finally {
            this.showLoading(false);
            this.sendButton.disabled = false;
            this.userInput.focus();
        }
    }

    async callGeminiAPI(message) {
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: message
                }]
            }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': this.apiKey
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Invalid response format from API');
        }
    }

    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = `<p>${this.formatMessage(content)}</p>`;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        // Store in chat history
        this.chatHistory.push({ sender, content, timestamp: new Date() });
    }

    formatMessage(text) {
        // Basic markdown-like formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    scrollToBottom() {
        const chatContainer = this.chatMessages.parentElement;
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    autoResizeTextarea() {
        this.userInput.style.height = 'auto';
        this.userInput.style.height = Math.min(this.userInput.scrollHeight, 120) + 'px';
    }

    async setupTelegramBot() {
        const token = this.botTokenInput.value.trim();
        if (!token) {
            this.showNotification('Please enter a valid bot token', 'error');
            return;
        }

        if (!this.apiKey) {
            this.showNotification('Please set up your Gemini API key first', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            // Call the server to set up the webhook
            const response = await fetch('/.netlify/functions/telegram-setup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    botToken: token,
                    apiKey: this.apiKey
                })
            });

            const result = await response.json();

            if (result.success) {
                this.botToken = token;
                localStorage.setItem('telegram_bot_token', token);
                this.updateWebhookUrl();
                this.showNotification('Telegram bot configured successfully!', 'success');
            } else {
                this.showNotification(`Failed to setup bot: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error setting up Telegram bot:', error);
            this.showNotification('Failed to setup Telegram bot. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    updateWebhookUrl() {
        if (this.botToken) {
            // Netlify function webhook endpoint
            this.webhookUrl = `https://tnano.netlify.app/.netlify/functions/telegram-webhook/${this.botToken}`;
            this.webhookUrlSpan.textContent = this.webhookUrl;
            this.copyWebhookBtn.disabled = false;
        }
    }

    copyWebhookUrl() {
        navigator.clipboard.writeText(this.webhookUrl).then(() => {
            this.showNotification('Webhook URL copied to clipboard!', 'success');
        }).catch(() => {
            this.showNotification('Failed to copy webhook URL', 'error');
        });
    }

    toggleTelegramSection() {
        this.telegramSection.classList.toggle('hidden');
    }

    clearChat() {
        // Keep the welcome message
        const welcomeMessage = this.chatMessages.querySelector('.bot-message');
        this.chatMessages.innerHTML = '';
        if (welcomeMessage) {
            this.chatMessages.appendChild(welcomeMessage);
        }
        this.chatHistory = [];
        this.showNotification('Chat cleared!', 'success');
    }

    resetApiKey() {
        localStorage.removeItem('gemini_api_key');
        this.apiKey = null;
        this.showApiSetup();
        this.updateStatus(false);
        this.showNotification('API key reset. Please enter a new one.', 'info');
    }

    showApiSetup() {
        this.apiSetup.classList.remove('hidden');
        this.chatInterface.classList.add('hidden');
        this.apiKeyInput.focus();
    }

    showChatInterface() {
        this.apiSetup.classList.add('hidden');
        this.chatInterface.classList.remove('hidden');
        this.userInput.focus();
    }

    updateStatus(online) {
        if (online) {
            this.statusIndicator.className = 'status-indicator online';
            this.statusText.textContent = 'Online';
        } else {
            this.statusIndicator.className = 'status-indicator offline';
            this.statusText.textContent = 'Offline';
        }
    }

    showLoading(show) {
        if (show) {
            this.loadingOverlay.classList.remove('hidden');
        } else {
            this.loadingOverlay.classList.add('hidden');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1001;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        `;

        // Set background color based on type
        const colors = {
            success: '#2ecc71',
            error: '#e74c3c',
            info: '#3498db',
            warning: '#f39c12'
        };
        notification.style.background = colors[type] || colors.info;

        notification.textContent = message;
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Telegram Bot API Integration
    async handleTelegramWebhook(update) {
        if (!update.message || !update.message.text) return;

        const chatId = update.message.chat.id;
        const messageText = update.message.text;

        try {
            const response = await this.callGeminiAPI(messageText);
            await this.sendTelegramMessage(chatId, response);
        } catch (error) {
            console.error('Error processing Telegram message:', error);
            await this.sendTelegramMessage(chatId, 'Sorry, I encountered an error processing your message.');
        }
    }

    async sendTelegramMessage(chatId, text) {
        if (!this.botToken) return;

        const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
        
        try {
            await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: 'Markdown'
                })
            });
        } catch (error) {
            console.error('Error sending Telegram message:', error);
        }
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.nanoBananaAI = new NanoBananaAI();
});

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NanoBananaAI;
}
