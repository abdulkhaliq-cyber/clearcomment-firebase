# ClearComment Railway Worker

Backend service for processing Facebook webhooks, comment moderation, and automation rules.

## Features

- **Facebook Webhook Handler**: Receives and processes comment events from Facebook
- **Rule Engine**: Applies keyword-based moderation rules
- **AI Moderation**: Uses OpenAI to detect inappropriate content
- **Job Queue**: Async processing with BullMQ (requires Redis)
- **Firebase Integration**: Stores comments, rules, and logs in Firestore

## Project Structure

```
/src
  index.ts              # Express server entry point
  facebookWebhook.ts    # Facebook webhook verification and event handling
  ruleEngine.ts         # Comment processing and rule matching logic
  firestore.ts          # Firebase Admin SDK initialization
  aiModeration.ts       # OpenAI moderation integration
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required variables:
- `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON (as string)
- `FACEBOOK_VERIFY_TOKEN`: Token for webhook verification
- `OPENAI_API_KEY`: OpenAI API key for AI moderation
- `REDIS_HOST`: Redis host (for BullMQ queue)

### 3. Get Firebase Service Account

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Convert to single-line string and set as `FIREBASE_SERVICE_ACCOUNT`

### 4. Run Locally

Development mode (with hot reload):
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

## Deployment to Railway

### 1. Create Railway Project

```bash
railway init
```

### 2. Add Redis Service

In Railway dashboard:
- Add a new service → Redis
- Copy the connection details

### 3. Set Environment Variables

In Railway dashboard, add all environment variables from `.env.example`:
- `FIREBASE_SERVICE_ACCOUNT`
- `FACEBOOK_VERIFY_TOKEN`
- `OPENAI_API_KEY`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (from Railway Redis service)

### 4. Deploy

```bash
railway up
```

Or connect to GitHub for automatic deployments.

## API Endpoints

### `GET /status`
Health check endpoint. Returns `200 OK`.

### `GET /webhook/facebook`
Facebook webhook verification endpoint.

### `POST /webhook/facebook`
Receives Facebook webhook events (comments, posts, etc.).

## Testing

### Test Webhook Locally

Use ngrok to expose your local server:
```bash
ngrok http 3000
```

Then configure the ngrok URL in Facebook App settings.

### Test Comment Processing

Send a POST request to `/webhook/facebook` with a sample Facebook event payload.

## Logging

All moderation actions are logged to the `/logs` collection in Firestore with:
- `commentId`: The comment that was moderated
- `ruleId`: The rule that triggered the action
- `actionType`: Type of action (hide, reply, etc.)
- `timestamp`: When the action occurred

## Notes

- **Redis is required** for the job queue (BullMQ). If Redis is not available, the worker will fall back to synchronous processing (not recommended for production).
- **Firebase Admin SDK** requires a service account with Firestore permissions.
- **OpenAI API** is optional but recommended for AI-powered moderation.
