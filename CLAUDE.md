# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Inbox Concierge is an AI-powered email management system that automatically classifies Gmail emails into customizable buckets and provides natural language search capabilities using Claude AI.

## Tech Stack

- **Frontend**: React with Vite
- **Backend**: Node.js/Express
- **Database**: PostgreSQL (Railway-managed)
- **ORM**: Prisma
- **AI/LLM**: Claude API (Anthropic) for classification and search
- **Auth**: Google OAuth 2.0
- **Deployment**: Railway

## Project Structure

```
inbox-concierge/
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/           # Google OAuth components
│   │   │   ├── EmailBuckets/   # Email display and bucket views
│   │   │   ├── BucketManager/  # Bucket CRUD operations
│   │   │   └── Search/         # Smart search UI
│   │   ├── services/           # API and auth services
│   │   ├── hooks/              # Custom React hooks
│   │   └── App.jsx
│   └── vite.config.js
│
└── backend/                     # Express API server
    ├── prisma/
    │   └── schema.prisma       # PostgreSQL schema
    ├── src/
    │   ├── routes/             # Express route handlers
    │   ├── controllers/        # Business logic
    │   ├── services/           # Core services
    │   │   ├── gmail.service.js          # Gmail API integration
    │   │   ├── classification.service.js  # Email classification
    │   │   ├── claude.service.js         # Claude API wrapper
    │   │   └── search.service.js         # Natural language search
    │   ├── middleware/         # Auth and error handling
    │   └── server.js
    └── package.json
```

## Database Schema

The application uses PostgreSQL with three main models:

### User Model
- Stores Google OAuth credentials (access token, refresh token, token expiry)
- One-to-many relationship with Emails and Buckets

### Email Model
- Stores email metadata (subject, sender, preview, received date)
- Includes `gmailId` for Gmail thread tracking
- Optional `bucketId` foreign key for classification
- Fields for search optimization: `bodySnippet`, `searchVector`

### Bucket Model
- User-defined email categories
- Has `isDefault` flag for system-created buckets
- Supports custom colors for UI
- Unique constraint on `userId` + `name`

## Default Buckets

The system creates these buckets on user signup:
- **Important**: Action-required emails from known contacts
- **Can Wait**: Low priority, non-urgent
- **Auto-archive**: Receipts, confirmations, automated notifications
- **Newsletter**: Promotional content, marketing, bulk emails
- **Social**: Social media notifications

## Development Commands

### Backend Setup
```bash
cd backend
npm install
npx prisma generate                    # Generate Prisma client
npx prisma migrate dev --name init     # Run migrations locally
npm run dev                            # Start development server
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev                            # Start Vite dev server
```

### Database Migrations
```bash
# Create a new migration
npx prisma migrate dev --name <migration_name>

# Deploy migrations to production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Core Architecture

### Email Classification Flow

1. **Fetch**: Gmail API retrieves last 200 threads
2. **Parse**: Extract subject, sender, preview, timestamp
3. **Batch**: Group 20-50 emails for classification
4. **Classify**: Send batch to Claude with bucket definitions
5. **Store**: Update `bucketId` for each email in PostgreSQL

**Why batching?**
- Reduces API calls to Claude (cost optimization)
- Provides better context for classification decisions
- Manages rate limits effectively

### Smart Search Architecture

Uses a three-tier semantic search approach:

1. **Natural Language Parsing** (Claude API):
   - User query: "Find emails about the project from last week"
   - Claude extracts: topic, timeframe, sender, bucket
   - Returns structured JSON filters

2. **Query Expansion** (OpenAI GPT-3.5-turbo):
   - Takes the extracted topic (e.g., "social media")
   - Expands to related terms: ["social media", "Instagram", "Facebook", "Twitter", "LinkedIn", "TikTok"]
   - Cost: ~$0.0003 per search (10x cheaper than Claude)
   - Provides semantic search without vector embeddings

3. **Database Query** (PostgreSQL):
   - Constructs Prisma query from parsed filters and expanded terms
   - Searches for ANY of the expanded terms (OR condition)
   - Uses case-insensitive search on subject/preview/sender
   - Applies date range filters for timeframe
   - Orders by relevance and recency

**Example search flow:**
```javascript
User: "emails about social media"
  ↓
