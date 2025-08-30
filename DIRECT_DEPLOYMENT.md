# LLM Playground Direct VPS Deployment Guide (No Docker)

## Overview
This guide will help you deploy your LLM Playground directly on your VPS at `193.180.213.125` without using Docker.

## Prerequisites
- VPS with Ubuntu 20.04+ or similar Linux distribution
- Root access to the VPS
- At least 2GB RAM and 10GB storage
- Internet connection

## Quick Deployment

### Option 1: Automated Deployment (Recommended)

1. **Copy files to VPS:**
   ```bash
   # From your local machine
   rsync -avz --exclude='venv/' --exclude='node_modules/' --exclude='.git/' \
       -e "ssh -o StrictHostKeyChecking=no" ./ root@193.180.213.125:/root/llm-playground/
   ```

2. **SSH into your VPS:**
   ```bash
   ssh root@193.180.213.125
   ```

3. **Run the direct deployment script:**
   ```bash
   cd /root/llm-playground
   chmod +x deploy-direct.sh
   ./deploy-direct.sh
   ```

### Option 2: Manual Deployment

1. **SSH into your VPS:**
   ```bash
   ssh root@193.180.213.125
   ```

2. **Update system:**
   ```bash
   apt-get update && apt-get upgrade -y
   ```

3. **Install required packages:**
   ```bash
   apt-get install -y \
       curl wget git unzip software-properties-common \
       build-essential python3 python3-pip python3-venv \
       nodejs npm nginx supervisor ufw htop screen
   ```

4. **Install Node.js 18+ (if needed):**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
   apt-get install -y nodejs
   ```

5. **Setup firewall:**
   ```bash
   ufw --force enable
   ufw default deny incoming
   ufw default allow outgoing
   ufw allow ssh
   ufw allow 80
   ufw allow 443
   ufw allow 8000
   ufw --force reload
   ```

6. **Deploy the application:**
   ```bash
   cd /root/llm-playground
   ./deploy-direct.sh
   ```

## What Gets Installed

### System Packages
- **Python 3** with pip and venv
- **Node.js 18+** with npm
- **Nginx** web server
- **Supervisor** process manager
- **UFW** firewall
- **Build tools** and utilities

### Application Setup
- **Python virtual environment** with all dependencies
- **Node.js dependencies** installed
- **Frontend built** for production
- **Nginx configuration** with reverse proxy
- **Supervisor configuration** for process management
- **Systemd service** for auto-restart

## Configuration

### Environment Variables
- `API_HOST`: Backend host (0.0.0.0)
- `API_PORT`: Backend port (8000)
- `REACT_APP_API_URL`: Frontend API URL (http://193.180.213.125:8000)
- `PORT`: Frontend port (3000)

### Nginx Configuration
- Reverse proxy for frontend and backend
- Security headers
- WebSocket support
- API routing
- Health check endpoint

### Supervisor Configuration
- Backend process management
- Frontend process management
- Auto-restart on failure
- Log management

## Management

### Service Management
```bash
cd /root/llm-playground

# Start services
./manage.sh start

# Stop services
./manage.sh stop

# Restart services
./manage.sh restart

# View logs
./manage.sh logs

# Check status
./manage.sh status

# Update from git
./manage.sh update
```

### Systemd Service
```bash
# Start via systemd
systemctl start llm-playground

# Stop via systemd
systemctl stop llm-playground

# Restart via systemd
systemctl restart llm-playground

# Check status
systemctl status llm-playground

# Enable auto-start
systemctl enable llm-playground
```

### Supervisor Commands
```bash
# Check all services
supervisorctl status

# Restart all services
supervisorctl restart all

# Restart specific service
supervisorctl restart llm-playground-backend
supervisorctl restart llm-playground-frontend

# View logs
tail -f /var/log/llm-playground-backend.log
tail -f /var/log/llm-playground-frontend.log
```

### Direct Commands
```bash
# Start backend manually
cd /root/llm-playground
source venv/bin/activate
python backend/main.py

# Start frontend manually
cd /root/llm-playground/frontend
npm start

