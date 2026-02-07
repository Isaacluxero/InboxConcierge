import { prisma } from '../server.js';
import { GmailService } from '../services/gmail.service.js';
import { ClassificationService } from '../services/classification.service.js';
import { SearchService } from '../services/search.service.js';
import logger from '../utils/logger.js';

export const syncEmails = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const gmailService = new GmailService(user);

    logger.info(`Starting email sync for user ${user.email}`);

    // Fetch emails from Gmail
    const emails = await gmailService.fetchEmails(200);

    // Save emails to database
    const savedEmails = await gmailService.saveEmails(emails);

    logger.info(`Saved ${savedEmails.length} emails for user ${user.email}`);

    // Classify unclassified emails
    const unclassifiedEmails = await prisma.email.findMany({
      where: {
        userId: user.id,
        bucketId: null
      },
      take: 100
    });

    if (unclassifiedEmails.length > 0) {
      const classificationService = new ClassificationService(user.id);
      await classificationService.classifyEmails(unclassifiedEmails);
      logger.info(`Classified ${unclassifiedEmails.length} emails`);
    }

    // Auto-generate embeddings for emails without them
    const searchService = new SearchService(user.id);
    const embeddingsResult = await searchService.generateMissingEmbeddings(50);
    logger.info(`Generated embeddings for ${embeddingsResult.processed} emails`);

    res.json({
      success: true,
      data: {
        fetched: emails.length,
        saved: savedEmails.length,
        classified: unclassifiedEmails.length,
        embeddings: embeddingsResult.processed
      }
    });
  } catch (error) {
    logger.error('Email sync error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getEmails = async (req, res) => {
  try {
    const { bucketId, limit = 50, offset = 0 } = req.query;

    const where = {
      userId: req.user.id,
      ...(bucketId && { bucketId })
    };

    const emails = await prisma.email.findMany({
      where,
      include: {
        bucket: true
      },
      orderBy: {
        receivedAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.email.count({ where });

    res.json({
      success: true,
      data: {
        emails,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Get emails error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getEmailById = async (req, res) => {
  try {
    const { id } = req.params;

    const email = await prisma.email.findFirst({
      where: {
        id,
        userId: req.user.id
      },
      include: {
        bucket: true
      }
    });

    if (!email) {
      return res.status(404).json({ success: false, error: 'Email not found' });
    }

    res.json({ success: true, data: email });
  } catch (error) {
    logger.error('Get email by ID error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateEmailBucket = async (req, res) => {
  try {
    const { id } = req.params;
    const { bucketId } = req.body;

    // Verify email belongs to user
    const email = await prisma.email.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!email) {
      return res.status(404).json({ success: false, error: 'Email not found' });
    }

    // Verify bucket belongs to user (if bucketId provided)
    if (bucketId) {
      const bucket = await prisma.bucket.findFirst({
        where: {
          id: bucketId,
          userId: req.user.id
        }
      });

      if (!bucket) {
        return res.status(404).json({ success: false, error: 'Bucket not found' });
      }
    }

    const updatedEmail = await prisma.email.update({
      where: { id },
      data: { bucketId },
      include: { bucket: true }
    });

    res.json({ success: true, data: updatedEmail });
  } catch (error) {
    logger.error('Update email bucket error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
