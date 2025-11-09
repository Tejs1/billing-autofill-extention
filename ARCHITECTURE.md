# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Browser
│
│  ┌────────────────────────────────────────────────────────────┐
│  │                   Browser Extension
│  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐
│  │  │              │  │                │  │                 │
│  │  │  popup.js    │  │  content.js    │  │  background.js  │
│  │  │  (client/)   │  │  (client/)     │  │  (client/)      │
│  │  │  • UI        │  │  • Scan DOM    │  │  • API proxy    │
│  │  │  • Trigger   │  │  • Find forms  │  │  • Auth         │
│  │  │              │  │  • Fill data   │  │  • Error handle │
│  │  │              │  │                │  │                 │
│  │  └──────┬──────┘  └──────┬───────┘  └────────┬───────┘
│  │         │                 │                   │
│  │         │   sendMessage   │                   │
│  │         └──────────────►│                   │
│  │                           │   sendMessage     │
│  │                           └─────────────────►│
│  │                                               │
│  │  Storage (chrome.storage.local):              │
│  │  • serverUrl: "http://localhost:3000"         │
│  │  • serverApiKey: "abc123..."                  │
│  │                                                │
└──────────────────────────────────────────────┼──────────────┘
                                                    │
                                                    │ HTTPS
                                                    │ POST /api/generate-fill
                                                    │ Header: X-API-Key
                                                    │
┌───────────────────────────────────────────────────▼─────────────┐
│                      Backend Server (Bun)
│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    index.ts
│  │
│  │  1. Receive request
│  │  2. Validate X-API-Key header
│  │  3. Check rate limit (20 req/min)
│  │  4. Validate request body
│  │  5. Call OpenAI API with OPENAI_API_KEY
│  │  6. Parse and return response
│  │
│  └────────────────────────────────────────────────────────────┘ │
│
│  Environment (.env):
│  • OPENAI_API_KEY: "sk-..."  ← Stored securely here!
│  • SERVER_API_KEY: "xyz789..."
│  • PORT: 3000
│  • ALLOWED_ORIGINS: "*"
│
│  Rate Limiting:
│  • In-memory store (Map)
│  • 20 requests per 60 seconds
│  • Per API key
│
└──────────────────────────────────────────────┬────────────────┘
                                                    │
                                                    │ HTTPS
                                                    │ POST /v1/chat/completions
                                                    │ Authorization: Bearer sk-...
                                                    │
                                    ┌───────────────▼───────────────┐
                                    │       OpenAI API              │
                                    │                               │
                                    │  Model: gpt-4o-mini           │
                                    │  Response: JSON object        │
                                    │                               │
                                    └───────────────────────────────┘
```

---

## Data Flow

### 1. User Triggers Autofill

```
User clicks extension icon
    ↓
popup.js sends message to content.js
    ↓
content.js scans page for form fields
```

### 2. Field Collection

```javascript
// content.js collects:
{
  id: "unique-id",
  name: "email",
  label: "Email Address",
  placeholder: "your@email.com",
  type: "email",
  existingValue: ""
}
```

### 3. Request to Backend

```
content.js → background.js
    ↓
background.js sends POST to server
    ↓
Headers:
  Content-Type: application/json
  X-API-Key: [SERVER_API_KEY from storage]
    ↓
Body:
  { fields: [...] }
```

### 4. Server Processing

```
Server receives request
    ↓
Validates X-API-Key
    ↓
Checks rate limit
    ↓
Validates field data
    ↓
Builds OpenAI prompt
    ↓
Calls OpenAI API with OPENAI_API_KEY
    ↓
Parses response
    ↓
Returns to extension
```

### 5. Form Filling

```
background.js receives response
    ↓
Sends data back to content.js
    ↓
content.js fills each field
    ↓
Triggers input/change/blur events
    ↓
Adds visual highlight animation
```

---

## Security Model

### API Key Storage

```
┌─────────────────────────────────────────────────────────────┐
│                    API Key Locations                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ❌ NOT in extension source code                            │
│  ❌ NOT in chrome.storage (for OpenAI key)                  │
│  ❌ NOT in any client-side code                             │
│                                                              │
│  ✅ OPENAI_API_KEY: Server .env file only                   │
│  ✅ SERVER_API_KEY: Server .env + extension storage         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
Extension                    Server
    │                          │
    │  POST /api/generate-fill │
    │  X-API-Key: abc123       │
    ├─────────────────────────►│
    │                          │
    │                          ├─ Validate API key
    │                          │  if (apiKey !== SERVER_API_KEY)
    │                          │    return 401 Unauthorized
    │                          │
    │                          ├─ Check rate limit
    │                          │  if (exceeded)
    │                          │    return 429 Too Many Requests
    │                          │
    │                          ├─ Call OpenAI
    │                          │
    │  Response                │
    │◄─────────────────────────┤
    │                          │
