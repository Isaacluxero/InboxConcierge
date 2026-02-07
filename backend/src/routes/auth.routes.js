import express from 'express';
import passport from 'passport';
import { getCurrentUser, logout } from '../controllers/auth.controller.js';

const router = express.Router();

// Initiate Google OAuth
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.readonly']
  })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed` }),
  (req, res) => {
    // Successful authentication, redirect to frontend
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

// Get current user
router.get('/user', getCurrentUser);

// Logout
router.post('/logout', logout);

export default router;