# Check nginx
systemctl status nginx
nginx -t
```

## Monitoring

### Health Checks
- Backend: `http://193.180.213.125:8000/`
- Frontend: `http://193.180.213.125:3000/`
- Nginx: `http://193.180.213.125/`
- API Docs: `http://193.180.213.125/docs`
- Health: `http://193.180.213.125/health`

### Logs
```bash
# Backend logs
tail -f /var/log/llm-playground-backend.log

# Frontend logs
tail -f /var/log/llm-playground-frontend.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System logs
journalctl -u llm-playground -f
```

### Resource Monitoring
```bash
# System resources
htop
free -h
df -h

# Process monitoring
ps aux | grep python
ps aux | grep node
ps aux | grep nginx
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Check what's using the port
   lsof -i :8000
   lsof -i :3000
   lsof -i :80
   
   # Kill the process
   kill -9 <PID>
   ```

2. **Python virtual environment issues:**
   ```bash
   # Recreate virtual environment
   cd /root/llm-playground
   rm -rf venv
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Node.js issues:**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Reinstall dependencies
   cd /root/llm-playground/frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Nginx issues:**
   ```bash
   # Test configuration
   nginx -t
   
   # Restart nginx
   systemctl restart nginx
   
   # Check nginx status
   systemctl status nginx
   ```

5. **Supervisor issues:**
   ```bash
   # Check supervisor status
   supervisorctl status
   
   # Restart supervisor
   systemctl restart supervisor
   
   # Reload configuration
   supervisorctl reread
   supervisorctl update
   ```

6. **Memory issues:**
   ```bash
   # Check memory usage
   free -h
   
   # Increase swap if needed
   fallocate -l 2G /swapfile
   chmod 600 /swapfile
   mkswap /swapfile
   swapon /swapfile
   echo '/swapfile none swap sw 0 0' >> /etc/fstab
   ```

### Performance Optimization

1. **Resource limits:**
   - Monitor with `htop` and `free -h`
   - Adjust supervisor configuration if needed

2. **Nginx optimization:**
   - Enable gzip compression
   - Configure caching headers
   - Optimize worker processes

3. **Python optimization:**
   - Use production WSGI server (gunicorn)
   - Enable multiprocessing
   - Optimize database connections

## Backup and Recovery

### Backup
```bash
# Backup application
tar -czf llm-playground-backup-$(date +%Y%m%d).tar.gz /root/llm-playground

# Backup logs
tar -czf logs-backup-$(date +%Y%m%d).tar.gz /var/log/llm-playground-*.log

# Backup nginx configuration
cp /etc/nginx/sites-available/llm-playground /root/llm-playground-backup/
```

### Recovery
```bash
# Restore from backup
tar -xzf llm-playground-backup-YYYYMMDD.tar.gz -C /
cd /root/llm-playground
./manage.sh restart
```

## Security Considerations

1. **Firewall:** UFW is configured to allow only necessary ports
2. **Security headers:** Nginx includes security headers
3. **Process isolation:** Each service runs in its own process
4. **Regular updates:** Keep system packages updated

## SSL/HTTPS Setup (Optional)

1. **Install Certbot:**
   ```bash
   apt-get install -y certbot python3-certbot-nginx
   ```

2. **Get SSL certificate (if you have a domain):**
   ```bash
   certbot --nginx -d your-domain.com
   ```

3. **Update nginx configuration:**
   - Certbot will automatically update nginx configuration
   - Restart nginx: `systemctl restart nginx`

## Support

If you encounter issues:
1. Check logs: `./manage.sh logs`
2. Verify service status: `./manage.sh status`
3. Check system resources: `htop`, `df -h`
4. Review this troubleshooting guide

## URLs

After successful deployment, your LLM Playground will be available at:
- **Main Application:** http://193.180.213.125
- **API Documentation:** http://193.180.213.125/docs
- **Health Check:** http://193.180.213.125/health

## Advantages of Direct Deployment

1. **No Docker overhead** - Direct system access
2. **Easier debugging** - Direct log access
3. **Better performance** - No containerization layer
4. **Simpler updates** - Direct file modifications
5. **Resource efficiency** - Lower memory usage
6. **Familiar tools** - Standard Linux services