Claude parses: { topic: "social media" }
  ↓
OpenAI expands: ["social media", "Instagram", "Facebook", "Twitter", "LinkedIn", "TikTok"]
  ↓
SQL: WHERE (subject ILIKE '%social media%' OR subject ILIKE '%Instagram%' OR ...)
  ↓
Return Instagram emails even though they don't mention "social media"
```

**Why this hybrid approach?**
- **Smart**: Understands semantic relationships (Instagram = social media)
- **Fast**: PostgreSQL keyword search (no vector similarity calculations)
- **Cheap**: Query expansion costs ~$0.0003 vs vector embeddings at ~$0.0001/email
- **Simple**: No pgvector extension, no embedding pipelines, no vector indexes

## Environment Variables

### Backend `.env`
```
DATABASE_URL=                  # Auto-provided by Railway
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=           # https://your-backend.railway.app/auth/google/callback
ANTHROPIC_API_KEY=
NODE_ENV=production
PORT=3000
SESSION_SECRET=                # Random secure string
FRONTEND_URL=                  # For CORS
ALLOWED_ORIGINS=               # Comma-separated list
```

### Frontend `.env`
```
VITE_API_URL=                  # Backend Railway URL
```

## Authentication Flow

1. Frontend redirects to `/auth/google`
2. Backend initiates OAuth flow with Google
3. Google redirects to `/auth/google/callback` with auth code
4. Backend exchanges code for access/refresh tokens
5. Tokens stored in PostgreSQL User table
6. Session cookie set for authenticated requests

**Token refresh**: Implement automatic refresh when `tokenExpiry` approaches using refresh token.

## Gmail API Integration

### Key Considerations

- **Rate Limits**: Gmail API has per-user quotas. Implement exponential backoff on 429 errors.
- **Scopes Required**: `gmail.readonly` for fetching emails
- **Pagination**: Use `pageToken` for fetching >100 threads
- **Thread vs Message**: Use threads for conversation grouping

### Fetching Emails

```javascript
// Fetch last 200 threads
gmail.users.threads.list({
  userId: 'me',
  maxResults: 200,
  q: 'in:inbox'  // Filter query
})
```

## Claude API Integration

### Classification Prompt Template

```
You are an email classification assistant. Classify the following emails into these buckets:

BUCKETS:
- Important: Emails requiring action, from known contacts, urgent matters
- Can Wait: Low priority, non-urgent emails
- Auto-archive: Receipts, confirmations, automated notifications
- Newsletter: Promotional content, bulk emails, marketing
- Social: Social media notifications, friend requests
{custom_buckets}

EMAILS:
{email_batch}

Return JSON array:
[
  { "email_id": "1", "bucket": "Important", "confidence": 0.95 }
]
```

**Dynamic bucket updates**: When users create/modify buckets, regenerate the prompt with updated bucket definitions.

### Search Query Parsing

```
Parse this email search query into structured filters.
Query: "{user_query}"

Extract:
- topic: main subject/keywords
- timeframe: relative date (e.g., "last week" → 7 days ago)
- sender: person/domain name
- bucket: category if mentioned

