#!/bin/bash

# LLM Playground Direct VPS Deployment Script
# No Docker - Direct installation on VPS

set -e

echo "🚀 LLM Playground Direct VPS Deployment (No Docker)"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="193.180.213.125"
PROJECT_NAME="llm-playground"
BACKEND_PORT="8000"
FRONTEND_PORT="3000"

echo -e "${BLUE}📋 VPS Configuration:${NC}"
echo "VPS IP: $VPS_IP"
echo "Project Name: $PROJECT_NAME"
echo "Backend Port: $BACKEND_PORT"
echo "Frontend Port: $FRONTEND_PORT"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ This script must be run as root${NC}"
    exit 1
fi

# Update system
echo -e "${BLUE}📦 Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# Install required packages
echo -e "${BLUE}📦 Installing required packages...${NC}"
apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    build-essential \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    nginx \
    supervisor \
    ufw \
    htop \
    screen

# Install Node.js 18+ if not available
if ! node --version | grep -q "v1[8-9]\|v2[0-9]"; then
    echo -e "${BLUE}📦 Installing Node.js 18...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Setup firewall
echo -e "${BLUE}🔥 Configuring firewall...${NC}"
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow $BACKEND_PORT
ufw --force reload
echo -e "${GREEN}✅ Firewall configured${NC}"

# Create project directory
echo -e "${BLUE}📁 Setting up project directory...${NC}"
mkdir -p /root/$PROJECT_NAME
cd /root/$PROJECT_NAME

# Create virtual environment for Python
echo -e "${BLUE}🐍 Setting up Python virtual environment...${NC}"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip

# Install Python dependencies
echo -e "${BLUE}📦 Installing Python dependencies...${NC}"
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    echo -e "${RED}❌ requirements.txt not found${NC}"
    exit 1
fi

# Install Node.js dependencies
echo -e "${BLUE}📦 Installing Node.js dependencies...${NC}"
if [ -d "frontend" ]; then
    cd frontend
    npm install
    cd ..
else
    echo -e "${RED}❌ frontend directory not found${NC}"
    exit 1
fi

# Build frontend
echo -e "${BLUE}🏗️ Building frontend...${NC}"
cd frontend
npm run build
cd ..

# Create nginx configuration
echo -e "${BLUE}🌐 Creating nginx configuration...${NC}"
cat > /etc/nginx/sites-available/llm-playground << EOF
server {
    listen 80;
    server_name $VPS_IP;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend
    location / {
        proxy_pass http://localhost:$FRONTEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /ws/ {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # API documentation
    location /docs {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable nginx site
ln -sf /etc/nginx/sites-available/llm-playground /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
echo -e "${GREEN}✅ Nginx configured${NC}"

# Create supervisor configuration
echo -e "${BLUE}⚙️ Creating supervisor configuration...${NC}"
cat > /etc/supervisor/conf.d/llm-playground.conf << EOF
[program:llm-playground-backend]
command=/root/$PROJECT_NAME/venv/bin/python backend/main.py
directory=/root/$PROJECT_NAME
user=root
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/llm-playground-backend.log
environment=API_HOST="0.0.0.0",API_PORT="$BACKEND_PORT"

[program:llm-playground-frontend]
command=npm start
directory=/root/$PROJECT_NAME/frontend
user=root
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/llm-playground-frontend.log
environment=REACT_APP_API_URL="http://$VPS_IP:$BACKEND_PORT",PORT="$FRONTEND_PORT"
EOF

# Update supervisor
supervisorctl reread
supervisorctl update
echo -e "${GREEN}✅ Supervisor configured${NC}"

# Create management script
echo -e "${BLUE}📝 Creating management script...${NC}"
cat > /root/$PROJECT_NAME/manage.sh << 'EOF'
#!/bin/bash

# LLM Playground Management Script (Direct Deployment)

case "$1" in
    start)
        echo "Starting LLM Playground..."
        supervisorctl start llm-playground-backend
        supervisorctl start llm-playground-frontend
        systemctl start nginx
        ;;
    stop)
        echo "Stopping LLM Playground..."
        supervisorctl stop llm-playground-backend
        supervisorctl stop llm-playground-frontend
        systemctl stop nginx
        ;;
    restart)
        echo "Restarting LLM Playground..."
        supervisorctl restart llm-playground-backend
        supervisorctl restart llm-playground-frontend
        systemctl restart nginx
        ;;
    logs)
        echo "Showing logs..."
        echo "=== Backend Logs ==="
        tail -f /var/log/llm-playground-backend.log
        ;;
    status)
        echo "Service status:"
        supervisorctl status
        systemctl status nginx --no-pager -l
        ;;
    update)
        echo "Updating LLM Playground..."
        git pull
        source venv/bin/activate
        pip install -r requirements.txt
        cd frontend && npm install && npm run build && cd ..
        supervisorctl restart llm-playground-backend
        supervisorctl restart llm-playground-frontend
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status|update}"
        exit 1
        ;;
