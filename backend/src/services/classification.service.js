import { prisma } from '../db/prisma.js';
import { ClaudeService } from './claude.service.js';
import logger from '../utils/logger.js';

export class ClassificationService {
  constructor(userId) {
    this.userId = userId;
    this.claudeService = new ClaudeService();
  }

  async classifyEmails(emails, batchSize = 50) {
    const buckets = await prisma.bucket.findMany({
      where: { userId: this.userId }
    });

    if (buckets.length === 0) {
      logger.warn(`No buckets found for user ${this.userId}`);
      return [];
    }

    const results = [];

    // Process emails in batches
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      try {
        const classifications = await this.classifyBatch(batch, buckets);

        // Update emails with classifications
        for (const classification of classifications) {
          const email = batch.find(e => e.id === classification.email_id);
          if (email) {
            const bucket = buckets.find(b => b.name.toLowerCase() === classification.bucket.toLowerCase());

            if (bucket) {
              await prisma.email.update({
                where: { id: email.id },
                data: { bucketId: bucket.id }
              });

              results.push({
                emailId: email.id,
                bucketId: bucket.id,
                confidence: classification.confidence
              });
            }
          }
        }

        logger.info(`Classified batch of ${batch.length} emails`);
      } catch (error) {
        logger.error(`Failed to classify batch starting at index ${i}:`, error);
      }
    }

    return results;
  }

  async classifyBatch(emails, buckets) {
    const prompt = this.buildClassificationPrompt(emails, buckets);

    try {
      const response = await this.claudeService.sendMessage(prompt);
      const classifications = await this.claudeService.parseJSON(response);

      return Array.isArray(classifications) ? classifications : [];
    } catch (error) {
      logger.error('Classification error:', error);
      throw error;
    }
  }

  buildClassificationPrompt(emails, buckets) {
    const bucketDescriptions = buckets.map(b => {
      return `- ${b.name}: ${b.description || 'Emails related to ' + b.name}`;
    }).join('\n');

    const emailDescriptions = emails.map((email, idx) => {
      return `
Email ${idx + 1}:
ID: ${email.id}
From: ${email.sender} <${email.senderEmail}>
Subject: ${email.subject}
Preview: ${email.preview.substring(0, 200)}...
`;
    }).join('\n');

    return `You are an email classification assistant. Classify each email into the most appropriate bucket based on the sender and content.

BUCKETS:
${bucketDescriptions}

EMAILS:
${emailDescriptions}

CRITICAL CLASSIFICATION RULES:
1. SENDER DOMAIN MATCHING: If the sender email or domain contains a bucket name (case-insensitive), classify it to that bucket
   - Example: "no-reply@instagram.com" → Instagram bucket
   - Example: "notifications@etsy.com" → Etsy bucket
   - Example: "service@linkedin.com" → LinkedIn bucket

2. SUBJECT/CONTENT MATCHING: If sender doesn't match, check if the subject or preview contains the bucket name or clear references to it

3. DEFAULT BUCKETS: Use these for general categories:
   - Important: Urgent emails requiring action, from known contacts
   - Newsletter: Marketing emails, promotions, bulk emails
   - Social: Social media notifications
   - Auto-archive: Receipts, confirmations, automated notifications
   - Can Wait: Low priority emails

4. ACCURACY: Be precise - an Instagram email should ALWAYS go to Instagram bucket if it exists, not to "Social" or "Newsletter"

Return a JSON array with this exact format:
[
  {
    "email_id": "email-id-here",
    "bucket": "BucketName",
    "confidence": 0.95
  }
]

Return ONLY the JSON array, no additional text.`;
  }

  async reclassifyAllEmails() {
    const emails = await prisma.email.findMany({
      where: { userId: this.userId }
    });

    logger.info(`Reclassifying ${emails.length} emails for user ${this.userId}`);

    return await this.classifyEmails(emails);
  }
}
