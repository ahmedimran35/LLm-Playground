#!/bin/bash

# LLM Playground VPS Deployment Script
# Run this script directly on your VPS

set -e

echo "🚀 LLM Playground VPS Deployment"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="193.180.213.125"
PROJECT_NAME="llm-playground"

echo -e "${BLUE}📋 VPS Configuration:${NC}"
echo "VPS IP: $VPS_IP"
echo "Project Name: $PROJECT_NAME"

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
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw

# Install Docker
echo -e "${BLUE}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✅ Docker installed successfully${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# Setup firewall
echo -e "${BLUE}🔥 Configuring firewall...${NC}"
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force reload
echo -e "${GREEN}✅ Firewall configured${NC}"

# Create project directory
echo -e "${BLUE}📁 Setting up project directory...${NC}"
mkdir -p /root/$PROJECT_NAME
cd /root/$PROJECT_NAME

# Copy production nginx config
if [ -f "nginx.prod.conf" ]; then
    cp nginx.prod.conf nginx.conf
    echo -e "${GREEN}✅ Using production nginx configuration${NC}"
fi

# Create SSL directory (for future use)
mkdir -p ssl

# Build and start services
echo -e "${BLUE}🏗️ Building and starting services...${NC}"
docker-compose down --remove-orphans 2>/dev/null || true
docker-compose build --no-cache
docker-compose up -d

# Wait for services to start
echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 30

# Check service health
echo -e "${BLUE}🏥 Checking service health...${NC}"

# Check if services are running
docker-compose ps

# Test backend
echo -e "${BLUE}Testing backend...${NC}"
if curl -f http://localhost:8000/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi

# Test frontend
echo -e "${BLUE}Testing frontend...${NC}"
if curl -f http://localhost:3000/ > /dev/null 2>&1; then
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
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/root/$PROJECT_NAME
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable llm-playground.service
echo -e "${GREEN}✅ Systemd service created${NC}"

# Create management script
echo -e "${BLUE}📝 Creating management script...${NC}"
cat > /root/$PROJECT_NAME/manage.sh << 'EOF'
#!/bin/bash

# LLM Playground Management Script

case "$1" in
    start)
        echo "Starting LLM Playground..."
        docker-compose up -d
        ;;
    stop)
        echo "Stopping LLM Playground..."
        docker-compose down
        ;;
    restart)
        echo "Restarting LLM Playground..."
        docker-compose down
        docker-compose up -d
        ;;
    logs)
        echo "Showing logs..."
        docker-compose logs -f
        ;;
    status)
        echo "Service status:"
        docker-compose ps
        ;;
    update)
        echo "Updating LLM Playground..."
        git pull
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status|update}"
        exit 1
        ;;
esac
EOF

chmod +x /root/$PROJECT_NAME/manage.sh
echo -e "${GREEN}✅ Management script created${NC}"

# Final status
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
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

# Show current status
echo -e "${BLUE}📊 Current service status:${NC}"
cd /root/$PROJECT_NAME
docker-compose ps
