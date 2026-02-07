# Smart Hybrid Search - Intelligent Strategy Selection

## Overview

The search system automatically chooses the **optimal search strategy** based on your query. No dropdowns, no options - just type naturally and the system intelligently decides how to search.

## How It Works

### Step 1: Parse Query with OpenAI
Every search query is sent to OpenAI GPT-4o-mini to extract structured fields:
- **Sender**: Person name or email
- **Topic**: Subject/keywords
- **Timeframe**: Date ranges ("last week", "yesterday", etc.)
- **Bucket**: Category ("Important", "Newsletter", etc.)

### Step 2: Intelligent Strategy Selection

The system analyzes the parsed fields and **automatically** chooses:

| Query Type | Strategy | Why |
|-----------|----------|-----|
| **"Emails from Sarah last week"** | PostgreSQL Filtering | Exact matching for sender + date |
| **"Budget discussions"** | Vector Similarity | Semantic understanding for topic |
| **"Sarah's budget emails last week"** | Hybrid (Filter + Re-rank) | Best of both worlds |

## Three Search Strategies

### Strategy 1: Pure Structured Search (PostgreSQL)

**When**: Query has sender/date/bucket but NO topic

**Example**: "emails from sarah@company.com last week"

**How it works**:
```sql
SELECT * FROM Email
WHERE userId = 'user-id'
  AND sender ILIKE '%sarah%'
  AND receivedAt >= '2024-01-30'
ORDER BY receivedAt DESC
LIMIT 20
```

**Best for**: Exact matches (specific person, date range, folder)

---

### Strategy 2: Pure Vector Search (Semantic)

**When**: Query has ONLY a topic, no sender/date/bucket

**Example**: "budget discussions" or "project updates"

**How it works**:
1. Generate embedding for "budget discussions"
2. Find emails with similar embeddings using cosine similarity
3. Return top 20 most similar (>0.7 similarity)

**Best for**: Finding semantically related content
- "budget" finds: "financial review", "cost analysis", "spending report"
- "meeting notes" finds: "recap from today", "action items", "discussion summary"

---

### Strategy 3: Hybrid Search (Filter + Re-rank)

**When**: Query has BOTH topic AND structured fields

**Example**: "Sarah's budget emails from last week"

**How it works**:
1. **Filter candidates** with PostgreSQL (sender=Sarah, date=last week)
2. **Re-rank** those candidates by vector similarity to "budget"
3. Return top 20 best matches

**Best for**: Most queries! Combines precision + semantic understanding

**Why it's better**:
- Filters 1000 emails → 50 candidates (PostgreSQL)
- Re-ranks 50 candidates by topic relevance (vector similarity)
- Returns top 20 most relevant

## Real Examples

### Example 1: Structured Only
```
Query: "emails from sarah@company.com yesterday"

Parsed:
{
  "sender": "sarah@company.com",
  "timeframe": { "start": "2024-02-05", "end": "2024-02-06" },
  "topic": null,
  "bucket": null
}

Strategy: PostgreSQL Filtering
Result: All emails from Sarah yesterday (20 results)
```

### Example 2: Topic Only
```
Query: "budget concerns"

Parsed:
{
  "sender": null,
  "timeframe": null,
  "topic": "budget concerns",
  "bucket": null
}

Strategy: Vector Similarity
Result: Semantically related emails about finances (20 results)
```

### Example 3: Hybrid
```
Query: "Sarah's budget emails from last week"

Parsed:
{
  "sender": "Sarah",
  "timeframe": { "start": "2024-01-30", "end": "2024-02-06" },
  "topic": "budget",
  "bucket": null
}

Strategy: Hybrid (Filter + Re-rank)
Process:
1. PostgreSQL: Find Sarah's emails from last week (100 candidates)
2. Vector: Re-rank by similarity to "budget"
3. Return: Top 20 most budget-related emails from Sarah
```

## Benefits

### 🎯 Precision Where You Need It
Exact matches for:
- Email addresses (sarah@company.com)
- Date ranges (last week, yesterday)
- Specific folders (Important, Newsletter)

### 🧠 Semantic Understanding Where It Matters
Finds related content:
- "budget" → "financial review", "cost analysis"
- "meeting" → "recap", "action items", "discussion"
- "project update" → "status report", "progress", "milestone"

### ⚡ Fast Performance
- PostgreSQL filters eliminate irrelevant emails instantly
- Vector search only runs on relevant candidates
- Returns top 20 results quickly

### 🔄 Automatic - No User Input Needed
- One search box
- No dropdowns or options
- System intelligently chooses strategy
- User just types naturally

## Query Examples

| Query | Strategy | What It Finds |
|-------|----------|---------------|
| **"instagram"** | Vector | Social media emails, notifications, posts |
| **"emails from John"** | Structured | All emails from John |
| **"last week"** | Structured | All emails from last 7 days |
| **"budget meetings"** | Vector | Budget-related meeting emails |
| **"John's budget emails"** | Hybrid | John's emails about budget |
| **"Important emails today"** | Hybrid | Important bucket emails from today |
| **"Sarah's project updates last month"** | Hybrid | Sarah's project emails from last 30 days |

## Technical Details

### Parsing with OpenAI
- Model: GPT-4o-mini
- Temperature: 0.2 (consistent results)
- Response format: JSON only
- Cost: ~$0.0001 per search

### Vector Similarity
- Model: text-embedding-3-small (1536 dimensions)
- Distance metric: Cosine similarity
- Similarity threshold: 0.7
- Index: IVFFlat (fast approximate search)

### PostgreSQL Filtering
- Indexes on: userId, sender, receivedAt, bucketId
- Case-insensitive matching (ILIKE)
- Date range queries with gte/lte

## Performance

**Typical search time**:
- Structured: 50-100ms
- Vector: 200-300ms
- Hybrid: 300-500ms

**Why hybrid is fast**:
1. PostgreSQL filters 1000 emails → 50 candidates (50ms)
2. Vector re-ranks 50 candidates (200ms)
3. Total: ~250ms vs 1000+ candidates

## Fallback Strategy

If no structured fields or topic found:
- Returns 20 most recent emails
- Sorted by received date (descending)

## Configuration

All automatic! No config needed.

**Defaults**:
- Top results: 20
- Candidate pool (hybrid): 100
- Similarity threshold: 0.7
- Batch size (embeddings): 100

## API Response

```json
{
  "success": true,
  "data": {
    "emails": [...],
    "totalCount": 15,
    "strategy": "hybrid",
    "query": "Sarah's budget emails"
  }
}
```

**Strategy values**:
- `"structured"` - PostgreSQL filtering only
- `"vector"` - Vector similarity only
- `"hybrid"` - Filter + re-rank
- `"recent"` - Fallback (recent emails)

---

## Quick Start

**Just search naturally!**

```
"find emails about budget"
"show me Sarah's emails from last week"
"important emails today"
"project updates from John"
```

The system automatically:
1. Parses your query
2. Chooses the best strategy
3. Returns top 20 results

No configuration. No options. Just smart search. 🚀
