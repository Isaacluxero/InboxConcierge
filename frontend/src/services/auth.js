import api from './api';

export const authService = {
  getCurrentUser: async () => {
    const response = await api.get('/auth/user');
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getGoogleAuthUrl: () => {
    return `${api.defaults.baseURL}/auth/google`;
  }
};

export const emailService = {
  syncEmails: async () => {
    const response = await api.post('/api/emails/sync');
    return response.data;
  },

  getEmails: async (params = {}) => {
    const response = await api.get('/api/emails', { params });
    return response.data;
  },

  getEmailById: async (id) => {
    const response = await api.get(`/api/emails/${id}`);
    return response.data;
  },

  updateEmailBucket: async (id, bucketId) => {
    const response = await api.patch(`/api/emails/${id}/bucket`, { bucketId });
    return response.data;
  }
};

export const bucketService = {
  getBuckets: async () => {
    const response = await api.get('/api/buckets');
    return response.data;
  },

  getBucketById: async (id) => {
    const response = await api.get(`/api/buckets/${id}`);
    return response.data;
  },

  createBucket: async (data) => {
    const response = await api.post('/api/buckets', data);
    return response.data;
  },

  updateBucket: async (id, data) => {
    const response = await api.patch(`/api/buckets/${id}`, data);
    return response.data;
  },

  deleteBucket: async (id) => {
    const response = await api.delete(`/api/buckets/${id}`);
    return response.data;
  },

  reclassifyEmails: async (bucketId) => {
    const response = await api.post('/api/buckets/reclassify', {}, {
      params: bucketId ? { bucketId } : {}
    });
    return response.data;
  }
};

export const searchService = {
  smartSearch: async (query) => {
    const response = await api.post('/api/search', { query });
    return response.data;
  },

  keywordSearch: async (query) => {
    const response = await api.get('/api/search/keyword', {
      params: { q: query }
    });
    return response.data;
  },

  generateEmbeddings: async () => {
    const response = await api.post('/api/search/embeddings');
    return response.data;
  }
};

export const analyticsService = {
  getInsights: async () => {
    const response = await api.get('/api/analytics/insights');
    return response.data;
  }
};
