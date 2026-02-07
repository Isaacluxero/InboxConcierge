import { prisma } from '../db/prisma.js';
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
        newestEmail: emails.length > 0 ? emails[0].receivedAt : null,

        // New detailed metrics
        busiestHours: this.getBusiestHours(emails),
        busiestDays: this.getBusiestDaysOfWeek(emails),
        senderDiversity: this.getSenderDiversity(emails),
        monthlyTrend: this.getMonthlyTrend(emails),
        embeddingCoverage: await this.getEmbeddingCoverage(),
        timeDistribution: this.getTimeDistribution(emails),
        emailLengthDistribution: this.getEmailLengthDistribution(emails),
        classificationStats: await this.getClassificationStats()
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

  /**
   * Get busiest hours of the day (0-23)
   */
  getBusiestHours(emails) {
    const hourCounts = Array(24).fill(0);

    emails.forEach(email => {
      const hour = new Date(email.receivedAt).getHours();
      hourCounts[hour]++;
    });

    return hourCounts.map((count, hour) => ({
      hour: `${hour}:00`,
      count
    })).sort((a, b) => b.count - a.count).slice(0, 5); // Top 5 busiest hours
  }

  /**
   * Get busiest days of the week
   */
  getBusiestDaysOfWeek(emails) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts = Array(7).fill(0);

    emails.forEach(email => {
      const day = new Date(email.receivedAt).getDay();
      dayCounts[day]++;
    });

    return dayCounts.map((count, index) => ({
      day: dayNames[index],
      count
    })).sort((a, b) => b.count - a.count);
  }

  /**
   * Get sender diversity stats
   */
  getSenderDiversity(emails) {
    const uniqueSenders = new Set();

    emails.forEach(email => {
      const sender = email.senderEmail || email.sender;
      if (sender) uniqueSenders.add(sender);
    });

    return {
      uniqueSenders: uniqueSenders.size,
      totalEmails: emails.length,
      averageEmailsPerSender: emails.length > 0 ? Math.round(emails.length / uniqueSenders.size) : 0
    };
  }

  /**
   * Get monthly trend (this month vs last month)
   */
  getMonthlyTrend(emails) {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthEmails = emails.filter(e => new Date(e.receivedAt) >= thisMonthStart);
    const lastMonthEmails = emails.filter(e => {
      const date = new Date(e.receivedAt);
      return date >= lastMonthStart && date <= lastMonthEnd;
    });

    const change = lastMonthEmails.length > 0
      ? Math.round(((thisMonthEmails.length - lastMonthEmails.length) / lastMonthEmails.length) * 100)
      : 0;

    return {
      thisMonth: thisMonthEmails.length,
      lastMonth: lastMonthEmails.length,
      percentChange: change,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  }

  /**
   * Get embedding coverage percentage
   */
  async getEmbeddingCoverage() {
    const total = await prisma.email.count({
      where: { userId: this.userId }
    });

    // Use raw SQL for unsupported vector type
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Email"
      WHERE "userId" = ${this.userId}
      AND embedding IS NOT NULL
    `;

    const withEmbeddings = Number(result[0].count);

    return {
      total,
      withEmbeddings,
      percentage: total > 0 ? Math.round((withEmbeddings / total) * 100) : 0,
      remaining: total - withEmbeddings
    };
  }

  /**
   * Get time of day distribution (morning, afternoon, evening, night)
   */
  getTimeDistribution(emails) {
    const distribution = {
      morning: 0,   // 6-12
      afternoon: 0, // 12-17
      evening: 0,   // 17-21
      night: 0      // 21-6
    };

    emails.forEach(email => {
      const hour = new Date(email.receivedAt).getHours();
      if (hour >= 6 && hour < 12) distribution.morning++;
      else if (hour >= 12 && hour < 17) distribution.afternoon++;
      else if (hour >= 17 && hour < 21) distribution.evening++;
      else distribution.night++;
    });

    return distribution;
  }

  /**
   * Get email length distribution
   */
  getEmailLengthDistribution(emails) {
    const distribution = {
      short: 0,  // < 100 chars
      medium: 0, // 100-500 chars
      long: 0    // > 500 chars
    };

    emails.forEach(email => {
      const length = (email.preview || '').length;
      if (length < 100) distribution.short++;
      else if (length < 500) distribution.medium++;
      else distribution.long++;
    });

    return distribution;
  }

  /**
   * Get classification statistics
   */
  async getClassificationStats() {
    const total = await prisma.email.count({
      where: { userId: this.userId }
    });

    const classified = await prisma.email.count({
      where: {
        userId: this.userId,
        bucketId: { not: null }
      }
    });

    const unclassified = total - classified;

    return {
      total,
      classified,
      unclassified,
      classificationRate: total > 0 ? Math.round((classified / total) * 100) : 0
    };
  }
}
