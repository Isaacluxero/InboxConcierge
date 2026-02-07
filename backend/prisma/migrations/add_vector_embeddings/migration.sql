-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to Email table
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS email_embedding_idx ON "Email" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
