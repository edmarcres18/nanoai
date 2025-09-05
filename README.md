# 🤖 Nano Banana AI

A modern web-based AI assistant powered by Google's Gemini AI with integrated Telegram bot functionality.

## ✨ Features

- **Beautiful Web Interface**: Modern, responsive design with real-time chat
- **Gemini AI Integration**: Powered by Google's latest Gemini 2.0 Flash model
- **Telegram Bot Support**: Full integration with Telegram for mobile access
- **Secure API Key Management**: Local storage with easy reset functionality
- **Real-time Status**: Live connection status indicators
- **Cross-platform**: Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- (Optional) A Telegram Bot Token ([Create bot with @BotFather](https://t.me/botfather))

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Open Your Browser**
   Navigate to `http://localhost:3000`

## 🔧 Setup Guide

### Web Interface Setup

1. **Enter API Key**: When you first open the app, enter your Gemini API key
2. **Start Chatting**: Begin conversing with Nano Banana AI immediately
3. **Manage Settings**: Use the buttons to clear chat, reset API key, or configure Telegram

### Telegram Bot Setup

1. **Create a Bot**: Message [@BotFather](https://t.me/botfather) on Telegram
   - Send `/newbot`
   - Choose a name and username for your bot
   - Copy the bot token

2. **Configure in Web Interface**:
   - Click "Telegram Bot" button
   - Enter your bot token
   - Click "Connect"
   - Copy the webhook URL provided

3. **Set Webhook** (if using external server):
   - The webhook is automatically configured when using the web interface
   - For manual setup: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_WEBHOOK_URL>`

## 🌐 Deployment

### Local Development
```bash
npm start
# Server runs on http://localhost:3000
```

### Production Deployment

1. **Environment Variables**:
   ```bash
   export PORT=3000
   export GEMINI_API_KEY=your_gemini_api_key_here
   ```

2. **Deploy to Cloud Platform**:
   - **Heroku**: `git push heroku main`
   - **Vercel**: `vercel --prod`
   - **Railway**: `railway up`
   - **DigitalOcean**: Use App Platform

## 📱 Using the Telegram Bot

Once configured, your Telegram bot supports:

### Commands
- `/start` - Welcome message and introduction
- `/help` - Show available features and tips
- `/about` - Information about the AI assistant

### Features
- **Natural Conversations**: Just type any message
- **Multi-language Support**: Supports multiple languages
- **Real-time Responses**: Fast AI-powered replies
- **24/7 Availability**: Always ready to help

## 🔒 Security Notes

- **API Keys**: Stored locally in browser localStorage
- **Server Security**: Bot tokens are stored in memory (use database in production)
- **HTTPS**: Use HTTPS in production for webhook security
- **Rate Limiting**: Consider implementing rate limiting for production use

## 🛠️ API Endpoints

### Web API
- `GET /` - Main web interface
- `POST /api/gemini` - Proxy for Gemini AI API calls
- `GET /health` - Health check endpoint

### Telegram API
- `POST /api/telegram/setup` - Configure Telegram bot webhook
- `POST /webhook/:botToken` - Telegram webhook endpoint
- `GET /api/telegram/info/:botToken` - Get bot information

## 🎨 Customization

### Styling
Edit `styles.css` to customize the appearance:
- Colors and gradients
- Layout and spacing
- Animations and effects

### Functionality
Modify `script.js` to add features:
- Custom message formatting
- Additional API integrations
- Enhanced UI interactions

### Server Features
Extend `server.js` for:
- Database integration
- User authentication
- Advanced bot commands
- Analytics and logging

## 🐛 Troubleshooting

### Common Issues

1. **API Key Invalid**
   - Verify your Gemini API key is correct
   - Check API key permissions and quotas

2. **Telegram Bot Not Responding**
   - Ensure webhook URL is accessible from internet
   - Check bot token is valid
   - Verify webhook is set correctly

3. **CORS Errors**
   - Use the server proxy endpoint `/api/gemini`
   - Ensure server is running for Telegram functionality

4. **Connection Issues**
   - Check internet connection
   - Verify server is running on correct port
   - Check firewall settings

## 📄 License

MIT License - feel free to use and modify as needed.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Create an issue on the repository

---

**Enjoy using Nano Banana AI! 🍌🤖**
