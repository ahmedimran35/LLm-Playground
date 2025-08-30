# LLM Playground VPS Deployment Guide

## Overview
This guide will help you deploy your LLM Playground to your VPS at `193.180.213.125`.

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

3. **Run the deployment script:**
   ```bash
   cd /root/llm-playground
   chmod +x deploy-vps.sh
   ./deploy-vps.sh
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

3. **Install Docker:**
   ```bash
   apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
   echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
   apt-get update
   apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
   systemctl enable docker
   systemctl start docker
   ```

4. **Setup firewall:**
   ```bash
   ufw --force enable
   ufw default deny incoming
   ufw default allow outgoing
   ufw allow ssh
   ufw allow 80
   ufw allow 443
   ufw --force reload
   ```

5. **Deploy the application:**
   ```bash
   cd /root/llm-playground
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Configuration

### Environment Variables
The application uses the following environment variables:

- `API_HOST`: Backend host (default: 0.0.0.0)
- `API_PORT`: Backend port (default: 8000)
- `REACT_APP_API_URL`: Frontend API URL (default: http://193.180.213.125:8000)

### Nginx Configuration
The production nginx configuration (`nginx.prod.conf`) includes:
- Security headers
- Rate limiting
- Gzip compression
- Static asset caching
- WebSocket support
- SSL ready (commented out)

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

### Docker Commands
```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Access container shell
docker-compose exec backend bash
docker-compose exec frontend sh
```

## Monitoring

### Health Checks
- Backend: `http://193.180.213.125:8000/`
- Frontend: `http://193.180.213.125:3000/`
- Nginx: `http://193.180.213.125/`
- API Docs: `http://193.180.213.125/docs`

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# System logs
journalctl -u llm-playground -f
```

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
   - Uncomment the HTTPS server block in `nginx.prod.conf`
   - Update the domain name
   - Restart nginx: `docker-compose restart nginx`

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

2. **Docker permission issues:**
   ```bash
   # Add user to docker group
   usermod -aG docker $USER
   newgrp docker
   ```

3. **Memory issues:**
   ```bash
   # Check memory usage
   free -h
   docker stats
   
   # Increase swap if needed
   fallocate -l 2G /swapfile
   chmod 600 /swapfile
   mkswap /swapfile
   swapon /swapfile
   echo '/swapfile none swap sw 0 0' >> /etc/fstab
   ```

4. **Service won't start:**
   ```bash
   # Check logs
   docker-compose logs
   journalctl -u llm-playground
   
   # Check disk space
   df -h
   
   # Restart Docker
   systemctl restart docker
   ```

### Performance Optimization

1. **Resource limits:**
   - The production docker-compose file includes resource limits
   - Adjust based on your VPS specifications

2. **Caching:**
   - Nginx is configured with static asset caching
   - Consider adding Redis for session caching

3. **Monitoring:**
   ```bash
   # Install monitoring tools
   apt-get install -y htop iotop nethogs
   
   # Monitor resources
   htop
   docker stats
   ```

## Backup and Recovery

### Backup
```bash
# Backup application data
tar -czf llm-playground-backup-$(date +%Y%m%d).tar.gz /root/llm-playground

# Backup Docker volumes
docker run --rm -v llm-playground_backend_logs:/data -v $(pwd):/backup alpine tar czf /backup/volumes-backup-$(date +%Y%m%d).tar.gz -C /data .
```

### Recovery
```bash
# Restore from backup
tar -xzf llm-playground-backup-YYYYMMDD.tar.gz -C /
cd /root/llm-playground
docker-compose up -d
```

## Security Considerations

1. **Firewall:** UFW is configured to allow only necessary ports
2. **Security headers:** Nginx includes security headers
3. **Rate limiting:** API endpoints are rate-limited
4. **Regular updates:** Keep system and Docker images updated

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify service status: `docker-compose ps`
3. Check system resources: `htop`, `df -h`
4. Review this troubleshooting guide

## URLs

After successful deployment, your LLM Playground will be available at:
- **Main Application:** http://193.180.213.125
- **API Documentation:** http://193.180.213.125/docs
- **Health Check:** http://193.180.213.125/health
