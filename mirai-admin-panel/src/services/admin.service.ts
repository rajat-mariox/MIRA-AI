import api from './api';

export type DashboardStats = {
  totalUsers: number;
  activeUsers: number;
  profileCompleteUsers: number;
  /** 0-100 */
  activePercentage: number;
  inactiveUsers?: number;
  profileCompletePercentage?: number;
  newUsersToday?: number;
  newUsersLast7Days?: number;
  newUsersLast30Days?: number;
  /** Device sessions active in the last 24h. */
  activeSessions24h?: number;
  dailyActiveUsers?: number;
  monthlyActiveUsers?: number;
  /** Sign-ups per UTC day, last 30 days, oldest first. */
  userGrowth?: Array<{ date: string; count: number }>;
  /** Successful wallet recharges. */
  revenue?: {
    currency: string;
    total: number;
    today: number;
    last30Days: number;
    transactions: number;
    daily: Array<{ date: string; amount: number }>;
  };
};

export type ApiResponse<T> = {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: T;
};

export type DashboardStatsResponse = ApiResponse<DashboardStats>;

export type TestNotificationInput = {
  userId: string;
  title: string;
  body: string;
  imageUrl?: string;
  /** App screen opened when the notification is tapped (sent to the app as data.screen). */
  screen?: string;
  data?: Record<string, string>;
};

export type TestNotificationResult = {
  tokens: number;
  successCount: number;
  failureCount: number;
  prunedTokens: number;
  /** id of the in-app notification the backend saved */
  notificationId?: string;
};

export const adminService = {
  getProfile: async () => {
    const response = await api.get<ApiResponse<{ admin: Record<string, unknown> }>>('/admin/profile');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<DashboardStatsResponse>('/admin/dashboard/stats');
    return response.data;
  },

  /** Push to every registered device of one user. 503 when Firebase is not configured on the server. */
  sendTestNotification: async (input: TestNotificationInput) => {
    const response = await api.post<ApiResponse<TestNotificationResult>>('/admin/users/test-notification', input);
    return response.data;
  },

  /** One broadcast: saved in every user's in-app inbox + pushed to every active user's devices. */
  sendBroadcastNotification: async (input: Omit<TestNotificationInput, 'userId'>) => {
    const response = await api.post<ApiResponse<TestNotificationResult>>('/admin/users/broadcast-notification', input);
    return response.data;
  },
};
