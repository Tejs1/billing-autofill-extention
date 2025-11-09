# Migration Guide: v1.x → v2.0

This guide helps you migrate from the old client-side architecture to the new secure server-side architecture.

## What Changed?

### Before (v1.x)
```
┌─────────────────┐
│  Browser        │
│  Extension      │────────▶ OpenAI API
│                 │          (API key in extension)
└─────────────────┘
```
❌ API key stored in browser extension  
❌ Direct calls to OpenAI from client  
❌ API key could be extracted by users  

### After (v2.0)
```
┌─────────────────┐         ┌─────────────────┐
│  Browser        │         │  Backend        │
│  Extension      │────────▶│  Server (Bun)   │────────▶ OpenAI API
│                 │         │  (API key here) │
└─────────────────┘         └─────────────────┘
```
✅ API key stored securely on server  
✅ Extension only talks to your server  
✅ Full control over API usage  

## Why Migrate?

1. **Security**: Your OpenAI API key is never exposed to the client
2. **Control**: Monitor and limit API usage from one place
3. **Scalability**: Support multiple users/extensions from one server
4. **Flexibility**: Add custom logic, caching, or rate limiting

## Migration Steps

### Step 1: Set Up Backend Server (5 minutes)

```bash
# Navigate to server directory
cd server

# Install dependencies
bun install

# Create environment file
cp .env.example .env
```

Edit `server/.env`:
```env
OPENAI_API_KEY=sk-your-openai-key-here
SERVER_API_KEY=your-secure-random-key-here
PORT=3000
ALLOWED_ORIGINS=*
```

**Generate a secure SERVER_API_KEY:**
```bash
openssl rand -hex 32
```

Start the server:
```bash
bun run dev
```

### Step 2: Update Extension Settings (1 minute)

1. Click the extension icon
2. Click "Open settings"
3. Enter:
   - **Server URL**: `http://localhost:3000`
   - **Server API Key**: (paste from your `.env` file)
4. Click "Save Settings"

You should see: ✅ "Settings saved successfully! Server connection verified."

### Step 3: Test It! (1 minute)

1. Visit any webpage with a form
2. Click the extension icon
3. Click "Fill Visible Form"
4. Verify it works!

## Troubleshooting

### "Missing server API key" error
**Solution:** Make sure you saved the settings in Step 2

### "Server request failed" error
**Solution:** 
- Check that the server is running: `bun run dev`
- Verify the server URL in extension settings
- Check server console for errors

### "Couldn't connect to server" warning
**Solution:**
- Verify the server is running on port 3000
- Check if another process is using port 3000: `lsof -i :3000`
- Try restarting the server

### Extension still asks for OpenAI API key
**Solution:** 
- You're looking at the old options page
- Make sure you're loading the extension from the `client/` folder
- Reload the extension at `chrome://extensions/`
- The new options page asks for "Server URL" and "Server API Key"

## What Happens to My Old API Key?

The OpenAI API key stored in the extension (v1.x) is no longer used. It will be ignored by v2.0.

You can clear it manually:
```javascript
// Open browser console (F12) and run:
chrome.storage.local.remove('openaiApiKey');
```

## Configuration Comparison

### v1.x Configuration
| Setting | Location | Value |
|---------|----------|-------|
| OpenAI API Key | Extension | `sk-...` |

### v2.0 Configuration
| Setting | Location | Value |
|---------|----------|-------|
| OpenAI API Key | Server `.env` | `sk-...` |
| Server URL | Extension | `http://localhost:3000` |
| Server API Key | Extension | Random string |

## Deploying to Production

For production use, deploy your backend server:

### Quick Deploy Options

**Railway (Easiest):**
```bash
cd server
railway login
railway init
railway up
```

**Fly.io:**
```bash
cd server
fly launch
fly deploy
```

**Docker:**
```bash
docker-compose up -d
```

See [server/DEPLOYMENT.md](server/DEPLOYMENT.md) for detailed instructions.

After deploying, update your extension settings with the production URL.

## Rollback (If Needed)

If you need to rollback to v1.x:

1. Checkout the v1.x branch/tag:
   ```bash
   git checkout v1.0.0
   ```

2. Reload the extension at `chrome://extensions/`

3. Re-enter your OpenAI API key in the extension options

**Note:** We strongly recommend using v2.0 for security reasons.

## FAQ

**Q: Do I need to run the server on my computer?**  
A: For local development, yes. For production, deploy it to a cloud platform (Railway, Fly.io, etc.).

**Q: Can multiple people use the same server?**  
A: Yes! Each person installs the extension and configures it with your server URL and API key.

**Q: Will this cost more?**  
A: Server hosting is very cheap ($0-5/month). Most costs come from OpenAI API usage, which is the same as before.

**Q: Is my data sent to your servers?**  
A: No! You run your own server. Form data goes: Extension → Your Server → OpenAI.

**Q: Can I use this without a server?**  
A: No, v2.0 requires a backend server for security. The server can run on your local machine.

**Q: What if I don't want to deploy a server?**  
A: You can keep using v1.x, but we recommend v2.0 for security. Alternatively, consider using a serverless platform like Vercel (free tier available).

## Need Help?

- 📖 [README.md](README.md) - Full documentation
- 🚀 [QUICKSTART.md](QUICKSTART.md) - Quick setup guide
- 🚢 [server/DEPLOYMENT.md](server/DEPLOYMENT.md) - Deployment guide
- 📝 [CHANGELOG.md](CHANGELOG.md) - What's new

## Summary

✅ **5 minutes** to set up local server  
✅ **1 minute** to update extension settings  
✅ **Much more secure** architecture  
✅ **Same functionality** as before  
✅ **Better control** over API usage  

**Ready to migrate? Start with Step 1 above!**

