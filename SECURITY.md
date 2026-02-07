# Security Guide - Inbox Concierge

## Current Security Measures

### ✅ Authentication & Authorization
- **Google OAuth 2.0**: Industry-standard authentication
- **Session-based auth**: Secure session management with Passport.js
- **Protected routes**: All API endpoints require authentication via `requireAuth` middleware
- **HttpOnly cookies**: Session cookies cannot be accessed by JavaScript (prevents XSS attacks)
- **Secure cookies**: Enabled in production (HTTPS only)
- **SameSite cookies**: Prevents CSRF attacks
- **24-hour session expiry**: Automatic logout after 24 hours

### ✅ API Security
- **Rate Limiting**:
  - General API: 100 requests per 15 minutes per IP
  - Auth endpoints: 5 attempts per 15 minutes per IP (brute force protection)
- **Helmet.js**: Sets secure HTTP headers
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - And more...
- **CORS whitelist**: Only allowed origins can access the API
- **Input validation**: Request validation on critical endpoints (buckets, search)
- **SQL injection protection**: Prisma ORM parameterizes all queries

### ✅ Data Security
- **Environment variables**: All secrets stored in .env (never committed)
- **Access tokens**: Google OAuth tokens stored in database
- **Password-less**: No password storage (delegated to Google)

### ✅ Infrastructure
- **HTTPS**: Required in production (Railway handles this)
- **Proxy trust**: Configured for Railway's reverse proxy
- **Graceful shutdown**: Proper database connection cleanup
- **Error handling**: Errors logged without exposing internals to clients

## Security Checklist

### ✅ Completed
- [x] Google OAuth 2.0 authentication
- [x] Session-based auth with secure cookies
- [x] Rate limiting (general + auth-specific)
- [x] Helmet.js security headers
- [x] CORS configuration with whitelist
- [x] Input validation on critical endpoints
- [x] HttpOnly and Secure cookies
- [x] SameSite cookie attribute
- [x] SQL injection prevention (Prisma)
- [x] Error handling without info leakage

### 🔄 Recommended Next Steps (Optional)
- [ ] Implement token refresh logic for expired Google OAuth tokens
- [ ] Add CSRF tokens for state-changing operations
- [ ] Implement audit logging for sensitive operations
- [ ] Add database encryption at rest (Railway feature)
- [ ] Set up automated security scanning (Dependabot, Snyk)
- [ ] Add Content Security Policy (CSP) headers
- [ ] Implement API versioning
- [ ] Add webhook signature verification (if using webhooks)

## Environment Variables Security

### Critical Variables (Must Be Secure)
```bash
# Generate a strong SESSION_SECRET (32+ random characters)
SESSION_SECRET=your-super-secret-random-string-here

# Keep these secret - NEVER commit to git
GOOGLE_CLIENT_SECRET=...
ANTHROPIC_API_KEY=...
DATABASE_URL=...
```

### Generate Strong SESSION_SECRET
```bash
# On macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Security Best Practices

### 1. Environment Variables
- ✅ Use `.env` for secrets (already in `.gitignore`)
- ✅ Use different secrets for development and production
- ✅ Rotate secrets periodically (every 90 days recommended)
- ✅ Use Railway's environment variable management in production

### 2. Database
- ✅ Use Prisma ORM (prevents SQL injection)
- ✅ Limit database connection pooling
- ✅ Regular backups (Railway automated backups)
- ⚠️ Consider encrypting sensitive fields (access tokens)

### 3. API Keys
- ✅ Anthropic API key stored securely
- ✅ Google OAuth credentials stored securely
- ⚠️ Monitor API usage for anomalies
- ⚠️ Set up billing alerts

### 4. Authentication
- ✅ OAuth 2.0 (no password handling)
- ✅ Session expiry (24 hours)
- ✅ Rate limiting on auth endpoints
- ⚠️ Consider implementing token refresh
- ⚠️ Log failed authentication attempts

### 5. Frontend Security
- ✅ HTTPS only in production
- ✅ Credentials sent with requests
- ✅ No sensitive data in localStorage
- ⚠️ Consider adding CSP meta tags
- ⚠️ Implement request timeout handling

### 6. Monitoring & Logging
- ✅ Winston logger configured
- ✅ Error logging without sensitive data
- ⚠️ Set up production monitoring (Railway logs)
- ⚠️ Alert on unusual activity

## Common Security Threats & Mitigations

| Threat | Mitigation |
|--------|------------|
| **SQL Injection** | ✅ Prisma ORM parameterizes queries |
| **XSS (Cross-Site Scripting)** | ✅ HttpOnly cookies, Helmet headers |
| **CSRF (Cross-Site Request Forgery)** | ✅ SameSite cookies, CORS whitelist |
| **Brute Force Attacks** | ✅ Rate limiting on auth endpoints |
| **Session Hijacking** | ✅ Secure, HttpOnly, SameSite cookies |
| **Data Exposure** | ✅ Error handling, no stack traces to client |
| **DDoS** | ✅ Rate limiting, Railway infrastructure |
| **Man-in-the-Middle** | ✅ HTTPS required in production |

## Incident Response

### If You Suspect a Security Breach:

1. **Immediately**:
   - Rotate `SESSION_SECRET` in Railway
   - Revoke and regenerate OAuth credentials
   - Rotate `ANTHROPIC_API_KEY`
   - Check Railway logs for suspicious activity

2. **Investigate**:
   - Review access logs
   - Check for unusual database queries
   - Monitor API usage patterns

3. **Notify**:
   - Inform affected users if data was exposed
   - Report to Google if OAuth was compromised

4. **Fix**:
   - Patch the vulnerability
   - Deploy updated code
   - Force logout all sessions (clear sessions table)

## Security Testing

### Manual Testing
```bash
# Test rate limiting
for i in {1..10}; do curl http://localhost:3000/auth/user; done

# Test CORS
curl -H "Origin: http://evil.com" http://localhost:3000/api/buckets

# Test input validation
curl -X POST http://localhost:3000/api/buckets \
  -H "Content-Type: application/json" \
  -d '{"name": "<script>alert(1)</script>"}'
```

### Automated Testing (Recommended)
```bash
# Install security testing tools
npm install --save-dev helmet-csp snyk

# Run security audit
npm audit

# Use Snyk for vulnerability scanning
npx snyk test
```

## Compliance Notes

### Data Privacy
- **Gmail data**: Only stored with user consent via OAuth
- **Email content**: Stored in your database (ensure compliance with data protection laws)
- **User data**: Email addresses stored for authentication
- **Retention**: Emails persist until user deletes or account is closed

### GDPR Compliance (if applicable)
- [ ] Add user data export functionality
- [ ] Add account deletion functionality (cascade delete emails and buckets)
- [ ] Add privacy policy
- [ ] Add terms of service
- [ ] Implement data retention policies

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Google OAuth Security Best Practices](https://developers.google.com/identity/protocols/oauth2/best-practices)
- [Railway Security](https://docs.railway.app/reference/security)
- [Anthropic API Security](https://docs.anthropic.com/claude/reference/security)

## Contact

For security concerns or to report vulnerabilities, contact: [your-email@example.com]

---

**Last Updated**: 2026-02-06
**Security Audit**: Recommended every 6 months
