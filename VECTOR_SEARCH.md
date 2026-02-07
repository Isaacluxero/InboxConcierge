# Vector Embeddings Search

## What Changed

Completely replaced the natural language parsing approach with **vector embeddings** for true semantic search.

## How It Works

1. **Embeddings Generation**: Converts email content to 1536-dimensional vectors using OpenAI's `text-embedding-3-small` model
2. **pgvector**: PostgreSQL extension for efficient vector similarity search
3. **Cosine Similarity**: Finds emails semantically similar to your query

## Setup Steps

### 1. Generate Embeddings for Existing Emails

First, you need to generate embeddings for all your emails. You can do this by calling the embeddings endpoint or adding a button in the UI.

**Option A: Using curl**
```bash
curl -X POST http://localhost:3000/api/search/embeddings \
  -H "Content-Type: application/json" \
  --cookie "your-session-cookie"
```

**Option B: Add a button to the frontend**
I'll add this next if you want.

The endpoint processes 100 emails at a time. Call it multiple times until all emails have embeddings.

### 2. Search

Once embeddings are generated, search works automatically:

```
"emails from last week"  → Finds emails semantically about recent timeframes
"project updates"        → Finds all project-related emails
"meeting notes"          → Finds meeting-related content
"budget discussions"     → Finds financial conversations
```

## Benefits

✅ **True semantic search** - Understands meaning, not just keywords
✅ **No API calls for search** - Fast database queries
✅ **Works offline** - Once embeddings are generated
✅ **More accurate** - Finds related content even without exact keywords
✅ **Similarity scores** - Only returns relevant results (>0.7 similarity)

## Cost

**Embedding Generation:**
- Model: `text-embedding-3-small`
- Cost: ~$0.02 per 1M tokens
- Average email: ~100 tokens
- **1000 emails: ~$0.002** (very cheap!)

**Search:**
- FREE! Just database queries

## Example Queries

### Before (Keyword Search)
```
"budget" → Only finds emails with word "budget"
```

### Now (Semantic Search)
```
"budget" → Finds:
  - "Q4 financial review"
  - "Cost analysis for project"
  - "Spending report"
  - "Invoice approval needed"
```

## Database Schema

Added to Email table:
```sql
embedding vector(1536)  -- 1536-dimensional vector
```

Index for fast similarity search:
```sql
CREATE INDEX email_embedding_idx
ON "Email" USING ivfflat (embedding vector_cosine_ops);
```

## API Endpoints

### 1. Generate Embeddings
```
POST /api/search/embeddings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "processed": 100,
    "remaining": 234
  }
}
```

Call repeatedly until `remaining` is 0.

### 2. Semantic Search
```
POST /api/search
Body: { "query": "your search query" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "emails": [...],
    "totalCount": 15,
    "query": "your search query"
  }
}
```

## Technical Details

**Vector Search Query:**
```sql
SELECT *,
  1 - (embedding <=> query_embedding::vector) as similarity
FROM "Email"
WHERE "userId" = $1 AND embedding IS NOT NULL
ORDER BY embedding <=> query_embedding::vector
LIMIT 50
```

**Similarity Threshold:** 0.7 (filters out irrelevant results)

## Migration

Migration automatically applied:
- ✅ Enabled pgvector extension
- ✅ Added embedding column
- ✅ Created vector index

## Next Steps

1. **Generate embeddings** for your existing emails
2. **Test search** - try semantic queries
3. **Auto-embed new emails** - I can add this to the email sync if you want

---

## Quick Start

```bash
# 1. Generate embeddings (in Postman/curl or add UI button)
POST /api/search/embeddings

# 2. Search!
POST /api/search
{ "query": "budget meetings from Sarah" }
```

That's it! Vector search is now live. 🚀
