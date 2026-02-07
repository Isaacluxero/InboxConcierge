import { prisma } from '../db/prisma.js';
import { ClassificationService } from '../services/classification.service.js';
import logger from '../utils/logger.js';

export const getBuckets = async (req, res) => {
  try {
    const buckets = await prisma.bucket.findMany({
      where: { userId: req.user.id },
      include: {
        _count: {
          select: { emails: true }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    res.json({ success: true, data: buckets });
  } catch (error) {
    logger.error('Get buckets error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBucketById = async (req, res) => {
  try {
    const { id } = req.params;

    const bucket = await prisma.bucket.findFirst({
      where: {
        id,
        userId: req.user.id
      },
      include: {
        _count: {
          select: { emails: true }
        }
      }
    });

    if (!bucket) {
      return res.status(404).json({ success: false, error: 'Bucket not found' });
    }

    res.json({ success: true, data: bucket });
  } catch (error) {
    logger.error('Get bucket by ID error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createBucket = async (req, res) => {
  try {
    const { name, description, color } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Bucket name is required' });
    }

    // Check if bucket with same name already exists for this user
    const existing = await prisma.bucket.findFirst({
      where: {
        userId: req.user.id,
        name: name.trim()
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'Bucket with this name already exists' });
    }

    const bucket = await prisma.bucket.create({
      data: {
        userId: req.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#6B7280',
        isDefault: false
      }
    });

    logger.info(`Created bucket "${name}" for user ${req.user.id}`);

    res.status(201).json({ success: true, data: bucket });
  } catch (error) {
    logger.error('Create bucket error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBucket = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    // Verify bucket belongs to user
    const bucket = await prisma.bucket.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!bucket) {
      return res.status(404).json({ success: false, error: 'Bucket not found' });
    }

    // Check if new name conflicts with existing bucket
    if (name && name !== bucket.name) {
      const existing = await prisma.bucket.findFirst({
        where: {
          userId: req.user.id,
          name: name.trim(),
          id: { not: id }
        }
      });

      if (existing) {
        return res.status(400).json({ success: false, error: 'Bucket with this name already exists' });
      }
    }

    const updatedBucket = await prisma.bucket.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(color && { color })
      }
    });

    logger.info(`Updated bucket ${id} for user ${req.user.id}`);

    res.json({ success: true, data: updatedBucket });
  } catch (error) {
    logger.error('Update bucket error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteBucket = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify bucket belongs to user and is not default
    const bucket = await prisma.bucket.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!bucket) {
      return res.status(404).json({ success: false, error: 'Bucket not found' });
    }

    if (bucket.isDefault) {
      return res.status(400).json({ success: false, error: 'Cannot delete default bucket' });
    }

    // Count emails in this bucket before deletion (for optimization tracking)
    const emailCount = await prisma.email.count({
      where: { bucketId: id, userId: req.user.id }
    });

    // Set emails in this bucket to unclassified (bucketId = null)
    // These are the ONLY emails that need reclassification
    await prisma.email.updateMany({
      where: { bucketId: id },
      data: { bucketId: null }
    });

    await prisma.bucket.delete({
      where: { id }
    });

    logger.info(`Deleted bucket "${bucket.name}" (${id}) for user ${req.user.id}. ${emailCount} emails set to unclassified and will be reclassified.`);

    res.json({
      success: true,
      message: 'Bucket deleted successfully',
      emailsToReclassify: emailCount
    });
  } catch (error) {
    logger.error('Delete bucket error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const reclassifyEmails = async (req, res) => {
  try {
    const classificationService = new ClassificationService(req.user.id);

    // Get emails to reclassify
    // By default, only reclassify unclassified emails (bucketId = null)
    // This saves time and money by not reclassifying already classified emails
    const { bucketId, all } = req.query;

    const where = {
      userId: req.user.id,
      ...(bucketId && { bucketId }),
      // Only reclassify unclassified emails unless 'all' flag is set
      ...(all !== 'true' && !bucketId && { bucketId: null })
    };

    const emails = await prisma.email.findMany({ where });

    if (emails.length === 0) {
      return res.json({ success: true, data: { classified: 0 } });
    }

    const results = await classificationService.classifyEmails(emails);

    logger.info(`Reclassified ${results.length} emails for user ${req.user.id} (${all === 'true' ? 'all emails' : 'unclassified only'})`);

    res.json({
      success: true,
      data: {
        classified: results.length,
        total: emails.length
      }
    });
  } catch (error) {
    logger.error('Reclassify emails error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
