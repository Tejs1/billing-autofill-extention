# AI Form Auto Fill - Browser Extension

A powerful browser extension that uses AI to intelligently auto-fill web forms with plausible values. Built with a secure client-server architecture where your OpenAI API key stays safely on the server side.

## 🏗️ Architecture

This project consists of two main components:

1. **Browser Extension** (Client): Scans form fields on web pages and displays AI-generated values
2. **Backend Server** (Bun): Securely stores your OpenAI API key and proxies requests to OpenAI's API

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  Browser        │────────▶│  Backend        │────────▶│  OpenAI API     │
│  Extension      │         │  Server (Bun)   │         │  (gpt-4o-mini)  │
│                 │◀────────│                 │◀────────│                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
  Form Fields                 API Key Storage            AI Completions
  User Interface              Authentication
```

### Security Benefits

- ✅ OpenAI API key **never** touches the client side
- ✅ Centralized API key management
- ✅ Server-side authentication and rate limiting
- ✅ Can support multiple users from one server
- ✅ Full control over API usage and monitoring

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) installed (for the backend server)
- OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- Chrome, Edge, or any Chromium-based browser

### Step 1: Set Up the Backend Server

```bash
# Navigate to the server directory
cd server

# Install dependencies
bun install

# Create and configure environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY and generate a SERVER_API_KEY

# Start the server
bun run dev
```

The server will start on `http://localhost:3000`. See [server/README.md](server/README.md) for detailed setup instructions.

### Step 2: Install the Browser Extension

1. Open your browser and navigate to `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode" (toggle in the top-right corner)
3. Click "Load unpacked"
4. Select the `client/` folder (not the `server` folder or root directory)

### Step 3: Configure the Extension

1. Click the extension icon in your browser toolbar
2. Click "Open settings"
3. Enter your backend server URL (default: `http://localhost:3000`)
4. Enter your server API key (the `SERVER_API_KEY` from your `.env` file)
5. Click "Save Settings"

The extension will test the connection and confirm if everything is working!

## 📖 Usage

1. Navigate to any web page with a form
2. Click the extension icon in your browser toolbar
3. Click "Fill Visible Form"
4. Watch as the AI intelligently fills in the form fields!

The extension will:

- Scan all visible input fields and textareas
- Send field metadata (labels, names, types) to your backend server
- Receive AI-generated plausible values
- Auto-fill the form with smooth animations

## 🛠️ Development

### Project Structure

```
.
├── client/               # Browser extension (Chrome/Edge)
│   ├── manifest.json    # Extension manifest (v3)
│   ├── background.js    # Service worker (handles server communication)
│   ├── content.js      # Content script (scans forms, fills fields)
│   ├── popup.html/js   # Extension popup UI
│   └── options.html/js # Settings page
├── server/              # Backend server (Bun)
│   ├── index.ts        # Main server file
│   ├── package.json    # Server dependencies
│   ├── .env.example    # Environment template
│   └── README.md       # Server documentation
└── README.md           # This file
```

### Key Files

**Extension Files (in `client/` folder):**

- `client/background.js` - Communicates with the backend server, handles API authentication
- `client/content.js` - Scans page for form fields, applies AI-generated values
- `client/options.js` - Manages server URL and API key configuration

**Server Files:**

- `server/index.ts` - Bun server with `/api/generate-fill` endpoint and authentication

### Making Changes

**To modify the extension:**

1. Edit the relevant files in the `client/` folder (`background.js`, `content.js`, etc.)
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension card
4. Test your changes

**To modify the server:**

1. Edit `server/index.ts`
2. The server will auto-reload if you're running `bun run dev`
3. Test with the extension or curl

### Testing the Server Endpoint

```bash
curl -X POST http://localhost:3000/api/generate-fill \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-server-api-key" \
  -d '{
    "fields": [
      {
        "id": "1",
        "name": "email",
        "label": "Email Address",
        "type": "email"
      },
      {
        "id": "2",
        "name": "phone",
        "label": "Phone Number",
        "type": "tel"
      }
    ]
  }'
```

## 🚢 Deployment

### Deploying the Backend Server

The backend server can be deployed to various platforms:

- **Railway**: `railway up` (see [server/README.md](server/README.md))
- **Fly.io**: `fly launch && fly deploy`
- **Vercel**: `vercel`
- **Docker**: Build and deploy the included Dockerfile

After deploying, update the extension's server URL in the settings to point to your production server.

### Publishing the Extension

To publish to the Chrome Web Store:

1. Create a `.zip` file of the `client/` folder (exclude `server/` and `node_modules/`)
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Upload your `.zip` file
4. Fill in the required information
5. Submit for review

**Note:** Users will need to deploy their own backend server or you can provide a hosted version.

## 🔒 Security Considerations

### For Users

- Your OpenAI API key is stored on **your** backend server, never in the browser
- The server API key is stored in the extension's local storage (encrypted by the browser)
- Only your extension can communicate with your backend server (via CORS)

### For Developers

- Use a strong, randomly generated `SERVER_API_KEY`
- In production, set `ALLOWED_ORIGINS` to your specific extension ID
- Consider implementing additional rate limiting for production
- Monitor your OpenAI API usage regularly
- Never commit `.env` files to version control
- Rotate your API keys periodically

## 🐛 Troubleshooting

### Extension Issues

**"Missing server API key" error:**

- Open extension settings and configure your server URL and API key

**"Server request failed" error:**

- Verify your backend server is running
- Check the server URL in extension settings
- Verify the server API key matches your `.env` file

**Extension not detecting forms:**

- Refresh the page after installing the extension
- Check browser console for errors (F12)

### Server Issues

**Server won't start:**

- Verify Bun is installed: `bun --version`
- Check if port 3000 is already in use
- Verify `.env` file exists and has correct values

**OpenAI API errors:**

- Verify your API key is valid
- Check your OpenAI account has credits
- Review rate limits on your OpenAI account

**CORS errors:**

- Update `ALLOWED_ORIGINS` in `.env`
- For development, use `*`
- For production, use your extension ID: `chrome-extension://YOUR_EXTENSION_ID`

## 📝 Configuration

### Environment Variables (Server)

Create a `.env` file in the `server/` directory:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
SERVER_API_KEY=your-secure-random-string-here
PORT=3000
ALLOWED_ORIGINS=*
```

### Extension Settings

Configure via the extension's options page:

- **Backend Server URL**: Where your backend server is hosted
- **Server API Key**: Authentication key for your backend server

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Built with [Bun](https://bun.sh) for blazing-fast server performance
- Powered by [OpenAI's GPT-4o-mini](https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/) for intelligent form filling
- Uses Chrome Extension Manifest V3

## 📚 Additional Resources

- [Server Documentation](server/README.md)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Bun Documentation](https://bun.sh/docs)

---

**Made with ❤️ for developers who hate filling out forms**
