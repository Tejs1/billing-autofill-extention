# AI Form Auto Fill - Backend Server

This is the backend proxy server for the AI Form Auto Fill browser extension. It securely stores your OpenAI API key and handles all communication with OpenAI's API, ensuring your API key never touches the client side.

## Features

- 🔒 Secure API key storage on the server side
- 🚀 Built with Bun for maximum performance
- 🛡️ Authentication via server API key
- 🌐 CORS support for browser extensions
- 📊 Request validation and error handling
- ⚡ Rate limiting to prevent abuse

## Prerequisites

- [Bun](https://bun.sh) installed on your system
- OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)

## Quick Start

### Automated Setup (Recommended)

Run the setup script to automatically install dependencies and create your `.env` file:

```bash
cd server
./setup.sh
```

The script will:

- Check if Bun is installed
- Install dependencies
- Create `.env` file with auto-generated `SERVER_API_KEY`
- Display your server API key for the extension

Then edit `.env` and add your OpenAI API key.

### Manual Setup

### 1. Install Dependencies

```bash
cd server
bun install
```

### 2. Configure Environment Variables

Create a `.env` file:

```bash
touch .env
```

Edit `.env` and set:

- `OPENAI_API_KEY`: Your OpenAI API key
- `SERVER_API_KEY`: A secure random string (generate with `openssl rand -hex 32`)
- `PORT`: Server port (default: 3000)
- `ALLOWED_ORIGINS`: CORS origins (use `*` for development)

### 3. Run the Server

**Development mode (with auto-reload):**

```bash
bun run dev
```

**Production mode:**

```bash
bun run start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## API Documentation

For complete API documentation including detailed request/response formats, examples in multiple languages, and best practices, see **[API.md](./API.md)**.

## API Endpoints

### POST `/api/generate-fill`

Generates AI-powered form field values based on field metadata.

**Headers:**

- `Content-Type: application/json`
- `X-API-Key: <your-server-api-key>`

**Request Body:**

```json
{
  "fields": [
    {
      "id": "field-1",
      "name": "email",
      "label": "Email Address",
      "placeholder": "Enter your email",
      "type": "email",
      "existingValue": ""
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
      "reason": "Valid email format for email input field"
    }
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Error message here"
}
```

## Deployment

### Railway

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Add environment variables in Railway dashboard
5. Deploy: `railway up`

### Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Launch: `fly launch`
4. Set secrets:
   ```bash
   fly secrets set OPENAI_API_KEY=sk-...
   fly secrets set SERVER_API_KEY=your-key
   ```
5. Deploy: `fly deploy`

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel`
4. Add environment variables in Vercel dashboard

### Docker

```dockerfile
FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
COPY . .
EXPOSE 3000
CMD ["bun", "run", "start"]
```

Build and run:

```bash
docker build -t ai-form-autofill-server .
docker run -p 3000:3000 --env-file .env ai-form-autofill-server
```

## Security Considerations

- Never commit `.env` file to version control
- Use a strong, randomly generated `SERVER_API_KEY`
- In production, set `ALLOWED_ORIGINS` to your specific extension ID
- Consider implementing rate limiting for production use
- Monitor API usage to prevent abuse
- Keep your OpenAI API key secure and rotate it periodically

## Testing

### Automated Test Script

Run the included test script to verify your setup:

```bash
# Make sure the server is running first
bun run dev

# In another terminal, run the test script
./test-endpoint.sh
```

The script will test:

- Health check endpoint
- Generate fill endpoint with sample data
- Authentication (invalid API key rejection)

### Manual Testing with curl

Test the endpoint manually:

```bash
curl -X POST http://localhost:3000/api/generate-fill \
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

## Troubleshooting

**Server won't start:**

- Check if port 3000 is already in use
- Verify Bun is installed: `bun --version`
- Check `.env` file exists and has correct values

**OpenAI API errors:**

- Verify your API key is valid
- Check your OpenAI account has credits
- Review rate limits on your OpenAI account

**CORS errors:**

- Update `ALLOWED_ORIGINS` in `.env`
- For Chrome extensions, use: `chrome-extension://YOUR_EXTENSION_ID`

## License

MIT
