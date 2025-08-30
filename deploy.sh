#!/bin/bash

# LLM Playground VPS Deployment Script
# Target VPS: 193.180.213.125

set -e

echo "🚀 Starting LLM Playground deployment to VPS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="193.180.213.125"
VPS_USER="root"  # Change this to your VPS username if different
PROJECT_NAME="llm-playground"
DOMAIN=""  # Add your domain here if you have one

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "VPS IP: $VPS_IP"
echo "Project Name: $PROJECT_NAME"
echo "Domain: ${DOMAIN:-'Not configured'}"

# Check if we're running locally or on the VPS
if [ "$(hostname -I | grep $VPS_IP)" ]; then
    echo -e "${GREEN}✅ Running on VPS - proceeding with local deployment${NC}"
    IS_VPS=true
else
    echo -e "${YELLOW}🌐 Running locally - will deploy to remote VPS${NC}"
    IS_VPS=false
fi

# Function to run commands
run_cmd() {
    if [ "$IS_VPS" = true ]; then
        echo -e "${BLUE}Running: $1${NC}"
        eval "$1"
    else
        echo -e "${BLUE}Running on VPS: $1${NC}"
        ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "$1"
    fi
}

# Function to copy files
copy_files() {
    if [ "$IS_VPS" = false ]; then
        echo -e "${BLUE}Copying files to VPS...${NC}"
        rsync -avz --exclude='venv/' --exclude='node_modules/' --exclude='.git/' \
            -e "ssh -o StrictHostKeyChecking=no" ./ $VPS_USER@$VPS_IP:/root/$PROJECT_NAME/
    fi
}

# Update nginx configuration for VPS
update_nginx_config() {
    echo -e "${BLUE}📝 Updating nginx configuration...${NC}"
    
    if [ -n "$DOMAIN" ]; then
        # Use domain if configured
        SERVER_NAME="$DOMAIN"
    else
        # Use VPS IP
        SERVER_NAME="$VPS_IP"
    fi
    
    # Update nginx.conf with proper server name
    sed -i "s/server_name localhost;/server_name $SERVER_NAME;/" nginx.conf
    
    echo -e "${GREEN}✅ Nginx configuration updated${NC}"
}

# Install Docker and Docker Compose on VPS
install_docker() {
    echo -e "${BLUE}🐳 Installing Docker and Docker Compose...${NC}"
    
    run_cmd "apt-get update"
    run_cmd "apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release"
    run_cmd "curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg"
    run_cmd "echo \"deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \$(lsb_release -cs) stable\" | tee /etc/apt/sources.list.d/docker.list > /dev/null"
    run_cmd "apt-get update"
    run_cmd "apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin"
    run_cmd "systemctl enable docker"
    run_cmd "systemctl start docker"
    
    echo -e "${GREEN}✅ Docker installed successfully${NC}"
}

# Setup firewall
setup_firewall() {
    echo -e "${BLUE}🔥 Setting up firewall...${NC}"
    
    run_cmd "ufw --force enable"
    run_cmd "ufw default deny incoming"
    run_cmd "ufw default allow outgoing"
    run_cmd "ufw allow ssh"
    run_cmd "ufw allow 80"
    run_cmd "ufw allow 443"
    run_cmd "ufw --force reload"
    
    echo -e "${GREEN}✅ Firewall configured${NC}"
}

# Build and start services
deploy_services() {
    echo -e "${BLUE}🏗️ Building and starting services...${NC}"
    
    run_cmd "cd /root/$PROJECT_NAME"
    run_cmd "docker-compose down --remove-orphans"
    run_cmd "docker-compose build --no-cache"
    run_cmd "docker-compose up -d"
    
    echo -e "${GREEN}✅ Services deployed successfully${NC}"
}

# Check service health
check_health() {
    echo -e "${BLUE}🏥 Checking service health...${NC}"
    
    sleep 30  # Wait for services to start
    
    # Check if services are running
    run_cmd "cd /root/$PROJECT_NAME && docker-compose ps"
    
    # Check backend health
    echo -e "${BLUE}Testing backend...${NC}"
    if run_cmd "curl -f http://localhost:8000/" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
    else
        echo -e "${RED}❌ Backend health check failed${NC}"
    fi
    
    # Check frontend
    echo -e "${BLUE}Testing frontend...${NC}"
    if run_cmd "curl -f http://localhost:3000/" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is healthy${NC}"
    else
        echo -e "${RED}❌ Frontend health check failed${NC}"
    fi
    
    # Check nginx
    echo -e "${BLUE}Testing nginx...${NC}"
    if run_cmd "curl -f http://localhost:80/" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Nginx is healthy${NC}"
    else
        echo -e "${RED}❌ Nginx health check failed${NC}"
    fi
}

# Create systemd service for auto-restart
create_systemd_service() {
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

    run_cmd "systemctl daemon-reload"
    run_cmd "systemctl enable llm-playground.service"
    
    echo -e "${GREEN}✅ Systemd service created${NC}"
}

# Main deployment process
main() {
    echo -e "${GREEN}🎯 Starting deployment process...${NC}"
    
    # Update nginx config
    update_nginx_config
    
    # Copy files to VPS if running locally
    if [ "$IS_VPS" = false ]; then
        copy_files
    fi
    
    # Install Docker on VPS
    run_cmd "which docker || install_docker"
    
    # Setup firewall
    setup_firewall
    
    # Deploy services
    deploy_services
    
    # Check health
    check_health
    
    # Create systemd service
    create_systemd_service
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${BLUE}📱 Your LLM Playground is now available at:${NC}"
    if [ -n "$DOMAIN" ]; then
        echo -e "${GREEN}   http://$DOMAIN${NC}"
    else
        echo -e "${GREEN}   http://$VPS_IP${NC}"
    fi
    echo -e "${BLUE}📊 API Documentation:${NC}"
    if [ -n "$DOMAIN" ]; then
        echo -e "${GREEN}   http://$DOMAIN/docs${NC}"
    else
        echo -e "${GREEN}   http://$VPS_IP/docs${NC}"
    fi
    echo -e "${BLUE}🔧 Management commands:${NC}"
    echo -e "${YELLOW}   Stop: docker-compose down${NC}"
    echo -e "${YELLOW}   Start: docker-compose up -d${NC}"
    echo -e "${YELLOW}   Logs: docker-compose logs -f${NC}"
    echo -e "${YELLOW}   Restart: systemctl restart llm-playground${NC}"
}

# Run main function
main "$@"
