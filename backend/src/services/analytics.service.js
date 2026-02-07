import { prisma } from '../server.js';
import logger from '../utils/logger.js';

export class AnalyticsService {
  constructor(userId) {
    this.userId = userId;
  }

  /**
   * Get comprehensive email analytics and insights
   */
  async getInsights() {
    try {
      // Get all emails for this user
      const emails = await prisma.email.findMany({
        where: { userId: this.userId },
        include: { bucket: true },
        orderBy: { receivedAt: 'desc' }
      });

      const totalEmails = emails.length;

      // Calculate insights
      const insights = {
        totalEmails,
        bucketBreakdown: await this.getBucketBreakdown(),
        topSenders: this.getTopSenders(emails),
        emailsByDay: this.getEmailsByDay(emails),
        recentActivity: this.getRecentActivity(emails),
        averagePerDay: this.getAveragePerDay(emails),
        oldestEmail: emails.length > 0 ? emails[emails.length - 1].receivedAt : null,
        newestEmail: emails.length > 0 ? emails[0].receivedAt : null
      };

      logger.info(`Generated insights for user ${this.userId}`);
      return insights;

    } catch (error) {
      logger.error('Analytics error:', error);
      throw error;
    }
  }

  /**
   * Get email count per bucket
   */
  async getBucketBreakdown() {
    const buckets = await prisma.bucket.findMany({
      where: { userId: this.userId },
      include: {
        _count: {
          select: { emails: true }
        }
      }
    });

    // Also get unclassified count
    const unclassifiedCount = await prisma.email.count({
      where: {
        userId: this.userId,
        bucketId: null
      }
    });

    const breakdown = buckets.map(bucket => ({
      name: bucket.name,
      count: bucket._count.emails,
      color: bucket.color
    }));

    if (unclassifiedCount > 0) {
      breakdown.push({
        name: 'Unclassified',
        count: unclassifiedCount,
        color: '#6b7280'
      });
    }

    return breakdown.sort((a, b) => b.count - a.count);
  }

  /**
   * Get top email senders
   */
  getTopSenders(emails) {
    const senderCounts = {};

    emails.forEach(email => {
      const sender = email.senderEmail || email.sender;
      if (sender) {
        senderCounts[sender] = (senderCounts[sender] || 0) + 1;
      }
    });

    return Object.entries(senderCounts)
      .map(([sender, count]) => ({ sender, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 senders
  }

  /**
   * Get email volume by day for last 30 days
   */
  getEmailsByDay(emails) {
    const days = {};
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Initialize last 30 days with 0 counts
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      days[dateStr] = 0;
    }

    // Count emails per day
    emails.forEach(email => {
      const emailDate = new Date(email.receivedAt);
      if (emailDate >= thirtyDaysAgo) {
        const dateStr = emailDate.toISOString().split('T')[0];
        if (days[dateStr] !== undefined) {
          days[dateStr]++;
        }
      }
    });

    return Object.entries(days)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get recent activity stats (last 7 days)
   */
  getRecentActivity(emails) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentEmails = emails.filter(e => new Date(e.receivedAt) >= sevenDaysAgo);

    return {
      last7Days: recentEmails.length,
      averagePerDay: Math.round(recentEmails.length / 7)
    };
  }

  /**
   * Calculate average emails per day
   */
  getAveragePerDay(emails) {
    if (emails.length === 0) return 0;

    const oldest = new Date(emails[emails.length - 1].receivedAt);
    const newest = new Date(emails[0].receivedAt);
    const daysDiff = Math.max(1, Math.ceil((newest - oldest) / (1000 * 60 * 60 * 24)));

    return Math.round(emails.length / daysDiff);
  }
}
