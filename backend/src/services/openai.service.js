import OpenAI from 'openai';
import logger from '../utils/logger.js';
import { AI_CONFIG, OPENAI_MODELS } from '../config/constants.js';

export class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Expand search query with related terms, synonyms, and variations
   * Uses GPT-3.5-turbo for cost efficiency (~$0.0003 per request)
   */
  async expandSearchTerms(query) {
    try {
      const prompt = `You are a search query expansion assistant. Given a search term, generate CLOSELY RELATED terms only.

Query: "${query}"

Generate 3-5 related search terms. ONLY include:
- The original term (ALWAYS first)
- Direct synonyms
- Common abbreviations (if applicable)
- Related brands/services (if applicable)

DO NOT include:
- Generic related words (e.g., for "social media" don't add "online" or "internet")
- Overly broad terms
- Single words from multi-word queries unless they're meaningful brands

Examples:
- "social media" → ["social media", "Instagram", "Facebook", "Twitter", "LinkedIn"]
- "machine learning" → ["machine learning", "ML", "AI", "deep learning"]
- "budget meeting" → ["budget meeting", "budget", "quarterly budget", "financial planning"]
- "project update" → ["project update", "project status", "status update"]

Return ONLY a JSON array of strings, no other text.`;

      const response = await this.client.chat.completions.create({
        model: OPENAI_MODELS.QUERY_EXPANSION,
        messages: [
          { role: 'system', content: 'You are a helpful search query expansion assistant. Always respond with valid JSON arrays only.' },
          { role: 'user', content: prompt }
        ],
        temperature: AI_CONFIG.QUERY_EXPANSION_TEMPERATURE,
        max_tokens: AI_CONFIG.QUERY_EXPANSION_MAX_TOKENS
      });

      const content = response.choices[0].message.content.trim();

      // Parse the JSON response
      const expandedTerms = JSON.parse(content);

      // Ensure we have an array and it's not too long
      if (!Array.isArray(expandedTerms)) {
        logger.warn('OpenAI did not return an array, using original query');
        return [query];
      }

      // Limit to 5 terms to avoid overly broad searches
      const terms = expandedTerms.slice(0, 5);

      logger.info(`[OpenAI] Expanded "${query}" to:`, terms);
      return terms;

    } catch (error) {
      logger.error('[OpenAI] Query expansion failed:', error.message);
      // Fallback to original query if expansion fails
      return [query];
    }
  }

  /**
   * Parse natural language search query into structured filters
   * Uses GPT-4o-mini for better understanding of natural language
   */
  async parseSearchQuery(query) {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format

      const prompt = `IMPORTANT: Today's date is ${today} (${now.toISOString()})

Parse this email search query into structured filters.

Query: "${query}"

Extract the following information:
- topic: main subject/keywords to search for (if the query is just a keyword or phrase with no other context, use that as the topic)
- timeframe: relative date range (e.g., "last week" → 7 days ago, "this month" → start of current month)
- sender: person name or email domain if mentioned
- bucket: category/bucket name if mentioned
- hasAttachment: true if query mentions attachments

Return JSON only in this exact format:
{
  "topic": "string or null",
  "timeframe": { "start": "ISO date string", "end": "ISO date string" } or null,
  "sender": "string or null",
  "bucket": "string or null",
  "hasAttachment": boolean or null
}

Examples:
- "instagram" → {"topic": "instagram", "timeframe": null, "sender": null, "bucket": null, "hasAttachment": null}
- "emails from John last week" → {"topic": null, "timeframe": {"start": "2026-01-30T00:00:00Z", "end": "2026-02-06T23:59:59Z"}, "sender": "John", "bucket": null, "hasAttachment": null}
- "important emails about budget" → {"topic": "budget", "timeframe": null, "sender": null, "bucket": "Important", "hasAttachment": null}
- "get emails from last week" → {"topic": null, "timeframe": {"start": "2026-01-30T00:00:00Z", "end": "2026-02-06T23:59:59Z"}, "sender": null, "bucket": null, "hasAttachment": null}

Return ONLY the JSON object, no additional text.`;

      const response = await this.client.chat.completions.create({
        model: OPENAI_MODELS.QUERY_PARSING,
        messages: [
          {
            role: 'system',
            content: 'You are a search query parser that converts natural language into structured JSON. Always respond with valid JSON only, no additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: AI_CONFIG.QUERY_PARSING_TEMPERATURE,
        max_tokens: AI_CONFIG.QUERY_PARSING_MAX_TOKENS,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content.trim();
      const filters = JSON.parse(content);

      logger.info('[OpenAI] Parsed search query:', filters);

      return filters;
    } catch (error) {
      logger.error('[OpenAI] Query parsing failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate embeddings for text using text-embedding-3-small
   * Cost: ~$0.02 per 1M tokens (very cheap!)
   */
  async generateEmbedding(text) {
    try {
      const response = await this.client.embeddings.create({
        model: OPENAI_MODELS.EMBEDDING,
        input: text,
        encoding_format: 'float'
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('[OpenAI] Embedding generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate embeddings for email content
   * Combines subject, sender, and preview for better search
   */
  async generateEmailEmbedding(email) {
    const text = `${email.subject}\n${email.sender}\n${email.preview || ''}`.trim();
    return this.generateEmbedding(text);
  }

  /**
   * Test method to verify OpenAI connection
   */
  async test() {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say "Hello from OpenAI!"' }],
        max_tokens: 10
      });
      return response.choices[0].message.content;
    } catch (error) {
      logger.error('[OpenAI] Test failed:', error);
      throw error;
    }
  }
}
