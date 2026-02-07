import React from 'react';
import GoogleAuthButton from '../components/Auth/GoogleAuthButton';

/**
 * Login page component
 * Displays branding and Google OAuth login button
 */
const LoginPage = () => {
  return (
    <div className="page-center">
      <div className="glass-dark card-login">
        <div className="icon-xl">
          📧
        </div>
        <h1 className="heading-xl gradient-text mb-md">
          Inbox Concierge
        </h1>
        <p className="text-lg text-white-90 mb-xl">
          AI-powered email management with smart search
        </p>
        <GoogleAuthButton />
        <p className="text-sm text-white-60 mt-lg" style={{ lineHeight: '1.6' }}>
          Sign in with Google to start organizing your inbox with AI
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
