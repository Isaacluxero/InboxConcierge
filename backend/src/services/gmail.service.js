import { google } from 'googleapis';
import { prisma } from '../db/prisma.js';
import logger from '../utils/logger.js';

export class GmailService {
  constructor(user) {
    this.user = user;
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.oauth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  async refreshAccessTokenIfNeeded() {
    if (new Date() >= this.user.tokenExpiry) {
      try {
        const { credentials } = await this.oauth2Client.refreshAccessToken();

        await prisma.user.update({
          where: { id: this.user.id },
          data: {
            accessToken: credentials.access_token,
            tokenExpiry: new Date(Date.now() + (credentials.expiry_date || 3600000))
          }
        });

        this.oauth2Client.setCredentials(credentials);
        logger.info(`Refreshed access token for user ${this.user.email}`);
      } catch (error) {
        logger.error('Token refresh failed:', error);
        throw new Error('Failed to refresh access token');
      }
    }
  }

  async fetchEmails(maxResults = 200) {
    await this.refreshAccessTokenIfNeeded();

    try {
      const response = await this.retryWithBackoff(async () => {
        return await this.gmail.users.threads.list({
          userId: 'me',
          maxResults,
          q: 'in:inbox'
        });
      });

      const threads = response.data.threads || [];
      const emails = [];

      for (const thread of threads) {
        try {
          const threadData = await this.retryWithBackoff(async () => {
            return await this.gmail.users.threads.get({
              userId: 'me',
              id: thread.id,
              format: 'metadata',
              metadataHeaders: ['From', 'Subject', 'Date']
            });
          });

          const message = threadData.data.messages[0];
          const headers = message.payload.headers;

          const from = this.getHeader(headers, 'From');
          const subject = this.getHeader(headers, 'Subject');
          const date = this.getHeader(headers, 'Date');

          const senderMatch = from.match(/^(.*?)\s*<(.+?)>$|(.+)/);
          const senderName = senderMatch ? (senderMatch[1] || senderMatch[3]).trim() : 'Unknown';
          const senderEmail = senderMatch ? (senderMatch[2] || senderMatch[3]).trim() : '';

          const snippet = message.snippet || '';

          emails.push({
            gmailId: thread.id,
            subject: subject || '(No Subject)',
            sender: senderName,
            senderEmail,
            preview: snippet,
            bodySnippet: snippet,
            receivedAt: new Date(date || Date.now()),
            userId: this.user.id
          });
        } catch (error) {
          logger.error(`Failed to fetch thread ${thread.id}:`, error);
        }
      }

      return emails;
    } catch (error) {
      logger.error('Failed to fetch emails:', error);
      throw error;
    }
  }

  async saveEmails(emails) {
    const savedEmails = [];

    for (const email of emails) {
      try {
        const saved = await prisma.email.upsert({
          where: {
            userId_gmailId: {
              userId: email.userId,
              gmailId: email.gmailId
            }
          },
          update: {
            subject: email.subject,
            sender: email.sender,
            senderEmail: email.senderEmail,
            preview: email.preview,
            bodySnippet: email.bodySnippet,
            receivedAt: email.receivedAt
          },
          create: email
        });

        savedEmails.push(saved);
      } catch (error) {
        logger.error(`Failed to save email ${email.gmailId}:`, error);
      }
    }

    return savedEmails;
  }

  getHeader(headers, name) {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : '';
  }

  async retryWithBackoff(fn, maxRetries = 5, baseDelay = 1000) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (error.code === 429 && attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          logger.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
  }
}
