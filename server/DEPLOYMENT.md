# Deployment Guide

This guide covers deploying the AI Form Auto Fill backend server to various cloud platforms.

## Table of Contents

- [Railway](#railway)
- [Fly.io](#flyio)
- [Vercel](#vercel)
- [Docker](#docker)
- [VPS (Ubuntu/Debian)](#vps-ubuntudebian)
- [Post-Deployment](#post-deployment)

---

## Railway

Railway is one of the easiest platforms to deploy Bun applications.

### Prerequisites
- Railway account (https://railway.app)
- Railway CLI installed

### Steps

1. **Install Railway CLI:**
```bash
npm i -g @railway/cli
```

2. **Login to Railway:**
```bash
railway login
```

3. **Initialize project:**
```bash
cd server
railway init
```

4. **Set environment variables:**
```bash
railway variables set OPENAI_API_KEY=sk-your-key-here
railway variables set SERVER_API_KEY=$(openssl rand -hex 32)
railway variables set ALLOWED_ORIGINS=*
```

5. **Deploy:**
```bash
railway up
```

6. **Get your deployment URL:**
```bash
railway domain
```

Your server will be available at the provided URL (e.g., `https://your-app.railway.app`).

### Railway Dashboard Method

1. Go to https://railway.app/new
2. Select "Deploy from GitHub repo" or "Empty Project"
3. Add environment variables in the Variables tab
4. Railway will auto-detect Bun and deploy

---

## Fly.io

Fly.io offers excellent global deployment with edge locations.

### Prerequisites
- Fly.io account (https://fly.io)
- Fly CLI installed

### Steps

1. **Install Fly CLI:**
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Login:**
```bash
fly auth login
```

3. **Create fly.toml:**
```bash
cd server
fly launch --no-deploy
```

4. **Edit fly.toml** (if needed):
```toml
app = "your-app-name"

[build]
  [build.args]
    BUN_VERSION = "latest"

[env]
  PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

5. **Set secrets:**
```bash
fly secrets set OPENAI_API_KEY=sk-your-key-here
fly secrets set SERVER_API_KEY=$(openssl rand -hex 32)
fly secrets set ALLOWED_ORIGINS=*
```

6. **Deploy:**
```bash
fly deploy
```

Your server will be available at `https://your-app-name.fly.dev`.

---

## Vercel

Vercel can host Bun applications with serverless functions.

### Prerequisites
- Vercel account (https://vercel.com)
- Vercel CLI installed

### Steps

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Create vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.ts"
    }
  ]
}
```

3. **Deploy:**
```bash
cd server
vercel
```

4. **Set environment variables:**
Go to your Vercel dashboard → Project → Settings → Environment Variables

Add:
- `OPENAI_API_KEY`
- `SERVER_API_KEY`
- `ALLOWED_ORIGINS`

5. **Redeploy:**
```bash
vercel --prod
```

**Note:** Vercel has limitations on execution time (10s for hobby, 60s for pro). Consider Railway or Fly.io for better performance.

---

## Docker

Deploy anywhere that supports Docker containers.

### Dockerfile

Create `server/Dockerfile`:

```dockerfile
FROM oven/bun:latest

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start server
CMD ["bun", "run", "start"]
```

### Build and Run

```bash
# Build image
docker build -t ai-form-autofill-server ./server

# Run container
docker run -d \
  -p 3000:3000 \
  -e OPENAI_API_KEY=sk-your-key \
  -e SERVER_API_KEY=your-server-key \
  -e ALLOWED_ORIGINS=* \
  --name ai-autofill \
  ai-form-autofill-server
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  server:
    build: ./server
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SERVER_API_KEY=${SERVER_API_KEY}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
```

Run with:
```bash
docker-compose up -d
```

---

## VPS (Ubuntu/Debian)

Deploy to your own VPS (DigitalOcean, Linode, AWS EC2, etc.).

### Prerequisites
- Ubuntu 20.04+ or Debian 11+ server
- SSH access
- Domain name (optional but recommended)

### Steps

1. **SSH into your server:**
```bash
ssh user@your-server-ip
```

2. **Install Bun:**
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

3. **Install dependencies:**
```bash
sudo apt update
sudo apt install -y git nginx certbot python3-certbot-nginx
```

4. **Clone your repository:**
```bash
git clone https://github.com/yourusername/your-repo.git
cd your-repo/server
```

5. **Set up environment:**
```bash
cp .env.example .env
nano .env  # Edit with your values
```

6. **Install dependencies:**
```bash
bun install
```

7. **Create systemd service:**
```bash
sudo nano /etc/systemd/system/ai-autofill.service
```

Add:
```ini
[Unit]
Description=AI Form Auto Fill Server
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/your-repo/server
ExecStart=/home/your-username/.bun/bin/bun run start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

8. **Start service:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable ai-autofill
sudo systemctl start ai-autofill
sudo systemctl status ai-autofill
```

9. **Configure Nginx:**
```bash
sudo nano /etc/nginx/sites-available/ai-autofill
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

10. **Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/ai-autofill /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

11. **Set up SSL (optional but recommended):**
```bash
sudo certbot --nginx -d your-domain.com
```

Your server is now running at `https://your-domain.com`!

---

## Post-Deployment

### 1. Update Extension Settings

After deploying, update your browser extension settings:

1. Open extension settings
2. Change server URL from `http://localhost:3000` to your production URL
3. Keep the same `SERVER_API_KEY`
4. Save settings

### 2. Update CORS Settings

For production, update `ALLOWED_ORIGINS` in your deployment:

```bash
# For Chrome extension, use your extension ID:
ALLOWED_ORIGINS=chrome-extension://your-extension-id

# For multiple origins:
ALLOWED_ORIGINS=chrome-extension://id1,chrome-extension://id2
```

To find your extension ID:
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Find your extension's ID under its name

### 3. Monitor Your Deployment

**Check server health:**
```bash
curl https://your-server.com/health
```

**Check logs:**

- **Railway:** `railway logs`
- **Fly.io:** `fly logs`
- **Docker:** `docker logs ai-autofill`
- **VPS:** `sudo journalctl -u ai-autofill -f`

### 4. Set Up Monitoring (Optional)

Consider setting up monitoring with:
- [UptimeRobot](https://uptimerobot.com) - Free uptime monitoring
- [Sentry](https://sentry.io) - Error tracking
- [Datadog](https://www.datadoghq.com) - Full observability

### 5. Security Checklist

- ✅ Use HTTPS in production
- ✅ Set specific `ALLOWED_ORIGINS` (not `*`)
- ✅ Use a strong `SERVER_API_KEY`
- ✅ Rotate API keys periodically
- ✅ Monitor OpenAI API usage
- ✅ Set up rate limiting
- ✅ Keep dependencies updated

---

## Troubleshooting

### Server won't start
- Check environment variables are set correctly
- Verify Bun version is compatible
- Check logs for specific errors

### CORS errors
- Update `ALLOWED_ORIGINS` with your extension ID
- Verify the extension is using the correct server URL

### High latency
- Deploy to a region closer to your users
- Consider using Fly.io for global edge deployment
- Check OpenAI API response times

### Rate limiting issues
- Adjust `RATE_LIMIT_MAX_REQUESTS` in `index.ts`
- Implement Redis-based rate limiting for production
- Monitor usage patterns

---

## Cost Estimates

**Monthly costs (approximate):**

- **Railway:** $5-20 (depending on usage)
- **Fly.io:** $0-10 (free tier available)
- **Vercel:** $0-20 (free tier available, limitations apply)
- **VPS:** $5-20 (DigitalOcean, Linode)
- **OpenAI API:** Variable (gpt-4o-mini is very cost-effective)

**Note:** Most costs come from OpenAI API usage, not hosting.

---

## Need Help?

- Check the main [README.md](../README.md)
- Review [server/README.md](README.md)
- Check platform-specific documentation

Happy deploying! 🚀

