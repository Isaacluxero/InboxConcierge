# Inbox Concierge

AI-powered email management system with natural language search capabilities using OpenAI.

## Features

- **Google OAuth Authentication** - Secure login with Google
- **Email Classification** - Automatic classification into customizable buckets using OpenAI GPT-4o-mini
- **Smart Hybrid Search** - Intelligent search that automatically chooses the best strategy:
  - **Structured Search** - PostgreSQL filtering for sender/date/bucket queries
  - **Semantic Search** - Vector similarity for topic-based queries
  - **Hybrid Search** - Combines both for complex queries
  - Examples: "Find emails from John last week", "budget discussions", "Sarah's project updates last month"
- **Vector Embeddings** - Automatic semantic embedding generation (powered by OpenAI)
- **Advanced Analytics** - Comprehensive email insights including:
  - Email volume trends, busiest hours/days, sender diversity
  - Time-of-day distribution, classification stats, embedding coverage
- **Custom Buckets** - Create and manage your own email categories
- **Real-time Sync** - Fetch and classify emails from Gmail
- **Security** - Industry-standard security with helmet.js, rate limiting, input validation

## Tech Stack

- **Frontend:** React (Vite), TanStack Query
- **Backend:** Node.js/Express
- **Database:** PostgreSQL with pgvector extension (Railway-managed)
- **ORM:** Prisma
- **AI/LLM:** OpenAI GPT-4o-mini for classification, embeddings, and query parsing
- **Auth:** Google OAuth 2.0
- **Security:** Helmet.js, express-rate-limit, express-validator
- **Deployment:** Railway

## Project Structure

```
inbox-concierge/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom React hooks
│   │   └── App.jsx          # Main app component
│   └── package.json
│
├── backend/                  # Express backend
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Route controllers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth & error handling
│   │   └── server.js        # Main server file
│   └── package.json
│
└── CLAUDE.md                 # Development guide
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google OAuth credentials
- Anthropic API key

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `GOOGLE_REDIRECT_URI` - Your callback URL
- `OPENAI_API_KEY` - From OpenAI (for classification, embeddings, and query parsing)
- `SESSION_SECRET` - Random secure string (32+ characters)
- `FRONTEND_URL` - Frontend URL for CORS
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins

5. Generate Prisma client and run migrations:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

6. Start development server:
```bash
npm run dev
```

Backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure `VITE_API_URL` in `.env`:
```
VITE_API_URL=http://localhost:3000
```

5. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Client Secret to backend `.env`

### Anthropic API Setup

1. Sign up at [Anthropic Console](https://console.anthropic.com/)
2. Create an API key
3. Add to backend `.env` as `ANTHROPIC_API_KEY`

## Railway Deployment

### Prerequisites

- Railway account
- GitHub repository

### Deployment Steps

1. Create new Railway project:
```bash
railway init
```

2. Add PostgreSQL service in Railway dashboard

3. Add backend service:
   - Connect GitHub repository
   - Set build command: `npm run build`
   - Set start command: `npm start`
   - Configure environment variables

4. Deploy frontend:
   - Build frontend: `npm run build`
   - Deploy `dist` folder to Railway static service
   - Or use Vercel/Netlify

5. Update environment variables:
   - Update `GOOGLE_REDIRECT_URI` with Railway backend URL
   - Update `FRONTEND_URL` with Railway/Vercel frontend URL
   - Configure `ALLOWED_ORIGINS`

6. Run migrations:
```bash
railway run npx prisma migrate deploy
```

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/user` - Get current user
- `POST /auth/logout` - Logout

### Emails
- `POST /api/emails/sync` - Sync emails from Gmail
- `GET /api/emails` - Get emails (with optional `bucketId` filter)
- `GET /api/emails/:id` - Get email by ID
- `PATCH /api/emails/:id/bucket` - Update email bucket

### Buckets
- `GET /api/buckets` - Get all buckets
- `GET /api/buckets/:id` - Get bucket by ID
- `POST /api/buckets` - Create bucket
- `PATCH /api/buckets/:id` - Update bucket
- `DELETE /api/buckets/:id` - Delete bucket
- `POST /api/buckets/reclassify` - Reclassify emails

### Search
- `POST /api/search` - Smart search with natural language
- `GET /api/search/keyword?q=...` - Simple keyword search

## Default Buckets

The system creates these buckets on user signup:
- **Important** - Action-required emails from known contacts
- **Can Wait** - Low priority, non-urgent
- **Auto-archive** - Receipts, confirmations, automated notifications
- **Newsletter** - Promotional content, marketing, bulk emails
- **Social** - Social media notifications

## Development

### Database Migrations

Create new migration:
```bash
npx prisma migrate dev --name migration_name
```

Deploy migrations:
```bash
npx prisma migrate deploy
```

Reset database (WARNING: deletes all data):
```bash
npx prisma migrate reset
```

### Code Quality

Run ESLint:
```bash
npm run lint
```

Format with Prettier:
```bash
npx prettier --write .
```

## Architecture

### Email Classification

1. Fetch emails from Gmail API
2. Parse and normalize email data
3. Batch emails (20-50 per batch)
4. Send to OpenAI GPT-4o-mini API with bucket definitions (cost-effective model for high-volume classification)
5. Store classification results in PostgreSQL
6. **Automatically generate vector embeddings** (50 per sync) for semantic search

### Smart Hybrid Search

The system intelligently chooses the optimal search strategy:

**1. Query Parsing** - OpenAI GPT-4o-mini extracts:
- Sender name/email
- Topic/keywords
- Timeframe (with pattern matching fallback)
- Bucket category

**2. Strategy Selection:**
- **Structured Search** - When query has only sender/date/bucket (no topic)
  - Uses PostgreSQL WHERE clauses for exact matching
  - Fast and precise
- **Vector Search** - When query has only a topic (no structured filters)
  - Generates query embedding with OpenAI text-embedding-3-small
  - Uses pgvector for semantic similarity search
  - Returns up to 50 results with similarity > 0.5
  - Falls back to keyword search if no embeddings exist
- **Hybrid Search** - When query has both topic AND structured filters
  - Step 1: PostgreSQL filters candidates (sender, date, bucket)
  - Step 2: Re-ranks candidates by vector similarity to topic
  - Best of both worlds: precision + semantic understanding

**3. Automatic Embeddings:**
- Generated during email sync (50 emails per sync)
- Zero user configuration required
- Progressive enhancement - search improves as embeddings are generated

## Troubleshooting

### Prisma Migration Failures
- Ensure `DATABASE_URL` is set correctly
- Run `npx prisma migrate deploy`

### CORS Errors
- Add frontend URL to `ALLOWED_ORIGINS` in backend `.env`

### OAuth Redirect Mismatch
- Ensure `GOOGLE_REDIRECT_URI` matches exactly in Google Console

### Classification Errors
- Verify `OPENAI_API_KEY` is valid
- Check batch size is < 50 emails
- Review OpenAI API rate limits (gpt-4o-mini has high rate limits)
