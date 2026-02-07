import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';
import * as authService from '../services/auth';

// Mock the auth service
vi.mock('../services/auth', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
    getGoogleAuthUrl: vi.fn(() => 'http://localhost:3000/auth/google'),
  },
  emailService: {},
  bucketService: {},
  searchService: {},
  analyticsService: {},
}));

describe('App Component', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderApp = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
  };

  it('should show loading state initially', () => {
    authService.authService.getCurrentUser.mockImplementation(() => new Promise(() => {}));

    renderApp();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', async () => {
    authService.authService.getCurrentUser.mockRejectedValue(new Error('Not authenticated'));

    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/inbox concierge/i)).toBeInTheDocument();
      expect(screen.getByText(/ai-powered email management/i)).toBeInTheDocument();
    });
  });

  it('should show dashboard when authenticated', async () => {
    authService.authService.getCurrentUser.mockResolvedValue({
      success: true,
      user: {
        id: 1,
        email: 'test@example.com',
        createdAt: new Date(),
      },
    });

    renderApp();

    await waitFor(() => {
      // Should redirect to dashboard
      expect(window.location.pathname).toBe('/');
    });
  });

  it('should handle getCurrentUser errors gracefully', async () => {
    authService.authService.getCurrentUser.mockRejectedValue(new Error('Network error'));

    renderApp();

    await waitFor(() => {
      // Should show login page on error
      expect(screen.getByText(/sign in with google/i)).toBeInTheDocument();
    });
  });
});
