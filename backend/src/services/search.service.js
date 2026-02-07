import { prisma } from '../db/prisma.js';
import { OpenAIService } from './openai.service.js';
import logger from '../utils/logger.js';
import { SEARCH_CONFIG } from '../config/constants.js';

export class SearchService {
  constructor(userId) {
    this.userId = userId;
    this.openaiService = new OpenAIService();
  }

  /**
   * Pattern matching for common time phrases (fallback if OpenAI doesn't parse)
   */
  parseTimeframe(query) {
    const now = new Date();
    const queryLower = query.toLowerCase();

    // Today
    if (queryLower.includes('today')) {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      return { start: startOfDay.toISOString(), end: now.toISOString() };
    }

    // Yesterday
    if (queryLower.includes('yesterday')) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      return { start: yesterday.toISOString(), end: endOfYesterday.toISOString() };
    }

    // Last week / past week
    if (queryLower.includes('last week') || queryLower.includes('past week')) {
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 7);
      lastWeek.setHours(0, 0, 0, 0);
      return { start: lastWeek.toISOString(), end: now.toISOString() };
    }

    // Last month / past month
    if (queryLower.includes('last month') || queryLower.includes('past month')) {
      const lastMonth = new Date(now);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setHours(0, 0, 0, 0);
      return { start: lastMonth.toISOString(), end: now.toISOString() };
    }

    // This week
    if (queryLower.includes('this week')) {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return { start: startOfWeek.toISOString(), end: now.toISOString() };
    }

    // This month
    if (queryLower.includes('this month')) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfMonth.toISOString(), end: now.toISOString() };
    }

    return null;
  }

  /**
   * Smart hybrid search - automatically chooses best strategy
   * Parses query with OpenAI, then intelligently decides:
   * - Pure structured (sender/date) → PostgreSQL filtering
   * - Pure topic → Vector similarity
   * - Both → Hybrid (filter + re-rank by similarity)
   */
  async smartSearch(query) {
    try {
      logger.info(`[SmartSearch] Query: "${query}"`);

      // Step 1: Parse query with OpenAI to extract structured fields
      const filters = await this.openaiService.parseSearchQuery(query);
      logger.info('[SmartSearch] Parsed filters:', JSON.stringify(filters, null, 2));

      // Step 1.5: Pattern matching fallback for timeframes
      if (!filters.timeframe) {
        const patternTimeframe = this.parseTimeframe(query);
        if (patternTimeframe) {
          filters.timeframe = patternTimeframe;
          logger.info('[SmartSearch] Applied pattern-matched timeframe:', patternTimeframe);
        }
      }

      // Step 2: Intelligently choose search strategy
      const hasStructured = filters.sender || filters.timeframe || filters.bucket;
      const hasTopic = filters.topic;

      logger.info(`[SmartSearch] hasStructured: ${hasStructured}, hasTopic: ${hasTopic}`);

      let results;

      if (hasStructured && !hasTopic) {
        // Strategy 1: Pure structured search (PostgreSQL filtering)
        logger.info('[SmartSearch] Strategy: Pure PostgreSQL filtering');
        results = await this.structuredSearch(filters);
      } else if (hasTopic && !hasStructured) {
        // Strategy 2: Pure semantic search (vector similarity)
        logger.info('[SmartSearch] Strategy: Pure vector similarity');
        results = await this.vectorSearch(filters.topic);
      } else if (hasTopic && hasStructured) {
        // Strategy 3: Hybrid search (filter + re-rank)
        logger.info('[SmartSearch] Strategy: Hybrid (filter + re-rank)');
        results = await this.hybridSearch(filters);
      } else {
        // Fallback: return recent emails
        logger.info('[SmartSearch] Strategy: Fallback (recent emails)');
        results = await this.recentEmails();
      }

      logger.info(`[SmartSearch] Found ${results.emails.length} results`);

      return {
        emails: results.emails.slice(0, 50), // Top 50 results
        totalCount: results.totalCount,
        strategy: results.strategy,
        query
      };
    } catch (error) {
      logger.error('[SmartSearch] Error:', error);
      throw error;
    }
  }

  /**
   * Strategy 1: Pure structured search
   * Uses PostgreSQL WHERE clauses for exact matching
   */
  async structuredSearch(filters) {
    const whereConditions = {
      userId: this.userId
    };

    const andConditions = [];

    // Add timeframe filter
    if (filters.timeframe) {
      const timeCondition = {};
      if (filters.timeframe.start) {
        timeCondition.gte = new Date(filters.timeframe.start);
        logger.info(`[StructuredSearch] Timeframe start: ${timeCondition.gte.toISOString()}`);
      }
      if (filters.timeframe.end) {
        timeCondition.lte = new Date(filters.timeframe.end);
        logger.info(`[StructuredSearch] Timeframe end: ${timeCondition.lte.toISOString()}`);
      }
      if (Object.keys(timeCondition).length > 0) {
        andConditions.push({ receivedAt: timeCondition });
        logger.info('[StructuredSearch] Added timeframe condition:', timeCondition);
      }
    }

    // Add sender filter
    if (filters.sender) {
      andConditions.push({
        OR: [
          { sender: { contains: filters.sender, mode: 'insensitive' } },
          { senderEmail: { contains: filters.sender, mode: 'insensitive' } }
        ]
      });
      logger.info(`[StructuredSearch] Added sender filter: ${filters.sender}`);
    }

    // Add bucket filter
    if (filters.bucket) {
      const bucket = await prisma.bucket.findFirst({
        where: {
          userId: this.userId,
          name: { equals: filters.bucket, mode: 'insensitive' }
        }
      });

      if (bucket) {
        andConditions.push({ bucketId: bucket.id });
        logger.info(`[StructuredSearch] Added bucket filter: ${filters.bucket} (id: ${bucket.id})`);
      }
    }

    // Only add AND if we have conditions
    if (andConditions.length > 0) {
      whereConditions.AND = andConditions;
    }

    logger.info('[StructuredSearch] Final WHERE conditions:', JSON.stringify(whereConditions, null, 2));

    const emails = await prisma.email.findMany({
      where: whereConditions,
      include: { bucket: true },
      orderBy: { receivedAt: 'desc' },
      take: 50
    });

    logger.info(`[StructuredSearch] Found ${emails.length} results`);
    if (emails.length > 0) {
      logger.info(`[StructuredSearch] Date range of results: ${emails[emails.length - 1].receivedAt.toISOString()} to ${emails[0].receivedAt.toISOString()}`);
    }

    return {
      emails,
      totalCount: emails.length,
      strategy: 'structured'
    };
  }

  /**
   * Strategy 2: Pure vector search
   * Uses pgvector for semantic similarity
   */
  async vectorSearch(topic) {
    // Check if any emails have embeddings (using raw SQL because Prisma doesn't support vector type)
    const embeddingCountResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Email"
      WHERE "userId" = ${this.userId}
        AND embedding IS NOT NULL
    `;
    const embeddingCount = Number(embeddingCountResult[0].count);

    logger.info(`[VectorSearch] Found ${embeddingCount} emails with embeddings`);

    if (embeddingCount === 0) {
      // Fallback to keyword search if no embeddings exist
      logger.info('[VectorSearch] No embeddings found, falling back to keyword search');
      return await this.keywordSearch(topic);
    }

    // Generate embedding for the topic
    const queryEmbedding = await this.openaiService.generateEmbedding(topic);

    // Vector similarity search
    const emails = await prisma.$queryRaw`
      SELECT
        id,
        "userId",
        "gmailId",
        subject,
        sender,
        "senderEmail",
        preview,
        "receivedAt",
        "bucketId",
        "bodySnippet",
        "createdAt",
        "updatedAt",
        1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM "Email"
      WHERE "userId" = ${this.userId}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT 50
    `;

    logger.info(`[VectorSearch] Found ${emails.length} results before filtering`);

    // Log similarity distribution for analytics
    if (emails.length > 0) {
      const similarities = emails.map(e => e.similarity);
      logger.info(`[VectorSearch] Similarity scores - Max: ${Math.max(...similarities).toFixed(3)}, Min: ${Math.min(...similarities).toFixed(3)}, Avg: ${(similarities.reduce((sum, s) => sum + s, 0) / similarities.length).toFixed(3)}`);
    }

    // Lower threshold for better recall (previously 0.5 was too strict)
    // Many valid semantic matches fall in the 0.3-0.5 range
    const filteredEmails = emails.filter(email => email.similarity > SEARCH_CONFIG.SIMILARITY_THRESHOLD);

    logger.info(`[VectorSearch] ${filteredEmails.length} results after similarity > ${SEARCH_CONFIG.SIMILARITY_THRESHOLD} filter`);

    // If no results with vector search, fallback to keyword search
    if (filteredEmails.length === 0) {
      logger.info('[VectorSearch] No vector results found, falling back to keyword search');
      return await this.keywordSearch(topic);
    }

    // Fetch bucket information
    const emailsWithBuckets = await Promise.all(
      filteredEmails.map(async (email) => {
        if (email.bucketId) {
          const bucket = await prisma.bucket.findUnique({
            where: { id: email.bucketId }
          });
          return { ...email, bucket };
        }
        return { ...email, bucket: null };
      })
    );

    return {
      emails: emailsWithBuckets,
      totalCount: emailsWithBuckets.length,
      strategy: 'vector'
    };
  }

  /**
   * Keyword search fallback - simple PostgreSQL pattern matching
   */
  async keywordSearch(keyword) {
    const emails = await prisma.email.findMany({
      where: {
        userId: this.userId,
        OR: [
          { subject: { contains: keyword, mode: 'insensitive' } },
          { preview: { contains: keyword, mode: 'insensitive' } },
          { bodySnippet: { contains: keyword, mode: 'insensitive' } },
          { sender: { contains: keyword, mode: 'insensitive' } },
          { senderEmail: { contains: keyword, mode: 'insensitive' } }
        ]
      },
      include: { bucket: true },
      orderBy: { receivedAt: 'desc' },
      take: 50
    });

    logger.info(`[KeywordSearch] Found ${emails.length} results for "${keyword}"`);

    return {
      emails,
      totalCount: emails.length,
      strategy: 'keyword'
    };
  }

  /**
   * Strategy 3: Hybrid search
   * Filter candidates with PostgreSQL, then re-rank by vector similarity
   */
  async hybridSearch(filters) {
    // Step 1: Build SQL query to filter candidates (using raw SQL for embedding check)
    const whereConditions = [];
    const params = [this.userId];

    whereConditions.push(`"userId" = $1`);
    whereConditions.push(`embedding IS NOT NULL`);

    let paramIndex = 2;

    // Add timeframe filter
    if (filters.timeframe) {
      if (filters.timeframe.start) {
        whereConditions.push(`"receivedAt" >= $${paramIndex}`);
        params.push(new Date(filters.timeframe.start));
        paramIndex++;
      }
      if (filters.timeframe.end) {
        whereConditions.push(`"receivedAt" <= $${paramIndex}`);
        params.push(new Date(filters.timeframe.end));
        paramIndex++;
      }
    }

    // Add sender filter
    if (filters.sender) {
      whereConditions.push(`(LOWER(sender) LIKE $${paramIndex} OR LOWER("senderEmail") LIKE $${paramIndex})`);
      params.push(`%${filters.sender.toLowerCase()}%`);
      paramIndex++;
    }

    // Add bucket filter
    if (filters.bucket) {
      const bucket = await prisma.bucket.findFirst({
        where: {
          userId: this.userId,
          name: { equals: filters.bucket, mode: 'insensitive' }
        }
      });

      if (bucket) {
        whereConditions.push(`"bucketId" = $${paramIndex}`);
        params.push(bucket.id);
        paramIndex++;
      }
    }

    const whereClause = whereConditions.join(' AND ');

    // Get candidate email IDs using raw SQL
    const candidates = await prisma.$queryRawUnsafe(
      `SELECT id FROM "Email" WHERE ${whereClause} LIMIT 200`,
      ...params
    );

    if (candidates.length === 0) {
      return {
        emails: [],
        totalCount: 0,
        strategy: 'hybrid'
      };
    }

    // Step 2: Re-rank by vector similarity to topic
    const queryEmbedding = await this.openaiService.generateEmbedding(filters.topic);
    const candidateIds = candidates.map(c => c.id);

    const rankedEmails = await prisma.$queryRaw`
      SELECT
        id,
        "userId",
        "gmailId",
        subject,
        sender,
        "senderEmail",
        preview,
        "receivedAt",
        "bucketId",
        "bodySnippet",
        "createdAt",
        "updatedAt",
        1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM "Email"
      WHERE id = ANY(${candidateIds}::text[])
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT 50
    `;

    // Fetch bucket information
    const emailsWithBuckets = await Promise.all(
      rankedEmails.map(async (email) => {
        if (email.bucketId) {
          const bucket = await prisma.bucket.findUnique({
            where: { id: email.bucketId }
          });
          return { ...email, bucket };
        }
        return { ...email, bucket: null };
      })
    );

    return {
      emails: emailsWithBuckets,
      totalCount: emailsWithBuckets.length,
      strategy: 'hybrid'
    };
  }

  /**
   * Fallback: Recent emails
   */
  async recentEmails() {
    const emails = await prisma.email.findMany({
      where: { userId: this.userId },
      include: { bucket: true },
      orderBy: { receivedAt: 'desc' },
      take: 50
    });

    return {
      emails,
      totalCount: emails.length,
      strategy: 'recent'
    };
  }

  /**
   * Generate and store embeddings for an email
   */
  async generateEmbeddingForEmail(emailId) {
    try {
      const email = await prisma.email.findUnique({
        where: { id: emailId }
      });

      if (!email) {
        throw new Error('Email not found');
      }

      const embedding = await this.openaiService.generateEmailEmbedding(email);

      await prisma.$executeRaw`
        UPDATE "Email"
        SET embedding = ${embedding}::vector
        WHERE id = ${emailId}
      `;

      logger.info(`[VectorSearch] Generated embedding for email ${emailId}`);
    } catch (error) {
      logger.error('[VectorSearch] Embedding generation error:', error);
      throw error;
    }
  }

  /**
   * Batch generate embeddings for all emails without them
   */
  async generateMissingEmbeddings(batchSize = 100) {
    try {
      // Use raw SQL to find emails without embeddings (Prisma doesn't support vector type)
      const emailsWithoutEmbeddings = await prisma.$queryRaw`
        SELECT id, "userId", "gmailId", subject, sender, "senderEmail", preview, "receivedAt", "bucketId", "bodySnippet", "createdAt", "updatedAt"
        FROM "Email"
        WHERE "userId" = ${this.userId}
          AND embedding IS NULL
        LIMIT ${batchSize}
      `;

      logger.info(`[VectorSearch] Generating embeddings for ${emailsWithoutEmbeddings.length} emails`);

      for (const email of emailsWithoutEmbeddings) {
        await this.generateEmbeddingForEmail(email.id);
      }

      // Get remaining count using raw SQL
      const remainingResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM "Email"
        WHERE "userId" = ${this.userId}
          AND embedding IS NULL
      `;
      const remaining = Number(remainingResult[0].count);

      return {
        processed: emailsWithoutEmbeddings.length,
        remaining
      };
    } catch (error) {
      logger.error('[VectorSearch] Batch embedding error:', error);
      throw error;
    }
  }
}
