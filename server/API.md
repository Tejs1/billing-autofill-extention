# API Documentation

Complete API documentation for the AI Form Auto Fill Server. Use this API to generate realistic form field values using AI.

## Base URL

```
http://localhost:3690
```

For production deployments, replace with your server URL.

## Authentication

All API requests require authentication using an API key in the `X-API-Key` header.

```
X-API-Key: <your-server-api-key>
```

The API key is set via the `SERVER_API_KEY` environment variable on the server.

## Rate Limiting

- **Limit**: 20 requests per minute per API key
- **Window**: 60 seconds
- **Response**: `429 Too Many Requests` when limit is exceeded

## Endpoints

### Health Check

Check if the server is running and healthy.

**Endpoint:** `GET /health`

**Headers:** None required

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Example:**

```bash
curl http://localhost:3690/health
```

---

### Generate Form Fill Data

Generate AI-powered form field values based on field metadata. Each request generates diverse, realistic placeholder values.

**Endpoint:** `POST /api/generate-fill`

**Headers:**

- `Content-Type: application/json` (required)
- `X-API-Key: <your-server-api-key>` (required)

**Request Body:**

```json
{
  "fields": [
    {
      "id": "string", // Unique identifier for the field
      "name": "string", // Field name attribute (optional)
      "label": "string", // Field label text (optional)
      "placeholder": "string", // Placeholder text (optional)
      "type": "string", // Field type (required)
      "existingValue": "string" // Current field value (optional)
    }
  ]
}
```

**Field Types Supported:**

- `text` - General text input
- `email` - Email address
- `tel` - Phone number
- `url` - URL/website
- `search` - Search query
- `number` - Numeric value
- `textarea` - Multi-line text
- `datetime-local` - Date and time
- `date` - Date only
- `month` - Month and year
- `time` - Time only

**Constraints:**

- Maximum 50 fields per request
- At least 1 field required

**Response:**

```json
{
  "success": true,
  "data": {
    "<fieldId>": {
      "value": "generated value",
      "reason": "explanation of why this value fits"
    }
  }
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "field-1": {
      "value": "sarah.chen@example.com",
      "reason": "Valid email format matching the email input type"
    },
    "field-2": {
      "value": "Sarah Chen",
      "reason": "Realistic full name for a name input field"
    },
    "field-3": {
      "value": "+1 (555) 234-5678",
      "reason": "Properly formatted phone number for tel input"
    }
  }
}
```

**Error Responses:**

**401 Unauthorized** - Invalid or missing API key:

```json
{
  "success": false,
  "error": "Unauthorized: Invalid or missing API key"
}
```

**400 Bad Request** - Invalid request format:

```json
{
  "success": false,
  "error": "Invalid request: 'fields' must be an array"
}
```

**429 Too Many Requests** - Rate limit exceeded:

```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later."
}
```

**500 Internal Server Error** - Server error:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Examples

### cURL

```bash
curl -X POST http://localhost:3690/api/generate-fill \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-server-api-key" \
  -d '{
    "fields": [
      {
        "id": "email-1",
        "name": "email",
        "label": "Email Address",
        "placeholder": "Enter your email",
        "type": "email"
      },
      {
        "id": "name-1",
        "name": "fullname",
        "label": "Full Name",
        "type": "text"
      },
      {
        "id": "phone-1",
        "name": "phone",
        "label": "Phone Number",
        "type": "tel"
      }
    ]
  }'
```

### JavaScript (Fetch API)

```javascript
async function generateFormFill(fields) {
  const response = await fetch("http://localhost:3690/api/generate-fill", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "your-server-api-key",
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Request failed");
  }

  const data = await response.json();
  return data.data;
}

// Usage
const fields = [
  {
    id: "email-1",
    name: "email",
    label: "Email Address",
    type: "email",
  },
  {
    id: "name-1",
    name: "fullname",
    label: "Full Name",
    type: "text",
  },
];

generateFormFill(fields)
  .then((result) => {
    console.log("Generated values:", result);
    // Apply values to form fields
    Object.entries(result).forEach(([fieldId, { value }]) => {
      const field = document.querySelector(`[data-field-id="${fieldId}"]`);
      if (field) field.value = value;
    });
  })
  .catch((error) => console.error("Error:", error));
```

### Python (requests)

```python
import requests

def generate_form_fill(fields, api_key, base_url='http://localhost:3690'):
    url = f'{base_url}/api/generate-fill'
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': api_key
    }
    payload = {'fields': fields}

    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()

    data = response.json()
    if not data.get('success'):
        raise Exception(data.get('error', 'Unknown error'))

    return data.get('data', {})

# Usage
fields = [
    {
        'id': 'email-1',
        'name': 'email',
        'label': 'Email Address',
        'type': 'email'
    },
    {
        'id': 'name-1',
        'name': 'fullname',
        'label': 'Full Name',
        'type': 'text'
    }
]

try:
    result = generate_form_fill(fields, 'your-server-api-key')
    print('Generated values:', result)
except requests.exceptions.RequestException as e:
    print('Error:', e)
```

### Node.js (axios)

```javascript
const axios = require("axios");

async function generateFormFill(
  fields,
  apiKey,
  baseUrl = "http://localhost:3690"
) {
  try {
    const response = await axios.post(
      `${baseUrl}/api/generate-fill`,
      { fields },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || "Request failed");
    }

    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || "Request failed");
    }
    throw error;
  }
}

// Usage
const fields = [
  {
    id: "email-1",
    name: "email",
    label: "Email Address",
    type: "email",
  },
];

generateFormFill(fields, "your-server-api-key")
  .then((result) => console.log("Generated:", result))
  .catch((error) => console.error("Error:", error.message));
```

## Response Variation

The API is designed to generate **different values** for the same form fields on each request. This is achieved through:

- **Higher temperature** (0.75) for increased randomness
- **Random persona selection** (professional, casual, formal, creative, modern, traditional)
- **Unique variation seeds** per request
- **Explicit diversity instructions** in the AI prompt

This means calling the API multiple times with the same fields will produce different but realistic values each time.

## Best Practices

1. **Cache API Key Securely**: Never expose your API key in client-side code. Use environment variables or secure storage.

2. **Handle Errors Gracefully**: Always check the `success` field in responses and handle errors appropriately.

3. **Respect Rate Limits**: Implement exponential backoff when receiving 429 responses.

4. **Validate Field Types**: Ensure field types match the expected input types for better results.

5. **Provide Context**: Include meaningful `label` and `placeholder` values to help the AI generate more appropriate values.

6. **Batch Requests**: Group related fields in a single request (up to 50 fields) to reduce API calls.

## Field Metadata Guidelines

For best results, provide as much context as possible:

- **`label`**: The visible label text helps the AI understand the field's purpose
- **`placeholder`**: Placeholder text provides additional context about expected format
- **`name`**: Field name attributes often contain semantic information (e.g., "email", "phone")
- **`type`**: Always provide the correct HTML input type
- **`existingValue`**: Include if you want the AI to consider current values

## Troubleshooting

**401 Unauthorized:**

- Verify your API key matches the `SERVER_API_KEY` environment variable
- Check that the `X-API-Key` header is being sent correctly

**429 Rate Limit:**

- Wait 60 seconds before retrying
- Consider implementing request queuing for high-volume applications

**500 Internal Server Error:**

- Check server logs for detailed error messages
- Verify OpenAI API key is valid and has credits
- Ensure server has network access to OpenAI API

**Empty or Invalid Responses:**

- Verify field types are supported
- Check that at least one field is provided
- Ensure request body is valid JSON

## Support

For issues, questions, or contributions, please refer to the main project repository.