Return JSON only:
{
  "topic": "string or null",
  "timeframe": { "start": "ISO date" } or null,
  "sender": "string or null",
  "bucket": "string or null"
}
```

## Railway Deployment

### Setup Steps

1. Create Railway project: `railway init`
2. Add PostgreSQL service (auto-provides `DATABASE_URL`)
3. Deploy backend service from GitHub repo
4. Set environment variables in Railway dashboard
5. Build command: `npm run build` (runs Prisma migrations)
6. Start command: `npm start`
7. Deploy frontend (static site or separate service)

### Important Railway Configurations

- **Health Check**: Add `GET /health` endpoint that returns 200 OK
- **Graceful Shutdown**: Handle SIGTERM for clean database disconnection
- **Database Connection Pooling**: Configure Prisma connection limits
- **CORS**: Whitelist Railway frontend URL in backend CORS config

### Deployment Commands

```bash
railway login
railway link                    # Link to existing project
railway up                      # Deploy current code
railway logs                    # View production logs
```

## Error Handling Patterns

### Gmail API Rate Limits
```javascript
try {
  await gmail.users.threads.list(params);
} catch (error) {
  if (error.code === 429) {
    // Exponential backoff: wait 2^retryCount seconds
    await sleep(Math.pow(2, retryCount) * 1000);
    return retryFetch(params, retryCount + 1);
  }
  throw error;
}
```

### Token Expiration
```javascript
// Before each Gmail API call
if (user.tokenExpiry < new Date()) {
  const newTokens = await refreshAccessToken(user.refreshToken);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      accessToken: newTokens.access_token,
      tokenExpiry: new Date(Date.now() + newTokens.expires_in * 1000)
    }
  });
}
```

## Testing Guidelines

### Backend Tests
- Mock Gmail API responses to avoid quota usage
- Mock Claude API responses for deterministic tests
- Test token refresh logic with expired tokens
- Test batch classification with various email formats

### Frontend Tests
- Test auth flow redirects
- Test email card rendering with missing data
- Test search with empty results
- Test bucket creation validation

## Common Issues

### Prisma Migration Failures
- **Issue**: Migration fails in Railway production
- **Fix**: Ensure `DATABASE_URL` is set and run `npx prisma migrate deploy`

### CORS Errors
- **Issue**: Frontend can't reach backend API
- **Fix**: Add frontend URL to `ALLOWED_ORIGINS` in backend `.env`

### OAuth Redirect Mismatch
- **Issue**: Google OAuth fails after callback
- **Fix**: Ensure `GOOGLE_REDIRECT_URI` matches exactly in Google Console

### Classification Errors
- **Issue**: Emails not being classified
- **Fix**: Check Claude API key, verify prompt format, ensure batch size < 50

## Performance Considerations

- **Batch Processing**: Always classify emails in batches (20-50) to reduce API calls
- **Database Indexes**: Ensure indexes on `userId`, `bucketId`, `receivedAt` for fast queries
- **Connection Pooling**: Configure Prisma `connection_limit` for Railway environment
- **Caching**: Consider caching bucket definitions to avoid repeated DB queries

## Security Notes

- Never commit `.env` files (already in `.gitignore`)
- Rotate `SESSION_SECRET` periodically
- Store all OAuth tokens encrypted at rest (PostgreSQL handles this)
- Validate all user inputs before database queries (Prisma prevents SQL injection)
- Rate limit API endpoints to prevent abuse (use `express-rate-limit`)

## Implementation Phases

This project follows an 8-phase implementation plan:

1. **Local Setup**: Initialize projects, configure Prisma, test DB connection
2. **Authentication**: Google OAuth with Passport.js
3. **Gmail Integration**: Fetch and store emails with rate limit handling
4. **Classification**: Batch classification with Claude API
5. **Custom Buckets**: CRUD operations with dynamic prompt updates
6. **Smart Search**: Natural language query parsing and DB filtering
7. **Railway Deployment**: Production deployment with managed PostgreSQL
8. **Polish**: Error handling, logging, edge cases, testing

## Architecture Decisions

### Why PostgreSQL over MongoDB?
- Email relationships are inherently relational (User → Emails → Buckets)
- Prisma provides excellent type safety and migrations
- Full-text search capabilities built-in
- Railway managed service simplifies deployment

### Why Batch Classification?
- Reduces API costs (1 call for 50 emails vs 50 individual calls)
- Provides better context for Claude to make consistent decisions
- Naturally handles rate limiting

### Why Hybrid Search?
- Quick keyword fallback for exact matches (fast PostgreSQL queries)
- Claude provides natural language understanding for complex queries
- Best of both approaches: speed + intelligence

## Future Enhancements

- **Vector Search**: Use pgvector extension for semantic email search
- **Search History**: Store and display recent searches
- **Email Summaries**: Generate AI summaries for long email threads
- **Smart Replies**: Suggest responses using Claude
- **Email Scheduling**: Send emails at optimal times
