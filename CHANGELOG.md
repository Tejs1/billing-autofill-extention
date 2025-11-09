# Changelog

All notable changes to the AI Form Auto Fill extension will be documented in this file.

## [2.0.0] - 2024-11-09

### 🔒 Major Security Update: Server-Side Architecture

This release completely restructures the extension to use a secure backend server, ensuring your OpenAI API key never touches the client side.

### Added

#### Backend Server

- **New Bun-based backend server** (`server/`) that proxies OpenAI API requests
- Server authentication via `SERVER_API_KEY` for secure extension-to-server communication
- Rate limiting (20 requests per minute by default) to prevent abuse
- CORS configuration for extension security
- Health check endpoint (`/health`) for monitoring
- Comprehensive error handling and logging
- Environment-based configuration via `.env` file

#### Documentation

- Complete server setup guide in `server/README.md`
- Deployment guide for Railway, Fly.io, Vercel, Docker, and VPS (`server/DEPLOYMENT.md`)
- Quick start guide (`QUICKSTART.md`) for rapid setup
- Automated test script (`server/test-endpoint.sh`) to verify server setup
- Docker support with `Dockerfile` and `docker-compose.yml`
- Comprehensive main `README.md` with architecture diagrams

#### Extension Updates

- Repurposed options page for server configuration
- Server connection testing in options page
- Better error messages for server communication issues
- Support for custom server URLs (localhost or production)

### Changed

#### Breaking Changes

- **OpenAI API key is no longer stored in the extension**
  - Must be configured in the backend server's `.env` file
  - Extension now stores server URL and server API key instead
- Extension now communicates with backend server instead of OpenAI directly
- Options page now configures server settings instead of OpenAI API key
- Manifest version bumped to 2.0.0

#### Extension Files Modified (in `client/` folder)

- `client/background.js`: Replaced `callOpenAI()` with `callBackendServer()`
- `client/options.html`: Updated UI for server configuration
- `client/options.js`: Added server connection testing
- `client/manifest.json`: Removed OpenAI API host permission, updated version

### Removed

- Direct OpenAI API integration from extension
- Client-side storage of OpenAI API key
- `host_permissions` for `https://api.openai.com/`

### Security Improvements

- ✅ OpenAI API key never exposed to client side
- ✅ Server-side authentication and validation
- ✅ Rate limiting to prevent abuse
- ✅ CORS restrictions for enhanced security
- ✅ Centralized API key management
- ✅ Better error handling without exposing sensitive information

### Migration Guide

If you're upgrading from v1.x to v2.0:

1. **Set up the backend server:**

   ```bash
   cd server
   bun install
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY and SERVER_API_KEY
   bun run dev
   ```

2. **Update extension settings:**

   - Open extension options
   - Enter server URL: `http://localhost:3000`
   - Enter server API key (from your `.env` file)
   - Save settings

3. **Your old OpenAI API key in the extension is no longer used**
   - It will be ignored by the extension
   - You can clear it from storage if desired

### Technical Details

**Architecture:**

```
Browser Extension → Backend Server → OpenAI API
     (Client)        (Bun Server)     (gpt-4o-mini)
```

**New API Endpoint:**

- `POST /api/generate-fill` - Generate form fill data
- `GET /health` - Health check

**Environment Variables (Server):**

- `OPENAI_API_KEY` - Your OpenAI API key
- `SERVER_API_KEY` - Authentication key for extension
- `PORT` - Server port (default: 3000)
- `ALLOWED_ORIGINS` - CORS origins (default: \*)

---

## [1.0.0] - 2024-11-08

### Initial Release

- Browser extension for Chrome/Edge
- Direct OpenAI API integration
- Form field scanning and auto-fill
- Support for text, email, tel, date, and other input types
- Visual feedback with field highlighting
- Options page for API key configuration
- Popup interface for triggering auto-fill

### Features

- Scans visible form fields on any webpage
- Uses GPT-4o-mini for intelligent value generation
- Respects field labels, names, and types
- Smooth animations for filled fields
- Error handling and user feedback

---

## Version Numbering

This project follows [Semantic Versioning](https://semver.org/):

- **Major version** (X.0.0): Breaking changes
- **Minor version** (0.X.0): New features, backwards compatible
- **Patch version** (0.0.X): Bug fixes, backwards compatible

---

## Upgrade Notes

### From 1.x to 2.x

- **Required:** Set up backend server
- **Required:** Update extension settings with server URL and API key
- **Breaking:** Old API key configuration no longer works
- **Benefit:** Much more secure architecture

---

## Future Roadmap

### Planned Features

- [ ] Support for more field types (select, radio, checkbox)
- [ ] Custom field mapping and rules
- [ ] Multiple profile support
- [ ] Form templates and presets
- [ ] Analytics and usage tracking
- [ ] Team/organization support
- [ ] Advanced rate limiting with Redis
- [ ] Webhook support for custom integrations

### Under Consideration

- [ ] Support for other AI providers (Anthropic, local models)
- [ ] Browser-based local AI models (no server required)
- [ ] Form validation before submission
- [ ] Multi-language support
- [ ] Dark mode UI

---

**For detailed documentation, see [README.md](README.md)**
