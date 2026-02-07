# Vector Search Setup - Quick Start

## ✅ What's Done

1. **Database**: Added pgvector extension + embedding column
2. **Backend**: Vector search service with OpenAI embeddings
3. **Frontend**: "Enable Vector Search" button in dashboard
4. **API**: Auto-batches 100 emails at a time

## 🚀 How to Use

### Step 1: Click "Enable Vector Search" Button

In your dashboard header, you'll see a new button: **🔮 Enable Vector Search**

Click it once and it will:
- Generate embeddings for 100 emails
- Auto-trigger next batch if more emails remain
- Show progress: "Generated embeddings for 100 emails! (234 remaining)"

### Step 2: Wait for Completion

The button will keep processing until all emails have embeddings.

### Step 3: Search!

Once done, search naturally:
- "emails from last week"
- "project updates"
- "budget discussions"
- "meeting notes from Sarah"

## How Vector Search Works

**Traditional keyword search:**
```
Query: "budget" → Finds emails with word "budget"
```

**Vector semantic search:**
```
Query: "budget" → Finds:
  - "Q4 financial review"
  - "Cost analysis"
  - "Spending report"
  - "Invoice approval"
```

## Cost

**Super cheap!**
- 1000 emails: ~$0.002 (yes, fraction of a cent)
- Search: FREE (just database queries)

## Technical Details

- **Model**: OpenAI `text-embedding-3-small` (1536 dimensions)
- **Database**: PostgreSQL with pgvector extension
- **Index**: IVFFlat for fast similarity search
- **Batch size**: 100 emails per request
- **Similarity threshold**: 0.7 (filters irrelevant results)

## Troubleshooting

**Button says "Generating..." forever?**
- Check backend logs for errors
- Verify OPENAI_API_KEY is set in backend `.env`

**Search returns no results?**
- Make sure you clicked "Enable Vector Search" first
- Embeddings must be generated before searching

**Want to regenerate embeddings?**
- They auto-regenerate if you sync new emails
- Or click the button again (safe to re-run)

---

## That's It!

1. ✅ Click "🔮 Enable Vector Search"
2. ✅ Wait for it to finish
3. ✅ Search naturally!

No more complex query parsing. Just **pure semantic search**. 🎯
