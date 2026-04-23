# 🚀 Deployment Guide
## Sentinel AI - Production Deployment

---

## 📋 **Pre-Deployment Checklist**

Before deploying, ensure you have:
- [x] All critical fixes implemented
- [x] MongoDB Atlas account created
- [x] Domain name registered (optional but recommended)
- [x] Cloud provider account (DigitalOcean/AWS/Heroku)
- [x] SSL certificate ready (Let's Encrypt)
- [x] Email service configured (SendGrid/SMTP)
- [x] SMS service configured (Twilio - optional)

---

## 🌐 **Option 1: DigitalOcean Deployment** (Recommended)

### Step 1: Create Droplet

```bash
# 1. Log in to DigitalOcean
# 2. Create Droplet:
#    - Image: Ubuntu 22.04 LTS
#    - Plan: Basic ($18/month - 2GB RAM, 1 CPU)
#    - Or: CPU-Optimized ($40/month - 4GB RAM, 2 CPU) for better performance
#    - Datacenter: Choose closest to your users
#    - Add SSH key for secure access

# 3. Note your droplet IP address
```

### Step 2: Initial Server Setup

```bash
# SSH into your server
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Create non-root user
adduser sentinel
usermod -aG sudo sentinel

# Switch to new user
su - sentinel
```

### Step 3: Install Dependencies

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x

# Install Python 3 and pip
sudo apt install python3 python3-pip -y

# Install Git
sudo apt install git -y

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

### Step 4: Clone and Setup Application

```bash
# Clone your repository
cd /home/sentinel
git clone https://github.com/yourusername/behavior-risk-analysis.git
cd behavior-risk-analysis

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install ML service dependencies
cd ../ml_service
pip3 install -r requirements.txt
```

### Step 5: Configure Environment

```bash
# Create production .env file
cd /home/sentinel/behavior-risk-analysis/backend
cp .env.example .env
nano .env
```

**Production .env:**
```env
# Server
PORT=4005
NODE_ENV=production

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/behavior_risk_db?retryWrites=true&w=majority

# Security
JWT_SECRET=your-super-secret-production-key-change-this

# ML Service
ML_SERVICE_URL=http://localhost:5000

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Email (SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key

# SMS (Twilio - Optional)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

### Step 6: Build Frontend

```bash
cd /home/sentinel/behavior-risk-analysis/frontend

# Create production .env
echo "VITE_API_URL=https://yourdomain.com" > .env.production

# Build for production
npm run build

# This creates a 'dist' folder with optimized files
```

### Step 7: Start Services with PM2

```bash
# Start ML Service
cd /home/sentinel/behavior-risk-analysis/ml_service
pm2 start app.py --name sentinel-ml --interpreter python3

# Start Backend
cd /home/sentinel/behavior-risk-analysis/backend
pm2 start server.js --name sentinel-backend

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Follow the instructions shown
```

### Step 8: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/sentinel
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (React build)
    location / {
        root /home/sentinel/behavior-risk-analysis/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for video uploads
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:4005/health;
        access_log off;
    }

    # Static files (uploads)
    location /uploads {
        proxy_pass http://localhost:4005/uploads;
        proxy_set_header Host $host;
    }

    # File upload size limit
    client_max_body_size 100M;
}
```

**Enable the site:**
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/sentinel /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### Step 9: Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (recommended)

# Test auto-renewal
sudo certbot renew --dry-run

# Certbot will automatically renew certificates
```

### Step 10: Set Up Firewall

```bash
# Enable UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check status
sudo ufw status
```

### Step 11: Configure Automated Backups

```bash
# Create backup script
nano /home/sentinel/backup.sh
```

**Backup Script:**
```bash
#!/bin/bash

# Backup directory
BACKUP_DIR="/home/sentinel/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MongoDB (if using local MongoDB)
# mongodump --out=$BACKUP_DIR/mongodb_$DATE

# Backup uploads folder
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /home/sentinel/behavior-risk-analysis/backend/uploads

# Backup logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz /home/sentinel/behavior-risk-analysis/backend/logs

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

**Make executable and schedule:**
```bash
chmod +x /home/sentinel/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * /home/sentinel/backup.sh >> /home/sentinel/backup.log 2>&1
```

### Step 12: Set Up Monitoring

```bash
# Install monitoring tools
sudo npm install -g pm2-logrotate

# Configure log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# View logs
pm2 logs sentinel-backend
pm2 logs sentinel-ml

# Monitor processes
pm2 monit
```

---

## ☁️ **Option 2: AWS Deployment**

### Step 1: Launch EC2 Instance

```bash
# 1. Log in to AWS Console
# 2. Launch EC2 Instance:
#    - AMI: Ubuntu Server 22.04 LTS
#    - Instance Type: t3.medium (2 vCPU, 4GB RAM)
#    - Storage: 30GB SSD
#    - Security Group:
#      - SSH (22) from your IP
#      - HTTP (80) from anywhere
#      - HTTPS (443) from anywhere
#      - Custom TCP (4005) from anywhere (for API)

# 3. Download key pair (.pem file)
# 4. Connect to instance
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### Step 2: Follow Same Setup as DigitalOcean

```bash
# Follow steps 2-12 from DigitalOcean guide above
# Replace 'sentinel' user with 'ubuntu' (default AWS user)
```

### Step 3: Configure AWS-Specific Features

```bash
# Set up Elastic IP (static IP)
# 1. Allocate Elastic IP in AWS Console
# 2. Associate with your EC2 instance

# Set up S3 for file storage (optional)
# 1. Create S3 bucket
# 2. Configure AWS SDK in backend
# 3. Upload videos to S3 instead of local storage
```

---

## 🐳 **Option 3: Docker Deployment** (Advanced)

### Create Dockerfile for Backend

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 4005

CMD ["node", "server.js"]
```

### Create Dockerfile for Frontend

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "4005:4005"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/logs:/app/logs
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: unless-stopped

  ml-service:
    build: ./ml_service
    ports:
      - "5000:5000"
    restart: unless-stopped
```

### Deploy with Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 📊 **Post-Deployment Verification**

### 1. Check Health Endpoint

```bash
curl https://yourdomain.com/health

# Expected response:
{
  "status": "ok",
  "uptime": 123.456,
  "mongodb": "connected",
  "environment": "production"
}
```

### 2. Test API Endpoints

```bash
# Test registration
curl -X POST https://yourdomain.com/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"Test@1234","role":"cctv_user"}'

# Test login
curl -X POST https://yourdomain.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"Test@1234"}'
```

### 3. Check SSL Certificate

```bash
# Visit your site
https://yourdomain.com

# Should show:
# - Green padlock
# - Valid certificate
# - HTTPS enabled
```

### 4. Monitor Logs

```bash
# Backend logs
pm2 logs sentinel-backend

# ML service logs
pm2 logs sentinel-ml

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f /home/sentinel/behavior-risk-analysis/backend/logs/combined.log
tail -f /home/sentinel/behavior-risk-analysis/backend/logs/error.log
```

### 5. Performance Testing

```bash
# Install Apache Bench
sudo apt install apache2-utils -y

# Test API performance
ab -n 1000 -c 10 https://yourdomain.com/health

# Expected results:
# - Requests per second: >100
# - Time per request: <100ms
# - Failed requests: 0
```

---

## 🔄 **Continuous Deployment**

### Set Up GitHub Actions (CI/CD)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          cd /home/sentinel/behavior-risk-analysis
          git pull origin main
          cd backend && npm install
          cd ../frontend && npm install && npm run build
          pm2 restart all
```

---

## 🆘 **Troubleshooting**

### Issue: PM2 processes not starting

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs

# Restart services
pm2 restart all

# Delete and restart
pm2 delete all
pm2 start server.js --name sentinel-backend
```

### Issue: Nginx 502 Bad Gateway

```bash
# Check if backend is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Issue: MongoDB connection failed

```bash
# Check MongoDB Atlas IP whitelist
# Add your server IP to MongoDB Atlas

# Test connection
mongo "mongodb+srv://your-connection-string"
```

### Issue: SSL certificate not working

```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Restart Nginx
sudo systemctl restart nginx
```

---

## 📞 **Support**

For deployment issues:
1. Check logs first (`pm2 logs`, nginx logs)
2. Review this guide
3. Check MongoDB Atlas dashboard
4. Verify environment variables
5. Test health endpoint

---

**Your application is now deployed and running in production!** 🎉

---

*Last Updated: 2026-02-16*
