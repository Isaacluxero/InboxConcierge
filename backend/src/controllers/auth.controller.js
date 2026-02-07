import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../db/prisma.js';
import logger from '../utils/logger.js';

// Configure Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;

        // Calculate token expiry (Google tokens typically last 1 hour)
        const tokenExpiry = new Date(Date.now() + 3600 * 1000);

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { googleId }
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              googleId,
              accessToken,
              refreshToken: refreshToken || '',
              tokenExpiry
            }
          });

          // Create default buckets for new user
          const defaultBuckets = [
            { name: 'Important', description: 'Action required, from known contacts', isDefault: true, color: '#EF4444' },
            { name: 'Can Wait', description: 'Low priority, non-urgent', isDefault: true, color: '#F59E0B' },
            { name: 'Auto-archive', description: 'Receipts, confirmations', isDefault: true, color: '#10B981' },
            { name: 'Newsletter', description: 'Promotional, marketing', isDefault: true, color: '#3B82F6' },
            { name: 'Social', description: 'Social media notifications', isDefault: true, color: '#8B5CF6' }
          ];

          await prisma.bucket.createMany({
            data: defaultBuckets.map(bucket => ({
              ...bucket,
              userId: user.id
            }))
          });

          logger.info(`New user created: ${email}`);
        } else {
          // Update existing user's tokens
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              accessToken,
              refreshToken: refreshToken || user.refreshToken,
              tokenExpiry
            }
          });
        }

        return done(null, user);
      } catch (error) {
        logger.error('Authentication error:', error);
        return done(error, null);
      }
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export const getCurrentUser = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    });

    res.json({ success: true, user });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
};

export const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      logger.error('Logout error:', err);
      return res.status(500).json({ success: false, error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
};