```

### CORS Protection

```
Browser Extension (chrome-extension://abc123)
    │
    │ Origin: chrome-extension://abc123
    │
    ▼
Server checks ALLOWED_ORIGINS
    │
    ├─ If "*" → Allow (development)
    ├─ If origin in list → Allow
    └─ Else → Block (403)
```

---

## Component Responsibilities

### Extension Components

| Component              | Responsibility                  | Security Role          |
| ---------------------- | ------------------------------- | ---------------------- |
| `client/popup.js`      | User interface                  | None - just UI         |
| `client/content.js`    | DOM manipulation, form scanning | None - no secrets      |
| `client/background.js` | Server communication            | Stores SERVER_API_KEY  |
| `client/options.js`    | Configuration UI                | Manages SERVER_API_KEY |

### Server Components

| Component       | Responsibility    | Security Role            |
| --------------- | ----------------- | ------------------------ |
| Request handler | Route requests    | Validates authentication |
| Auth middleware | Check API key     | Protects endpoints       |
| Rate limiter    | Prevent abuse     | Limits requests          |
| OpenAI proxy    | Call OpenAI       | Uses OPENAI_API_KEY      |
| CORS handler    | Origin validation | Restricts access         |

---

## Deployment Architectures

### Development

```
┌──────────────┐         ┌──────────────┐
│  Browser     │         │  localhost   │
│  Extension   │────────►│  :3000       │────────► OpenAI
│              │         │  (Bun dev)   │
└──────────────┘         └──────────────┘
```

### Production (Simple)

```
┌──────────────┐         ┌──────────────┐
│  Browser     │         │  Railway     │
│  Extension   │────────►│  /Fly.io     │────────► OpenAI
│              │  HTTPS  │  /Vercel     │
└──────────────┘         └──────────────┘
```

### Production (Advanced)

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  Browser     │         │  Load        │         │  Server      │
│  Extension   │────────►│  Balancer    │────────►│  Instances   │──► OpenAI
│              │  HTTPS  │  (Nginx)     │         │  (Multiple)  │
└──────────────┘         └──────────────┘         └──────────────┘
                                                           │
                                                           ▼
                                                   ┌──────────────┐
                                                   │  Redis       │
                                                   │  (Rate limit)│
                                                   └──────────────┘
```

---

## Error Handling Flow

```
Extension Request
    │
    ▼
Server Validation
    │
    ├─ Invalid API Key → 401 → Show "Authentication failed"
    ├─ Rate Limited → 429 → Show "Too many requests"
    ├─ Invalid Body → 400 → Show "Invalid request"
    │
    ▼
OpenAI API Call
    │
    ├─ Network Error → 500 → Show "Server error"
    ├─ Invalid Key → 401 → Show "OpenAI key invalid"
    ├─ Rate Limited → 429 → Show "OpenAI rate limit"
    │
    ▼
Parse Response
    │
    ├─ Parse Error → 500 → Show "Invalid response"
    │
    ▼
Return to Extension
    │
    ▼
Fill Form Fields
```

---

## State Management

### Extension State

```javascript
// chrome.storage.local
{
  serverUrl: "http://localhost:3000",
  serverApiKey: "abc123..."
}

// Runtime state (background.js)
{
  pendingRequests: Map<tabId, Promise>
}

// Content script state
{
  filledFields: Set<fieldId>,
  highlightTimers: Map<fieldId, timeoutId>
}
```

### Server State

```javascript
// Rate limiting (in-memory)
{
  "api-key-1": {
    count: 15,
    resetTime: 1699545600000
  }
}

// Environment (process.env)
{
  OPENAI_API_KEY: "sk-...",
  SERVER_API_KEY: "abc123...",
  PORT: 3000,
  ALLOWED_ORIGINS: "*"
}
```

---

## Performance Considerations

### Extension

- ✅ Minimal background processing
- ✅ Efficient DOM scanning
- ✅ Debounced user actions
- ✅ Lazy loading of options

### Server

- ✅ Bun's fast runtime
- ✅ Minimal dependencies
- ✅ Efficient rate limiting
- ✅ Streaming responses (future)

### Network

- ✅ Single request per form
- ✅ Compressed responses
- ✅ Connection reuse
- ✅ Edge deployment (Fly.io)

---

## Scalability

### Current Implementation

- Single server instance
- In-memory rate limiting
- Suitable for: 1-100 users

### Future Improvements

- Redis for distributed rate limiting
- Multiple server instances
- Database for usage tracking
- Caching layer for common requests
- Suitable for: 1000+ users

---

## Technology Stack

| Layer      | Technology     | Why?                            |
| ---------- | -------------- | ------------------------------- |
| Runtime    | Bun            | Fast, modern, built-in features |
| Language   | TypeScript     | Type safety, better DX          |
| Extension  | Manifest V3    | Latest standard                 |
| AI         | GPT-4o-mini    | Cost-effective, fast            |
| Deployment | Railway/Fly.io | Easy, affordable                |
| Container  | Docker         | Portable, consistent            |

---

## Future Architecture Enhancements

### Planned

- [ ] Redis for rate limiting
- [ ] PostgreSQL for usage analytics
- [ ] WebSocket for real-time updates
- [ ] Caching layer for responses
- [ ] Multi-region deployment

### Under Consideration

- [ ] GraphQL API
- [ ] gRPC for performance
- [ ] Edge functions
- [ ] Local AI models (WebLLM)

---

**For implementation details, see [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)**
