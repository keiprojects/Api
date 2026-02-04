# Deploy ChurchApps API with Coolify

This guide will help you deploy the ChurchApps API on your VPS using Coolify instead of AWS and GitHub Actions.

---

## Overview

**What is Coolify?**

- Self-hosted alternative to Heroku/Vercel/Netlify
- Runs on your own VPS
- Built-in support for Docker, databases, and deployments
- Free and open-source

**What you'll set up:**

- Node.js API application
- Single MySQL instance with 7 databases (one per module, including reporting)
- Automatic deployments from GitHub
- Custom domain (api.gsdavao.org)
- SSL certificate (automatic with Let's Encrypt)

---

## Prerequisites

- ✅ VPS with Coolify installed
- ✅ GitHub repository access
- ✅ Domain name (gsdavao.org)
- ✅ SSH access to your VPS
  s

---

## Part 1: Verify Coolify Installation

### Access Coolify Dashboard

1. Open your browser
2. Go to your Coolify instance (e.g., `https://coolify.yourvps.com`)
3. Login with your credentials

### Check System Requirements

**Minimum VPS specifications:**

- **RAM**: 4GB (2GB for API + 2GB for databases)
- **Storage**: 20GB available
- **CPU**: 2 cores recommended

**Check resources in Coolify:**

1. Go to **Settings** → **Server**
2. Check available resources
3. Ensure sufficient space and memory

---

## Part 2: Create MySQL Databases in Coolify (Single Instance)

You will use **one** MySQL container and create all required databases inside it.

1. Create one MySQL database in Coolify:
   - **Name**: `churchapps-mysql`
   - **Port**: `3306`

2. Connect to the database via terminal:

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Access the MySQL container
docker exec -it <mysql-container-id> mysql -u root -p
```

3. Create all **7** databases (includes reporting):

```sql
CREATE DATABASE membership;
CREATE DATABASE attendance;
CREATE DATABASE content;
CREATE DATABASE giving;
CREATE DATABASE messaging;
CREATE DATABASE doing;
CREATE DATABASE reporting;

-- Create user and grant permissions
CREATE USER 'churchapps'@'%' IDENTIFIED BY 'your-strong-password';
GRANT ALL PRIVILEGES ON membership.* TO 'churchapps'@'%';
GRANT ALL PRIVILEGES ON attendance.* TO 'churchapps'@'%';
GRANT ALL PRIVILEGES ON content.* TO 'churchapps'@'%';
GRANT ALL PRIVILEGES ON giving.* TO 'churchapps'@'%';
GRANT ALL PRIVILEGES ON messaging.* TO 'churchapps'@'%';
GRANT ALL PRIVILEGES ON doing.* TO 'churchapps'@'%';
GRANT ALL PRIVILEGES ON reporting.* TO 'churchapps'@'%';
FLUSH PRIVILEGES;
EXIT;
```

### Get Database Connection Strings

All databases use the same host but different database names:

```
mysql://churchapps:password@churchapps-mysql:3306/membership
mysql://churchapps:password@churchapps-mysql:3306/attendance
mysql://churchapps:password@churchapps-mysql:3306/content
mysql://churchapps:password@churchapps-mysql:3306/giving
mysql://churchapps:password@churchapps-mysql:3306/messaging
mysql://churchapps:password@churchapps-mysql:3306/doing
mysql://churchapps:password@churchapps-mysql:3306/reporting
```

Optional (Doing module also needs membership access):

```
mysql://churchapps:password@churchapps-mysql:3306/membership
```

**Save these connection strings** - you'll need them next!

---

## Part 3: Prepare the Application for Coolify

The ChurchApps API uses Serverless Framework (for AWS Lambda). We'll add a Docker build for Coolify.

### Dockerfile (included)

This repo includes a `Dockerfile` at the root. It builds with `npm run build:prod` and runs `dist/index.js`.

### .dockerignore (included)

A `.dockerignore` is included to keep builds fast and clean.

### Alternative: Use docker-compose.yml

If you prefer docker-compose (not required since DBs are managed separately):

```yaml
version: "3.8"

services:
  api:
    build: .
    ports:
      - "8084:8084"
      - "8087:8087"
    environment:
      - NODE_ENV=production
      - SERVER_PORT=8084
      - SOCKET_PORT=8087
      - SOCKET_URL=ws://localhost:8087
      - DELIVERY_PROVIDER=local
      - MEMBERSHIP_CONNECTION_STRING=${MEMBERSHIP_CONNECTION_STRING}
      - ATTENDANCE_CONNECTION_STRING=${ATTENDANCE_CONNECTION_STRING}
      - CONTENT_CONNECTION_STRING=${CONTENT_CONNECTION_STRING}
      - GIVING_CONNECTION_STRING=${GIVING_CONNECTION_STRING}
      - MESSAGING_CONNECTION_STRING=${MESSAGING_CONNECTION_STRING}
      - DOING_CONNECTION_STRING=${DOING_CONNECTION_STRING}
      - REPORTING_CONNECTION_STRING=${REPORTING_CONNECTION_STRING}
    restart: unless-stopped
```

---

## Part 4: Deploy Application in Coolify

### Create New Application

1. In Coolify dashboard, click **+ New Resource**
2. Select **Application**
3. Choose deployment method:
   - **Public Repository** (if your repo is public)
   - **Private Repository (GitHub)** (if private)

### Configure GitHub Connection

If using private repository:

1. Connect your GitHub account
2. Select organization: `ChurchApps`
3. Select repository: `Api`
4. Select branch: `main`

### Application Settings

**General:**

- **Name**: `churchapps-api`
- **Domain**: `api.gsdavao.org`
- **Port**: `8084` (uses `SERVER_PORT`, falls back to `PORT`)
- **Build Pack**: Docker (recommended)

**Build Configuration:**

- **Dockerfile**: `./Dockerfile`
- **Docker Compose**: `./docker-compose.yml` (if using compose)
- **Build Command**: `npm run build:prod` (if using Nixpacks)
- **Start Command**: `npm start` (if using Nixpacks)

**Environment Variables:**

Click **Add Environment Variable** for each:

```
ENVIRONMENT=prod
NODE_ENV=production
API_URL=https://api.gsdavao.org
MESSAGING_API=https://api.gsdavao.org/messaging
SERVER_PORT=8084
SOCKET_PORT=8087
SOCKET_URL=ws://api.gsdavao.org:8087
DELIVERY_PROVIDER=local
CORS_ORIGIN=*
MAIL_SYSTEM=
ENCRYPTION_KEY=your-192-bit-key
JWT_SECRET=your-jwt-secret

MEMBERSHIP_CONNECTION_STRING=mysql://churchapps:password@churchapps-mysql:3306/membership
ATTENDANCE_CONNECTION_STRING=mysql://churchapps:password@churchapps-mysql:3306/attendance
CONTENT_CONNECTION_STRING=mysql://churchapps:password@churchapps-mysql:3306/content
GIVING_CONNECTION_STRING=mysql://churchapps:password@churchapps-mysql:3306/giving
MESSAGING_CONNECTION_STRING=mysql://churchapps:password@churchapps-mysql:3306/messaging
DOING_CONNECTION_STRING=mysql://churchapps:password@churchapps-mysql:3306/doing
REPORTING_CONNECTION_STRING=mysql://churchapps:password@churchapps-mysql:3306/reporting

# Optional: Doing module needs direct membership access
DOING_MEMBERSHIP_CONNECTION_STRING=mysql://churchapps:password@churchapps-mysql:3306/membership
```

Replace `password` with your actual database password.
Note: `API_URL` and `MESSAGING_API` override the default values in `config/prod.json` (which point to `api.churchapps.org`).

### WebSockets (Messaging)

To enable real-time messaging, set `DELIVERY_PROVIDER=local`, expose `SOCKET_PORT`, and configure `SOCKET_URL`.

Examples:

```
# If proxied through your main domain
SOCKET_URL=wss://api.gsdavao.org/ws

# If directly exposed on a port
SOCKET_URL=ws://api.gsdavao.org:8087
```

### Network Settings

1. Enable **Connect to Network**: ON
2. Select network where your databases are running
3. This allows the API to connect to databases using internal hostnames

### Deploy

1. Click **Save**
2. Click **Deploy**
3. Watch the deployment logs
4. Wait for "Application deployed successfully" ✅

---

## Part 5: Configure Custom Domain (api.gsdavao.org)

### In Coolify

1. Go to your application settings
2. Find **Domains** section
3. Add domain: `api.gsdavao.org`
4. Enable **HTTPS**: Coolify will automatically get Let's Encrypt certificate
5. Save

### Update DNS Records

Go to your DNS provider and add an A record:

**DNS Configuration:**

- **Type**: A
- **Name**: `api` (creates api.gsdavao.org)
- **Value**: Your VPS IP address (e.g., `123.45.67.89`)
- **TTL**: 300 or 3600

**Wait 5-30 minutes** for DNS propagation.

### Verify SSL Certificate

1. Coolify will automatically request SSL certificate from Let's Encrypt
2. Check certificate status in Coolify
3. Should show "Certificate issued" ✅

---

## Part 6: Set Up Automatic Deployments

### Enable GitHub Webhooks

1. In Coolify application settings
2. Go to **Git** section
3. Enable **Automatic Deployment Enabled**: ON
4. Copy the webhook URL shown

### Add Webhook to GitHub

1. Go to GitHub: https://github.com/ChurchApps/Api
2. Click **Settings** → **Webhooks**
3. Click **Add webhook**
4. Fill in:
   - **Payload URL**: Paste Coolify webhook URL
   - **Content type**: `application/json`
   - **Secret**: Leave empty (or set in Coolify first)
   - **Events**: Just the push event
   - **Active**: ✅ Check
5. Click **Add webhook**

**Now**: Every push to `main` branch will trigger automatic deployment! 🎉

---

## Part 7: Scheduled Tasks (Coolify Cron Jobs)

AWS EventBridge timers are replaced by Coolify cron jobs that run Node scripts.

### Create Cron Jobs in Coolify

In your application, add these cron jobs:

1. **Every 15 minutes**
   - Schedule: `*/15 * * * *`
   - Command: `npm run cron:15min`

2. **Daily at 5 AM UTC** (matches existing Lambda schedule)
   - Schedule: `0 5 * * *`
   - Command: `npm run cron:midnight`

3. **Daily scheduled tasks**
   - Schedule: `0 5 * * *`
   - Command: `npm run cron:scheduled`

If you prefer different times, adjust the cron expressions.

---

## Part 8: Database Migrations

### Run Migrations Manually

SSH into your VPS and run migrations:

```bash
# Access the API container
docker exec -it <api-container-name> sh

# Run migrations
npm run migrate

# Or run specific module migrations
npm run migrate:membership
npm run migrate:attendance
# ... etc
```

### Alternative: Add Migration to Startup

Update your `Dockerfile`:

```dockerfile
# Add to the end
CMD ["sh", "-c", "npm run migrate && npm start"]
```

This runs migrations automatically on each deployment.

---

## Part 9: Monitor and Manage

### View Logs

In Coolify:

1. Go to your application
2. Click **Logs** tab
3. See real-time application logs

### Restart Application

1. Click **Restart** button
2. Application restarts with zero downtime (if configured)

### Update Environment Variables

1. Go to **Environment Variables**
2. Update any variable
3. Click **Save**
4. Restart application for changes to take effect

### Scale Application (Optional)

If you need more resources:

1. Update **Resource Limits**:
   - **CPU**: 2 cores
   - **Memory**: 2GB
2. Save and restart

---

## Part 10: Configure Email Service

### Understanding ChurchApps Email System

The ChurchApps API **already has email functionality built-in** via the `@churchapps/apihelper` package. It includes:

- Password reset emails
- Welcome emails with temporary passwords
- User notifications
- Admin alerts

**The email system needs to be configured** with environment variables.

### Email Configuration Options

The API typically supports SMTP configuration. You have several options:

#### Option 1: Use Gmail SMTP (Easiest for Testing)

**Setup:**

1. Enable 2-factor authentication on your Gmail account
2. Create an "App Password":
   - Go to https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Scroll down to "App passwords"
   - Generate password for "Mail"
3. Save the 16-character password

**Environment Variables:**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
SMTP_FROM=your-email@gmail.com
SMTP_FROM_NAME=ChurchApps API
```

**Limitations:**

- Gmail limits: 500 emails/day
- May be flagged as spam for bulk emails
- Not ideal for production

#### Option 2: SendGrid (Recommended for Production)

**Why SendGrid?**

- ✅ 100 emails/day FREE forever
- ✅ Professional email delivery
- ✅ Great deliverability rates
- ✅ Simple SMTP setup

**Setup:**

1. Go to https://sendgrid.com
2. Sign up for free account
3. Verify your email
4. Create an API Key:
   - Go to Settings → API Keys
   - Create API Key with "Mail Send" permissions
   - Copy the key (starts with `SG.`)

**Environment Variables:**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key-here
SMTP_FROM=noreply@gsdavao.org
SMTP_FROM_NAME=GS Davao ChurchApps
```

**Important**: Verify your sender email in SendGrid:

1. Go to Settings → Sender Authentication
2. Verify a Single Sender
3. Use `noreply@gsdavao.org` or your preferred email

#### Option 3: Resend (Modern Alternative)

**Setup:**

1. Go to https://resend.com
2. Sign up for free account
3. Add your domain `gsdavao.org`:
   - Go to Domains → Add Domain
   - Follow DNS setup instructions
4. Create API key

**Environment Variables (SMTP):**

```env
MAIL_SYSTEM=SMTP
SMTP_HOST=smtp.resend.com
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=re_your-resend-api-key
SUPPORT_EMAIL=noreply@gsdavao.org
```

Note: With `SMTP_SECURE=true`, nodemailer uses port `465` by default (matches Resend).

#### Option 4: Mailgun (Reliable, 5000 emails/month free)

**Setup:**

1. Go to https://www.mailgun.com
2. Sign up for free account
3. Verify your domain
4. Get SMTP credentials

**Environment Variables:**

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@gsdavao.org
SMTP_PASS=your-mailgun-password
SMTP_FROM=noreply@gsdavao.org
SMTP_FROM_NAME=GS Davao ChurchApps
```

### Add Email Config to Coolify

1. Go to your application in Coolify
2. Click **Environment Variables**
3. Add the SMTP variables for your chosen provider
4. Click **Save**
5. **Restart** the application

**Example for SendGrid:**

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxx
SMTP_FROM=noreply@gsdavao.org
SMTP_FROM_NAME=GS Davao Church
```

### Verify Email Configuration

After deployment, test the email system:

1. **Create a test user** in your application
2. **Check logs** in Coolify to see if email was sent
3. **Check spam folder** if you don't receive it
4. **Check SMTP logs** in your email provider dashboard

### Development/Testing Mode

If you just want to see emails in logs (not actually send them):

```env
EMAIL_MODE=development
# In development mode, emails are logged but not sent
```

This is useful for local testing without setting up SMTP.

### Troubleshooting Email Issues

#### Email Not Sending

**Check Coolify logs:**

```bash
# Look for email errors
docker logs <api-container-name> | grep -i email
docker logs <api-container-name> | grep -i smtp
```

**Common issues:**

1. Wrong SMTP credentials
2. Port blocked by firewall (try port 465 instead of 587)
3. Sender email not verified
4. SMTP server blocks your VPS IP

**Solutions:**

- Verify all SMTP environment variables are correct
- Check email provider dashboard for errors
- Ensure your VPS allows outbound SMTP connections
- Use authenticated SMTP (not port 25)

#### Emails Going to Spam

**Solutions:**

1. **Verify your domain** with email provider
2. **Set up SPF record**:
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:sendgrid.net ~all
   ```
3. **Set up DKIM** (email provider will give you records)
4. **Set up DMARC**:
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:admin@gsdavao.org
   ```

### Recommended Setup for Production

**For GS Davao ChurchApps:**

1. **Use SendGrid** (free, reliable, 100 emails/day)
2. **Verify sender**: `noreply@gsdavao.org`
3. **Set up SPF/DKIM** for better deliverability
4. **Monitor usage** in SendGrid dashboard

**Environment variables:**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.your-key-here
SMTP_FROM=noreply@gsdavao.org
SMTP_FROM_NAME=GS Davao Church
```

### Email Templates

The ChurchApps API uses built-in email templates. If you need to customize them, check:

- `/src/email-templates/` (if exists)
- Or modify in the `@churchapps/apihelper` package

---

## Part 11: Backup Strategy

### Database Backups

Create a backup script:

```bash
#!/bin/bash
# backup-databases.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Backup each database

docker exec churchapps-mysql mysqldump -u churchapps -p membership > $BACKUP_DIR/membership_$DATE.sql
docker exec churchapps-mysql mysqldump -u churchapps -p attendance > $BACKUP_DIR/attendance_$DATE.sql
docker exec churchapps-mysql mysqldump -u churchapps -p content > $BACKUP_DIR/content_$DATE.sql
docker exec churchapps-mysql mysqldump -u churchapps -p giving > $BACKUP_DIR/giving_$DATE.sql
docker exec churchapps-mysql mysqldump -u churchapps -p messaging > $BACKUP_DIR/messaging_$DATE.sql
docker exec churchapps-mysql mysqldump -u churchapps -p doing > $BACKUP_DIR/doing_$DATE.sql
docker exec churchapps-mysql mysqldump -u churchapps -p reporting > $BACKUP_DIR/reporting_$DATE.sql

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
```

### Schedule Backups with Cron

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup-databases.sh
```

---

## Comparison: Coolify vs AWS

| Feature             | AWS           | Coolify                |
| ------------------- | ------------- | ---------------------- |
| **Cost**            | $70-100/month | $5-20/month (VPS only) |
| **Setup Time**      | 2-3 hours     | 30-60 minutes          |
| **Complexity**      | High          | Low                    |
| **Control**         | Limited       | Full                   |
| **Scaling**         | Automatic     | Manual                 |
| **SSL Certificate** | Free (ACM)    | Free (Let's Encrypt)   |
| **Databases**       | RDS (managed) | Self-managed           |
| **Backups**         | Automatic     | Manual setup           |
| **Vendor Lock-in**  | High          | None                   |

---

## Troubleshooting

### Issue 1: Cannot connect to databases

**Solution**: Check network connectivity

```bash
# Access API container
docker exec -it <api-container> sh

# Test database connection
nc -zv churchapps-mysql 3306

# Or try direct connection
mysql -h churchapps-mysql -u churchapps -p membership
```

### Issue 2: Port conflicts

**Solution**: Use a single MySQL instance on port 3306 to avoid conflicts.

### Issue 3: Out of memory

**Solution**:

1. Increase VPS resources
2. Or use single MySQL instance with multiple databases (uses less memory)

### Issue 4: SSL certificate not working

**Solution**:

1. Ensure DNS points to correct IP
2. Wait for DNS propagation
3. Check Coolify logs for Let's Encrypt errors
4. Port 80 and 443 must be open on VPS

### Issue 5: Build fails

**Solution**: Check logs in Coolify

- Missing dependencies? Add to package.json
- TypeScript errors? Fix and push again
- Build command wrong? Update in Coolify settings

---

## Performance Optimization

### 1. Enable Redis Caching

Add Redis in Coolify:

```yaml
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
```

Update API to use Redis for caching.

### 2. Set Up Nginx Reverse Proxy

Coolify handles this automatically, but you can customize:

- Enable gzip compression
- Add caching headers
- Rate limiting

### 3. Database Optimization

```sql
-- Add indexes for better performance
-- Run these in each database

-- Example for membership database
CREATE INDEX idx_member_email ON members(email);
CREATE INDEX idx_member_status ON members(status);
```

### 4. Monitor Resources

Use Coolify's built-in monitoring:

1. CPU usage
2. Memory usage
3. Disk usage
4. Network traffic

---

## Cost Breakdown

### VPS Options

**DigitalOcean Droplet:**

- 4GB RAM, 2 CPU: $24/month
- 8GB RAM, 4 CPU: $48/month

**Hetzner:**

- 4GB RAM, 2 CPU: €4.50/month (~$5)
- 8GB RAM, 4 CPU: €7.50/month (~$8)

**Linode:**

- 4GB RAM, 2 CPU: $24/month

**Recommended**: Hetzner (best value) or DigitalOcean (reliable)

**Total Monthly Cost**: $5-50 depending on VPS provider and size

---

## Migration Path (AWS to Coolify)

If you already have data in AWS:

### 1. Export AWS Databases

```bash
# For each RDS database
mysqldump -h your-rds-endpoint.rds.amazonaws.com -u admin -p membership > membership.sql
# Repeat for all 6 databases
```

### 2. Import to Coolify Databases

```bash
# Copy SQL files to VPS
scp *.sql user@your-vps:/tmp/

# SSH into VPS
ssh user@your-vps

# Import each database
docker exec -i churchapps-mysql mysql -u churchapps -p membership < /tmp/membership.sql
# Repeat for all 6 databases
```

### 3. Update DNS

Change your DNS from API Gateway to VPS IP.

### 4. Verify

Test all endpoints work correctly.

---

## Summary

✅ **Coolify Advantages:**

- Much cheaper ($5-20 vs $70-100/month)
- Simpler setup and management
- Full control over everything
- No vendor lock-in
- Great for small to medium projects

✅ **Setup Steps:**

1. Create one MySQL instance and 7 databases in Coolify
2. Add Dockerfile to repository
3. Create application in Coolify
4. Configure environment variables
5. Set up custom domain
6. Enable automatic deployments
7. Done!

✅ **Best Practices:**

- Use single MySQL instance with multiple databases (saves memory)
- Set up automatic backups
- Monitor resource usage
- Keep dependencies updated
- Use environment variables for secrets

**Time to deploy**: 30-60 minutes

**Monthly cost**: $5-20 (vs $70-100 on AWS)

🚀 **You're ready to deploy!**
