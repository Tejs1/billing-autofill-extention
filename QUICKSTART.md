# Quick Start Guide

Get your AI Form Auto Fill extension up and running in 5 minutes!

## Step 1: Install Bun (if not already installed)

```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Or visit https://bun.sh for other installation methods
```

## Step 2: Set Up the Backend Server

```bash
# Navigate to the server directory
cd server

# Install dependencies
bun install

# Create environment file
cp .env.example .env
```

## Step 3: Configure Environment Variables

Edit `server/.env` and add your keys:

```env
# Get your OpenAI API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-actual-openai-key-here

# Generate a secure random key (run this command):
# openssl rand -hex 32
SERVER_API_KEY=paste-your-generated-key-here

PORT=3000
ALLOWED_ORIGINS=*
```

**To generate a secure SERVER_API_KEY:**

```bash
# On macOS/Linux:
openssl rand -hex 32

# Or use any random string generator
```

## Step 4: Start the Server

```bash
# From the server directory
bun run dev
```

You should see:

```
🚀 Server running at http://localhost:3000
📊 Rate limit: 20 requests per 60 seconds
🔒 CORS origins: *
```

## Step 5: Install the Browser Extension

1. Open Chrome/Edge and go to: `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select the **`client/` folder** (not the `server` folder or root directory!)

## Step 6: Configure the Extension

1. Click the extension icon in your browser toolbar
2. Click **"Open settings"**
3. Fill in:
   - **Backend Server URL**: `http://localhost:3000`
   - **Server API Key**: (paste the `SERVER_API_KEY` from your `.env` file)
4. Click **"Save Settings"**

You should see: ✅ "Settings saved successfully! Server connection verified."

## Step 7: Test It Out!

1. Visit any website with a form (e.g., a contact form, signup page)
2. Click the extension icon
3. Click **"Fill Visible Form"**
4. Watch the magic happen! ✨

## Common Test Sites

Try these sites to test the extension:

- https://www.w3schools.com/html/html_forms.asp
- Any contact form on a website
- Signup/registration forms

## Troubleshooting

### "Missing server API key" error

- Make sure you saved the settings in Step 6
- Verify the API key matches your `.env` file

### "Server request failed" error

- Check that the server is running (`bun run dev`)
- Verify the server URL is correct
- Check server console for errors

### Server won't start

- Verify Bun is installed: `bun --version`
- Check if port 3000 is in use: `lsof -i :3000`
- Verify `.env` file exists in the `server/` directory

### Extension not working

- Refresh the page after installing the extension
- Check browser console (F12) for errors
- Try reloading the extension at `chrome://extensions/`

## Next Steps

- **Deploy to production**: See [server/README.md](server/README.md) for deployment guides
- **Customize**: Modify `server/index.ts` to adjust AI behavior
- **Secure**: Update `ALLOWED_ORIGINS` for production use

## Need Help?

Check the full [README.md](README.md) for detailed documentation and troubleshooting.

---

**Happy auto-filling! 🎉**
