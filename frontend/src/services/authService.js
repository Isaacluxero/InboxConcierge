import api from './api';

/**
 * Authentication service
 * Handles user authentication and session management
 */
export const authService = {
  /**
   * Get current authenticated user
   * @returns {Promise<Object>} User data and success status
   */
  getCurrentUser: async () => {
    const response = await api.get('/auth/user');
    return response.data;
  },

  /**
   * Logout current user
   * @returns {Promise<Object>} Logout response
   */
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  /**
   * Get Google OAuth URL for authentication
   * @returns {string} Google OAuth URL
   */
  getGoogleAuthUrl: () => {
    return `${api.defaults.baseURL}/auth/google`;
  }
};
