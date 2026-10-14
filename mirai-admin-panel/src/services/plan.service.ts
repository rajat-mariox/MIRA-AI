import api from './api';
import type { ApiResponse } from './admin.service';

/** Plan as stored by the backend (GET /admin/plans -> data.plans). */
export interface ApiPlan {
  id: string;
  _id?: string;
  title: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  currencySymbol?: string;
  validityText?: string;
  featureHighlight?: string;
  badge?: string;
  icon?: string;
  actionText?: string;
  planType?: string;
  questionCount?: number;
  validityValue?: number;
  validityUnit?: string;
  isActive: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type PlanInput = Partial<Omit<ApiPlan, 'id' | '_id' | 'createdAt' | 'updatedAt'>>;

export const planService = {
  getPlans: async (): Promise<ApiPlan[]> => {
    const response = await api.get<ApiResponse<{ plans: ApiPlan[]; total: number }>>('/admin/plans');
    return response.data.data?.plans ?? [];
  },

  createPlan: async (data: PlanInput & { title: string; price: number }) => {
    const response = await api.post<ApiResponse<{ plan: ApiPlan }>>('/admin/plans', data);
    return response.data.data.plan;
  },

  /** Partial update: send only the fields that changed. */
  updatePlan: async (id: string, data: PlanInput) => {
    const response = await api.patch<ApiResponse<{ plan: ApiPlan }>>(`/admin/plans/${id}`, data);
    return response.data.data.plan;
  },

  deletePlan: async (id: string) => {
    const response = await api.delete<ApiResponse<undefined>>(`/admin/plans/${id}`);
    return response.data;
  },
};
