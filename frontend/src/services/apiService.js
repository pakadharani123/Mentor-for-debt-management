import client from '../api/client';

const apiService = {
  // Authentication
  auth: {
    register: async (data) => {
      const res = await client.post('/api/auth/register', data);
      return res.data;
    },
    login: async (data) => {
      const res = await client.post('/api/auth/login', data);
      return res.data;
    },
    getProfile: async () => {
      const res = await client.get('/api/auth/profile');
      return res.data;
    }
  },

  // Financial Profile
  profile: {
    get: async () => {
      const res = await client.get('/api/profile');
      return res.data;
    },
    create: async (data) => {
      const res = await client.post('/api/profile', data);
      return res.data;
    },
    update: async (data) => {
      const res = await client.put('/api/profile', data);
      return res.data;
    }
  },

  // Loans Management
  loans: {
    getAll: async () => {
      const res = await client.get('/api/loans');
      return res.data;
    },
    getById: async (id) => {
      const res = await client.get(`/api/loans/${id}`);
      return res.data;
    },
    create: async (data) => {
      const res = await client.post('/api/loans', data);
      return res.data;
    },
    update: async (id, data) => {
      const res = await client.put(`/api/loans/${id}`, data);
      return res.data;
    },
    delete: async (id) => {
      const res = await client.delete(`/api/loans/${id}`);
      return res.data;
    }
  },

  // Expenses Tracker
  expenses: {
    getAll: async (params = {}) => {
      const res = await client.get('/api/expenses', { params });
      return res.data;
    },
    create: async (data) => {
      const res = await client.post('/api/expenses', data);
      return res.data;
    },
    update: async (id, data) => {
      const res = await client.put(`/api/expenses/${id}`, data);
      return res.data;
    },
    markAsPaid: async (id, data = {}) => {
      const res = await client.patch(`/api/expenses/${id}/mark-paid`, data);
      return res.data;
    },
    delete: async (id) => {
      const res = await client.delete(`/api/expenses/${id}`);
      return res.data;
    }
  },

  // Core Analytics & Score
  dashboard: {
    getMetrics: async () => {
      const res = await client.get('/api/dashboard');
      return res.data;
    }
  },
  repayment: {
    getPlans: async () => {
      const res = await client.get('/api/debt-plan');
      return res.data;
    }
  },
  recoveryScore: {
    get: async () => {
      const res = await client.get('/api/recovery-score');
      return res.data;
    }
  },
  forecast: {
    get: async () => {
      const res = await client.get('/api/forecast');
      return res.data;
    }
  },
  simulator: {
    run: async (data) => {
      const res = await client.post('/api/simulator', data);
      return res.data;
    }
  },

  // Charting Data
  analytics: {
    getDebtTrend: async () => {
      const res = await client.get('/api/analytics/debt-trend');
      return res.data;
    },
    getExpenseBreakdown: async () => {
      const res = await client.get('/api/analytics/expense-breakdown');
      return res.data;
    },
    getPayoffForecast: async () => {
      const res = await client.get('/api/analytics/payoff-forecast');
      return res.data;
    },
    getHealthHistory: async () => {
      const res = await client.get('/api/analytics/financial-health-history');
      return res.data;
    }
  },

  // AI Coaching Assistant
  ai: {
    getAdvice: async (data = {}) => {
      const res = await client.post('/api/ai/advice', data);
      return res.data;
    },
    getHistory: async (params = {}) => {
      const res = await client.get('/api/ai/history', { params });
      return res.data;
    },
    getHistoryById: async (id) => {
      const res = await client.get(`/api/ai/history/${id}`);
      return res.data;
    },
    renameHistory: async (id, title) => {
      const res = await client.put(`/api/ai/history/${id}`, { title });
      return res.data;
    },
    deleteHistory: async (id) => {
      const res = await client.delete(`/api/ai/history/${id}`);
      return res.data;
    },
    clearHistory: async () => {
      const res = await client.delete('/api/ai/history');
      return res.data;
    }
  },

  // Bonus/Extra elements
  bonus: {
    getEmergencyPlanner: async () => {
      const res = await client.get('/api/bonus/emergency-fund-planner');
      return res.data;
    },
    getSavingsGoals: async () => {
      const res = await client.get('/api/bonus/savings-goals');
      return res.data;
    },
    createSavingsGoal: async (data) => {
      const res = await client.post('/api/bonus/savings-goals', data);
      return res.data;
    },
    updateSavingsGoal: async (id, data) => {
      const res = await client.put(`/api/bonus/savings-goals/${id}`, data);
      return res.data;
    },
    deleteSavingsGoal: async (id) => {
      const res = await client.delete(`/api/bonus/savings-goals/${id}`);
      return res.data;
    },
    getPdfReportUrl: () => {
      // Returns the direct backend link for downloads (auth is handled via token or we can initiate it via window.open)
      // Since it's a download, we pass the authToken as a query param or request it as a blob
      return '/api/bonus/report/pdf';
    }
  },

  // Admin Dashboard Services
  admin: {
    getDashboard: async () => {
      const res = await client.get('/api/admin/dashboard');
      return res.data;
    },
    getUsers: async () => {
      const res = await client.get('/api/admin/users');
      return res.data;
    },
    getFinancialSummary: async () => {
      const res = await client.get('/api/admin/financial-summary');
      return res.data;
    },
    resetLoginLocks: async () => {
      const res = await client.post('/api/admin/reset-login-locks');
      return res.data;
    }
  }
};

export default apiService;
