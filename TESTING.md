# Testing Guide - Inbox Concierge

## Overview

This project includes comprehensive test suites for both backend and frontend to ensure reliability, security, and maintainability.

## Test Coverage

### Backend Tests (Jest)
- ✅ **Auth Controller** - Authentication and authorization
- ✅ **Bucket Controller** - CRUD operations for email buckets
- ✅ **Analytics Service** - Email insights and metrics
- ✅ **Security** - Input validation, rate limiting, XSS/SQL injection prevention
- ✅ **Session Management** - Cookie security, CORS, environment variables

### Frontend Tests (Vitest)
- ✅ **App Component** - Auth flow and routing
- ✅ **Google Auth Button** - OAuth initiation
- ✅ **Smart Search Bar** - Search functionality and input handling

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode (during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests with UI (interactive)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Organization

### Backend (`backend/src/__tests__/`)
```
__tests__/
├── setup.js                # Test utilities and mocks
├── auth.test.js            # Authentication tests
├── bucket.test.js          # Bucket management tests
├── analytics.test.js       # Analytics service tests
└── security.test.js        # Security validation tests
```

### Frontend (`frontend/src/test/`)
```
test/
├── setup.js                     # Test configuration
├── App.test.jsx                 # App component tests
├── GoogleAuthButton.test.jsx    # Auth button tests
└── SmartSearchBar.test.jsx      # Search component tests
```

## What's Tested

### 🔐 Security Tests
- **Input Validation**
  - Bucket name length (1-50 characters)
  - Special character filtering (prevents XSS)
  - SQL injection pattern detection
  - Color format validation (hex colors)
  - Search query length limits (1-500 characters)

- **Rate Limiting**
  - General API: 100 requests per 15 minutes
  - Auth endpoints: 5 attempts per 15 minutes

- **Session Security**
  - Secure cookie configuration
  - HttpOnly flag enabled
  - SameSite attribute set
  - Session expiry limits

- **CORS**
  - Origin whitelist validation
  - Credentials handling

### 🔑 Authentication Tests
- User retrieval when authenticated
- 401 response when not authenticated
- Database error handling
- Logout functionality
- Session cleanup

### 📧 Bucket Tests
- List all user buckets with email counts
- Create new buckets with validation
- Update existing buckets
- Delete buckets (with protections for defaults)
- Duplicate name handling
- Default bucket restrictions

### 📊 Analytics Tests
- Bucket breakdown (email counts per bucket)
- Top senders calculation
- Email volume by day
- Recent activity retrieval
- Average emails per day
- Empty data handling

### 🎨 Frontend Component Tests
- **App Component**
  - Loading states
  - Auth flow (login/logout)
  - Route protection
  - Error handling

- **Google Auth Button**
  - Rendering
  - Click handlers
  - OAuth redirect

- **Smart Search Bar**
  - Input handling
  - Form submission
  - Empty query prevention
  - Loading states
  - Query trimming

## Test Examples

### Backend Example - Testing Auth
```javascript
it('should return user data when authenticated', async () => {
  const req = mockAuthRequest();
  const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

  mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

  await getCurrentUser(req, res);

  expect(res.json).toHaveBeenCalledWith({
    success: true,
    user: expect.objectContaining({ email: mockUser.email })
  });
});
```

### Frontend Example - Testing Search
```javascript
it('should call onSearch when form is submitted', async () => {
  const mockOnSearch = vi.fn();
  render(<SmartSearchBar onSearch={mockOnSearch} isLoading={false} />);

  await user.type(screen.getByPlaceholderText(/search/i), 'test query');
  await user.click(screen.getByRole('button'));

  expect(mockOnSearch).toHaveBeenCalledWith('test query');
});
```

## Coverage Goals

### Current Coverage (Target)
- Backend: Aim for >80% coverage
- Frontend: Aim for >70% coverage
- Security-critical paths: 100% coverage

### View Coverage Reports

After running tests with coverage:

**Backend:**
```bash
open backend/coverage/index.html
```

**Frontend:**
```bash
open frontend/coverage/index.html
```

## Writing New Tests

### Backend Test Template
```javascript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { mockAuthRequest, mockPrismaClient } from './setup.js';

describe('Your Feature', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockAuthRequest();
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  it('should do something', async () => {
    // Arrange
    mockPrismaClient.yourModel.yourMethod.mockResolvedValue(data);

    // Act
    await yourFunction(req, res);

    // Assert
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});
```

### Frontend Test Template
```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import YourComponent from './YourComponent';

describe('YourComponent', () => {
  it('should render', () => {
    render(<YourComponent />);
    expect(screen.getByText(/expected text/i)).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    const mockHandler = vi.fn();

    render(<YourComponent onAction={mockHandler} />);

    await user.click(screen.getByRole('button'));

    expect(mockHandler).toHaveBeenCalled();
  });
});
```

## Continuous Integration

### GitHub Actions (Recommended)
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Test Backend
        run: |
          cd backend
          npm ci
          npm test

      - name: Test Frontend
        run: |
          cd frontend
          npm ci
          npm test
```

## Mocking Strategy

### Backend Mocks
- **Prisma Client**: Mocked to avoid real database calls
- **Gmail API**: Mocked to avoid quota usage
- **Claude API**: Mocked for deterministic tests
- **Environment Variables**: Set in test setup

### Frontend Mocks
- **Auth Service**: Mocked API calls
- **React Query**: Configured with retry: false for tests
- **Window APIs**: matchMedia, location mocked

## Best Practices

### ✅ Do's
- Test user-facing behavior, not implementation details
- Use descriptive test names ("should return 401 when not authenticated")
- Mock external dependencies (APIs, databases)
- Test error paths and edge cases
- Keep tests isolated and independent
- Use setup/teardown to clean state

### ❌ Don'ts
- Don't test third-party libraries
- Don't make real API calls in tests
- Don't use production environment variables
- Don't skip error handling tests
- Don't test only happy paths
- Don't couple tests to implementation

## Debugging Tests

### Backend
```bash
# Run a specific test file
npm test auth.test.js

# Run tests matching a pattern
npm test -- -t "should return user data"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Frontend
```bash
# Run a specific test file
npm test SmartSearchBar.test.jsx

# Run tests matching a pattern
npm test -- -t "should call onSearch"

# Open UI for debugging
npm run test:ui
```

## Security Testing

### What We Test
- XSS prevention (input sanitization)
- SQL injection prevention (though Prisma handles this)
- Rate limiting configuration
- Session security settings
- CORS configuration
- Environment variable requirements

### Manual Security Testing
```bash
# Test rate limiting
for i in {1..10}; do curl http://localhost:3000/auth/user; done

# Test input validation
curl -X POST http://localhost:3000/api/buckets \
  -H "Content-Type: application/json" \
  -d '{"name": "<script>alert(1)</script>"}'

# Test CORS
curl -H "Origin: http://evil.com" http://localhost:3000/api/buckets
```

## Performance Testing (Future)

Consider adding:
- Load testing (Artillery, k6)
- E2E testing (Playwright, Cypress)
- Visual regression testing (Percy, Chromatic)
- API contract testing (Pact)

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://testingjavascript.com/)

---

**Happy Testing! 🧪**

Run tests before every commit and maintain high coverage for a robust application.
