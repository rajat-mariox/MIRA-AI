import api from './api';
import type { ApiResponse } from './admin.service';
import type { AuthUser } from '../app/features/auth/authSlice';

export type AdminLoginData = { token: string; accessToken?: string; user: AuthUser; admin?: AuthUser };

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post<ApiResponse<AdminLoginData>>('/admin/login', { email, password });
    return response.data;
  },

  /** Always 200 (does not reveal whether the email is an admin); the OTP is logged by the backend in dev. */
  forgotPassword: async (email: string) => {
    const response = await api.post<ApiResponse<undefined>>('/admin/forgot-password', { email });
    return response.data;
  },

  verifyOtp: async (email: string, otp: string) => {
    const response = await api.post<ApiResponse<{ verified: boolean }>>('/admin/verify-otp', { email, otp });
    return response.data;
  },

  resetPassword: async (email: string, otp: string, password: string) => {
    const response = await api.post<ApiResponse<undefined>>('/admin/reset-password', { email, otp, password });
    return response.data;
  },
};
