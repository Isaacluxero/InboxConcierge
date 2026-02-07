/**
 * Application constants and configuration values
 * Centralized location for magic numbers and repeated values
 */

// Gmail API Configuration
export const GMAIL_CONFIG = {
  MAX_RESULTS: 200,
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY_MS: 1000
};

// AI Model Configuration
export const AI_CONFIG = {
  CLASSIFICATION_TEMPERATURE: 0.3,
  QUERY_PARSING_TEMPERATURE: 0.2,
  QUERY_EXPANSION_TEMPERATURE: 0.3,
  QUERY_EXPANSION_MAX_TOKENS: 200,
  QUERY_PARSING_MAX_TOKENS: 300,
  CLASSIFICATION_MAX_TOKENS: 2000
};

// Search Configuration
export const SEARCH_CONFIG = {
  SIMILARITY_THRESHOLD: 0.3,  // Lowered from 0.5 for better recall
  MAX_EXPANDED_TERMS: 5,
  HYBRID_RERANK_LIMIT: 100
};

// Analytics Configuration
export const ANALYTICS_CONFIG = {
  DAYS_IN_WEEK: 7,
  DAYS_IN_MONTH: 30,
  MS_PER_DAY: 24 * 60 * 60 * 1000
};

// Batch Processing
export const BATCH_CONFIG = {
  CLASSIFICATION_BATCH_SIZE: 50,
  EMBEDDING_BATCH_SIZE: 100
};

// OpenAI Models
export const OPENAI_MODELS = {
  CLASSIFICATION: 'gpt-4o',
  QUERY_PARSING: 'gpt-4o-mini',
  QUERY_EXPANSION: 'gpt-3.5-turbo',
  EMBEDDING: 'text-embedding-3-small'
};

// Default Buckets
export const DEFAULT_BUCKETS = [
  {
    name: 'Important',
    description: 'Emails requiring action or from known contacts',
    color: '#EF4444',
    isDefault: true
  },
  {
    name: 'Can Wait',
    description: 'Low priority, non-urgent emails',
    color: '#F59E0B',
    isDefault: true
  },
  {
    name: 'Auto-archive',
    description: 'Receipts, confirmations, automated notifications',
    color: '#10B981',
    isDefault: true
  },
  {
    name: 'Newsletter',
    description: 'Promotional content, marketing, bulk emails',
    color: '#6366F1',
    isDefault: true
  },
  {
    name: 'Social',
    description: 'Social media notifications',
    color: '#EC4899',
    isDefault: true
  }
];

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
};

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized',
  NOT_FOUND: 'Resource not found',
  INVALID_INPUT: 'Invalid input data',
  SERVER_ERROR: 'Internal server error',
  RATE_LIMITED: 'Rate limit exceeded, please try again later'
};
