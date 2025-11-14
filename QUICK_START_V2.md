# Quick Start Guide - AI Form Auto Fill v2.0

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- [Bun](https://bun.sh) installed
- [Node.js](https://nodejs.org) (for client build)
- OpenAI API key

---

## Server Setup

### 1. Install Dependencies
```bash
cd server
bun install
```

### 2. Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and set your keys
nano .env
```

**Required variables:**
```bash
OPENAI_API_KEY=sk-your-key-here
SERVER_API_KEY=your-32-character-key-here  # Generate with: openssl rand -hex 32
```

### 3. Start Server
```bash
# Development (with auto-reload)
bun run dev

# Production
bun run start

# With Docker
docker-compose up -d
```

### 4. Verify Server
```bash
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"...","checks":{...}}
```

---

## Client Setup

### 1. Build Extension
```bash
cd client
npm install
npm run build
```

### 2. Load in Browser
1. Open Chrome/Edge
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `client/dist/` folder

### 3. Configure Extension
1. Click extension icon
2. Click "Open settings"
3. Enter:
   - **Server URL:** `http://localhost:3000`
   - **API Key:** Your `SERVER_API_KEY` from `.env`
4. Click "Save Settings"
5. Test connection

---

## Usage

### Method 1: Extension Popup
1. Navigate to any form
2. Click extension icon
3. Click "Fill Visible Form"
4. Watch form auto-fill

### Method 2: Context Menu
1. Right-click on any page
2. Select "Fill Form with AI"
3. Form fields automatically fill

---

## Testing

### Test Server
```bash
cd server
bun test
```

### Test API Manually
```bash
curl -X POST http://localhost:3000/api/v1/generate-fill \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-server-api-key" \
  -d '{
    "fields": [
      {
        "id": "1",
        "name": "email",
        "label": "Email",
        "type": "email"
      }
    ]
  }'
```

---

## Configuration Options

### Server Environment Variables

#### Required
```bash
OPENAI_API_KEY=sk-...              # Your OpenAI API key
SERVER_API_KEY=...                 # Min 32 chars for security
```

#### Optional (with defaults)
```bash
PORT=3000                          # Server port
ALLOWED_ORIGINS=*                  # CORS origins
OPENAI_MODEL=gpt-4o-mini          # OpenAI model
OPENAI_TIMEOUT=30000              # Request timeout (ms)
OPENAI_MAX_RETRIES=3              # Retry attempts
RATE_LIMIT_WINDOW=60000           # Rate limit window (ms)
RATE_LIMIT_MAX_REQUESTS=20        # Max requests per window
LOG_LEVEL=info                    # Log level
NODE_ENV=development              # Environment
```

#### Production (Redis)
```bash
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
```

---

## Common Issues & Solutions

### Server won't start
```bash
# Check if port is in use
lsof -i :3000

# Kill existing process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Extension not connecting
1. Verify server is running: `curl http://localhost:3000/health`
2. Check extension settings have correct URL
3. Check server API key matches
4. Check browser console for errors (F12)

### "Authentication failed"
- Verify `SERVER_API_KEY` in extension settings matches `.env`
- Ensure API key is at least 32 characters

### "No fields detected"
- Page might load form fields dynamically
- Refresh page after extension loads
- Check if fields have `data-ignore-ai-fill="true"`

---

## Development Workflow

### Server Development
```bash
# Watch mode (auto-reload)
bun run dev

# Run tests on change
bun test --watch

# Format code
bun run format

# Lint code
bun run lint
```

### Client Development
```bash
# Watch mode
npm run watch

# After changes, reload extension:
# chrome://extensions/ → Click reload icon
```

---

## Production Deployment

### Option 1: Direct Deploy
```bash
cd server
bun install --production
NODE_ENV=production bun run start
```

### Option 2: Docker
```bash
cd server
docker build -t ai-form-autofill:latest .
docker run -p 3000:3000 --env-file .env ai-form-autofill:latest
```

### Option 3: Docker Compose
```bash
docker-compose up -d
```

### Option 4: Cloud Platforms

**Railway:**
```bash
railway init
railway up
```

**Fly.io:**
```bash
fly launch
fly deploy
```

**Vercel:**
```bash
vercel
```

---

## Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

**Response codes:**
- `200` - Healthy or degraded
- `503` - Service unavailable

### Logs
```bash
# View logs
docker-compose logs -f

# Or with Bun
bun run start 2>&1 | tee server.log
```

### Metrics
Check logs for:
- Request duration
- OpenAI API calls
- Cache hits
- Rate limit events

---

## Upgrading from v1.0

See [UPGRADE_GUIDE.md](./UPGRADE_GUIDE.md) for detailed migration instructions.

**Quick upgrade:**
```bash
# Backup
cp .env .env.backup

# Pull changes
git pull

# Update dependencies
cd server && bun install
cd ../client && npm install

# Copy new env vars
cat .env.example >> .env
# Edit .env to set new variables

# Rebuild
cd server && bun run build
cd ../client && npm run build

# Test
cd server && bun test

# Restart
bun run start
```

---

## API Endpoints

### POST `/api/v1/generate-fill`
Generate AI fill values for form fields.

**Headers:**
- `Content-Type: application/json`
- `X-API-Key: <your-server-api-key>`

**Request:**
```json
{
  "fields": [
    {
      "id": "field-1",
      "name": "email",
      "label": "Email Address",
      "type": "email"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "field-1": {
      "value": "user@example.com",
      "reason": "Valid email format"
    }
  }
}
```

### GET `/health`
Check server health.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": {
    "openai": { "status": "ok" },
    "redis": { "status": "ok" }
  }
}
```

---

## Support & Documentation

- **Full Documentation:** [README.md](./README.md)
- **Upgrade Guide:** [UPGRADE_GUIDE.md](./UPGRADE_GUIDE.md)
- **Improvements:** [IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md)
- **API Spec:** [openapi.yml](./server/openapi.yml)
- **Server Docs:** [server/README.md](./server/README.md)

---

## Tips & Best Practices

### Development
- Use `bun run dev` for auto-reload
- Enable debug logging: `LOG_LEVEL=debug`
- Test with curl before using extension
- Check health endpoint regularly

### Production
- Set `NODE_ENV=production`
- Use Redis for rate limiting
- Set specific `ALLOWED_ORIGINS`
- Use strong API keys (32+ chars)
- Monitor health endpoint
- Enable logging to file
- Set up alerts for errors
- Use Docker for deployment

### Security
- Never commit `.env` file
- Rotate API keys regularly
- Use HTTPS in production
- Set rate limits appropriately
- Monitor for abuse
- Keep dependencies updated

---

**Version:** 2.0.0
**Last Updated:** 2024-01-15

Happy form filling! 🎉
