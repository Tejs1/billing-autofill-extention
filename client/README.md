# AI Form Auto Fill - Browser Extension (Client)

This is the browser extension client written in TypeScript.

## 📁 Directory Structure

```
client/
├── src/                      # Source code (TypeScript)
│   ├── background.ts         # Background service worker
│   ├── content.ts           # Content script for form detection
│   ├── types.ts             # TypeScript type definitions
│   ├── utils.ts             # Utility functions
│   ├── popup.js             # Popup UI (not migrated yet)
│   ├── options.js           # Settings page (not migrated yet)
│   ├── popup.html           # Popup HTML
│   ├── options.html         # Settings HTML
│   └── manifest.json        # Extension manifest
│
├── dist/                    # Build output (load this in browser)
│   ├── background.js        # Compiled TypeScript
│   ├── content.js           # Compiled TypeScript
│   ├── types.js             # Compiled TypeScript
│   ├── utils.js             # Compiled TypeScript
│   ├── popup.js             # Copied from src
│   ├── options.js           # Copied from src
│   ├── popup.html           # Copied from src
│   ├── options.html         # Copied from src
│   └── manifest.json        # Copied from src
│
├── old_javascript_files/    # Archived old JS files
├── package.json             # Build configuration
└── tsconfig.json            # TypeScript configuration
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Extension
```bash
npm run build
```

This compiles TypeScript and copies assets to `dist/`.

### 3. Load in Browser
1. Open Chrome/Edge: `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder

## 📝 Development Commands

```bash
# Build once
npm run build

# Watch mode (auto-rebuild on changes)
npm run watch

# Clean build output
npm run clean

# Full rebuild
npm run rebuild
```

## 🔧 Making Changes

### Editing TypeScript Files

1. Edit files in `src/` directory:
   - `background.ts` - Background service worker
   - `content.ts` - Content script
   - `types.ts` - Type definitions
   - `utils.ts` - Utilities

2. Rebuild:
   ```bash
   npm run build
   ```

3. Reload extension in browser:
   - Go to `chrome://extensions/`
   - Click reload icon on extension

### Editing HTML/CSS/JS

1. Edit files in `src/` directory:
   - `popup.html`, `popup.js` - Extension popup
   - `options.html`, `options.js` - Settings page
   - `manifest.json` - Extension manifest

2. Rebuild:
   ```bash
   npm run build
   ```

3. Reload extension in browser

## 🎯 What's TypeScript vs JavaScript?

### Migrated to TypeScript ✅
- `background.ts` - Enhanced error handling, notifications
- `content.ts` - Type-safe form detection
- `types.ts` - Shared type definitions
- `utils.ts` - Error classification, timeouts

### Still JavaScript
- `popup.js` - Popup UI logic
- `options.js` - Settings page logic

These will be migrated in a future update.

## 🔍 Key Features

### Enhanced Error Handling
Errors are classified into types:
- `NETWORK` - Connection issues
- `AUTH` - Authentication failures
- `CONFIG` - Missing configuration
- `VALIDATION` - Invalid data
- `UNKNOWN` - Unexpected errors

### Request Timeouts
All requests have 30-second timeouts to prevent hanging.

### Browser Notifications
Errors are shown as browser notifications for better visibility.

### Health Checks
Can check if server is running before making requests.

## 📦 Build Output

The `dist/` folder contains everything needed to load the extension:

- ✅ Compiled JavaScript from TypeScript
- ✅ Copied HTML, CSS, and manifest
- ✅ All dependencies bundled
- ✅ Ready to load in browser

## 🐛 Troubleshooting

### Build Fails
```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Extension Doesn't Load
- Make sure you selected `dist/` folder, not `src/`
- Check browser console for errors (F12)
- Verify `manifest.json` exists in `dist/`

### Changes Not Reflected
- Did you run `npm run build`?
- Did you click reload in `chrome://extensions/`?
- Try hard reload: remove and re-add extension

### TypeScript Errors
```bash
# Check TypeScript compilation
npx tsc --noEmit
```

## 📚 Related Documentation

- **Root README:** `../README.md`
- **Server README:** `../server/README.md`
- **Upgrade Guide:** `../UPGRADE_GUIDE.md`
- **Quick Start:** `../QUICK_START_V2.md`

## 🔄 Upgrade from v1.0

The old JavaScript files have been moved to `old_javascript_files/`:
- `old_javascript_files/background.js` - Old background script
- `old_javascript_files/content.js` - Old content script

These are kept for reference but are no longer used.

## 🎨 Architecture

```
Browser Tab
    ↓
content.ts (detects forms)
    ↓
sends message
    ↓
background.ts (calls server)
    ↓
Server API (/api/v1/generate-fill)
    ↓
background.ts (receives data)
    ↓
sends response
    ↓
content.ts (fills form)
```

## 🛡️ Security

- API key stored in browser's local storage (encrypted by browser)
- All server communication uses API key authentication
- Timeout protection against hanging requests
- Error messages sanitized for user display

---

**Version:** 2.0.0
**Language:** TypeScript + JavaScript
**Build Tool:** TypeScript Compiler
**Target:** Chrome Extension Manifest V3
