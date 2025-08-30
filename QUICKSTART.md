# 🚀 Quick Start Guide - AI Nexus

Get your AI Nexus running in minutes!

## Option 1: One-Click Start (Recommended)

```bash
# Make scripts executable (if not already done)
chmod +x start_all.sh

# Start both backend and frontend
./start_all.sh
```

This will automatically:
- ✅ Install all dependencies
- ✅ Start the backend server on port 8000
- ✅ Start the frontend server on port 3000
- ✅ Open your browser to the application

## Option 2: Manual Start

### Step 1: Start Backend
```bash
./start_backend.sh
```

### Step 2: Start Frontend (in a new terminal)
```bash
./start_frontend.sh
```

## Option 3: Docker (Production)

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

## 🌐 Access Your Application

Once started, you can access:

- **Main App**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🎯 First Steps

1. **Visit the Landing Page**: Go to http://localhost:3000
2. **Click "Start Chatting"**: This takes you to the playground
3. **Choose a Model**: Select from 20+ available AI models
4. **Select a Provider**: Choose your preferred provider
5. **Start Chatting**: Type your message and press Enter!

## 🔧 Troubleshooting

### Backend Issues
```bash
# Check if Python 3.10+ is installed
python3 --version

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Frontend Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Port Conflicts
If ports 3000 or 8000 are in use:
```bash
# Kill processes on specific ports
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:8000 | xargs kill -9
```

## 📱 Mobile Access

The app is fully responsive! Access it from your phone by:
1. Find your computer's IP address: `ip addr show`
2. On your phone, go to: `http://YOUR_IP:3000`

## 🎨 Customization

- **Change Colors**: Edit `frontend/tailwind.config.js`
- **Add Models**: Update `backend/main.py` AVAILABLE_MODELS
- **Modify UI**: Edit components in `frontend/src/components/`

## 🆘 Need Help?

- Check the [main README.md](README.md) for detailed documentation
- Look at the [API docs](http://localhost:8000/docs) when backend is running
- Create an issue on GitHub if you encounter problems

---

**Happy Chatting! 🚀**
