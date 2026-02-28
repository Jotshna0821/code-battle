// API Client for Backend Communication
const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

export interface ApiError {
  error: string;
  message?: string;
}

// Helper function to make authenticated API calls
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('idToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const url = `${BACKEND_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
  }

  return await response.json();
}

// Specific API endpoints
export const api = {
  // User endpoints
  user: {
    getMe: () => apiCall('/api/users/me'),
    updateProfile: (data: { name?: string; college?: string }) =>
      apiCall('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // Problems endpoints
  problems: {
    getToday: () => apiCall('/api/problems/today'),
    getAll: () => apiCall('/api/problems'),
    complete: (problemId: number) =>
      apiCall(`/api/problems/${problemId}/complete`, { method: 'POST' }),
  },

  // Streaks endpoints
  streaks: {
    getHistory: () => apiCall('/api/streaks/history'),
    getCurrent: () => apiCall('/api/streaks/current'),
  },

  // History endpoints
  history: {
    getHistory: () => apiCall('/api/history'),
    getStats: () => apiCall('/api/history/stats'),
  },

  // Leaderboard endpoints
  leaderboard: {
    getWeekly: () => apiCall('/api/leaderboard/weekly'),
    getAllTime: () => apiCall('/api/leaderboard/alltime'),
  },
};

export default api;