esac
EOF

chmod +x /root/$PROJECT_NAME/manage.sh
echo -e "${GREEN}✅ Management script created${NC}"

# Start services
echo -e "${BLUE}🚀 Starting services...${NC}"
supervisorctl start llm-playground-backend
supervisorctl start llm-playground-frontend
systemctl restart nginx

# Wait for services to start
echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 30

# Check service health
echo -e "${BLUE}🏥 Checking service health...${NC}"

# Check supervisor status
supervisorctl status

# Test backend
echo -e "${BLUE}Testing backend...${NC}"
if curl -f http://localhost:$BACKEND_PORT/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi

# Test frontend
echo -e "${BLUE}Testing frontend...${NC}"
if curl -f http://localhost:$FRONTEND_PORT/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
fi

# Test nginx
echo -e "${BLUE}Testing nginx...${NC}"
if curl -f http://localhost:80/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Nginx is healthy${NC}"
else
    echo -e "${RED}❌ Nginx health check failed${NC}"
fi

# Create systemd service for auto-restart
echo -e "${BLUE}⚙️ Creating systemd service...${NC}"
cat > /etc/systemd/system/llm-playground.service << EOF
[Unit]
Description=LLM Playground
After=network.target

[Service]
Type=forking
ExecStart=/usr/bin/supervisord -c /etc/supervisor/supervisord.conf
ExecStop=/usr/bin/supervisorctl shutdown
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable llm-playground.service
echo -e "${GREEN}✅ Systemd service created${NC}"

# Final status
echo -e "${GREEN}🎉 Direct deployment completed successfully!${NC}"
echo -e "${BLUE}📱 Your LLM Playground is now available at:${NC}"
echo -e "${GREEN}   http://$VPS_IP${NC}"
echo -e "${BLUE}📊 API Documentation:${NC}"
echo -e "${GREEN}   http://$VPS_IP/docs${NC}"
echo -e "${BLUE}🔧 Management commands:${NC}"
echo -e "${YELLOW}   cd /root/$PROJECT_NAME${NC}"
echo -e "${YELLOW}   ./manage.sh start    # Start services${NC}"
echo -e "${YELLOW}   ./manage.sh stop     # Stop services${NC}"
echo -e "${YELLOW}   ./manage.sh restart  # Restart services${NC}"
echo -e "${YELLOW}   ./manage.sh logs     # View logs${NC}"
echo -e "${YELLOW}   ./manage.sh status   # Check status${NC}"
echo -e "${YELLOW}   ./manage.sh update   # Update from git${NC}"
echo -e "${BLUE}📋 System service:${NC}"
echo -e "${YELLOW}   systemctl start llm-playground   # Start via systemd${NC}"
echo -e "${YELLOW}   systemctl stop llm-playground    # Stop via systemd${NC}"
echo -e "${YELLOW}   systemctl restart llm-playground # Restart via systemd${NC}"
echo -e "${YELLOW}   systemctl status llm-playground  # Check systemd status${NC}"
echo -e "${BLUE}📊 Supervisor commands:${NC}"
echo -e "${YELLOW}   supervisorctl status              # Check all services${NC}"
echo -e "${YELLOW}   supervisorctl restart all         # Restart all services${NC}"

# Show current status
echo -e "${BLUE}📊 Current service status:${NC}"
supervisorctl status
systemctl status nginx --no-pager -l
