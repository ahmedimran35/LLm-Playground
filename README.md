# AI Nexus - Your AI Model Hublication

A beautiful, modern web application connecting you to multiple AI models and providers. This project provides a sleek interface for chatting with various AI models including GPT-4, Claude, Gemini, DeepSeek, and many more - all through a unified, elegant platform.

## ✨ Features

- **Multiple AI Models**: Access 20+ different AI models in one place
- **Multiple Providers**: Choose from various providers (DeepInfra, DeepSeek, OpenAI, etc.)
- **Beautiful UI**: Modern, responsive design with smooth animations
- **Real-time Chat**: Instant messaging with AI models
- **Chat History**: Save and manage your conversations
- **Code Support**: Syntax highlighting for code blocks
- **Advanced Settings**: Temperature control, token limits, and more
- **Mobile Responsive**: Works perfectly on all devices
- **Open Source**: Completely free and open source

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd LLM-Playground
   ```

2. **Install Backend Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

4. **Start the Backend Server**
   ```bash
   # From the root directory
   cd backend
   python main.py
   ```
   The backend will start on `http://localhost:8000`

5. **Start the Frontend Development Server**
   ```bash
   # From the frontend directory
   cd frontend
   npm start
   ```
   The frontend will start on `http://localhost:3000`

6. **Open your browser**
   Navigate to `http://localhost:3000` to start using the application!

## 🏗️ Project Structure

```
LLM-Playground/
├── backend/
│   └── main.py              # FastAPI backend server
├── frontend/
│   ├── public/
│   │   └── index.html       # Main HTML file
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingPage.js    # Landing page component
│   │   │   ├── Playground.js     # Main chat interface
│   │   │   ├── ChatHistory.js    # Chat history component
│   │   │   └── Navigation.js     # Navigation component
│   │   ├── App.js           # Main app component
│   │   ├── index.js         # React entry point
│   │   └── index.css        # Global styles
│   ├── package.json         # Frontend dependencies
│   ├── tailwind.config.js   # Tailwind configuration
│   └── postcss.config.js    # PostCSS configuration
├── requirements.txt         # Backend dependencies
└── README.md               # This file
```

## 🎯 Available Models

The application supports a wide variety of AI models:

### GPT Models
- GPT-4o
- GPT-4o-mini
- GPT-3.5-turbo

### Claude Models
- Claude-3-Opus
- Claude-3-Sonnet
- Claude-3-Haiku

### DeepSeek Models
- DeepSeek Chat
- DeepSeek Coder

### Gemini Models
- Gemini Pro
- Gemini Flash

### Local Models (via DeepInfra)
- Llama 3.1 (8B, 70B)
- Mistral 7B
- Mixtral 8x7B
- CodeLlama 34B
- Qwen 2.5 (7B, 14B, 32B, 72B, 110B)

## 🔧 Configuration

### Backend Configuration

The backend uses FastAPI and can be configured through environment variables:

```bash
# Create a .env file in the backend directory
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000
```

### Frontend Configuration

The frontend is configured to proxy API requests to the backend. You can modify the proxy setting in `frontend/package.json`:

```json
{
  "proxy": "http://localhost:8000"
}
```

## 🎨 Customization

### Styling

The application uses Tailwind CSS for styling. You can customize the design by modifying:

- `frontend/tailwind.config.js` - Tailwind configuration
- `frontend/src/index.css` - Global styles and custom components

### Adding New Models

To add new models, update the `AVAILABLE_MODELS` dictionary in `backend/main.py`:

```python
AVAILABLE_MODELS = {
    "your-new-model": ["g4f.Provider.YourProvider"],
    # ... existing models
}
```

## 🚀 Deployment

### Backend Deployment

1. **Using Docker**
   ```bash
   docker build -t gpt4free-webapp-backend .
   docker run -p 8000:8000 gpt4free-webapp-backend
   ```

2. **Using Python directly**
   ```bash
   pip install -r requirements.txt
   python backend/main.py
   ```

### Frontend Deployment

1. **Build for production**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to static hosting**
   - Vercel: `vercel --prod`
   - Netlify: `netlify deploy --prod`
   - GitHub Pages: Push to `gh-pages` branch

## 🔒 Security Considerations

- The application is designed for development and personal use
- No authentication is implemented by default
- Consider adding authentication for production deployments
- Be aware of rate limits from different providers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [GPT4Free](https://github.com/xtekky/gpt4free) - The amazing library that makes this possible
- [FastAPI](https://fastapi.tiangolo.com/) - Modern, fast web framework
- [React](https://reactjs.org/) - JavaScript library for building user interfaces
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library for React

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

## 🔄 Updates

Stay updated with the latest features and improvements by:

- Starring this repository
- Watching for updates
- Following the release notes

---

**Happy Chatting! 🚀**
