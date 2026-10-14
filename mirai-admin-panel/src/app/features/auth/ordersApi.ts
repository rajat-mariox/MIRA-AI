import { authApi, type ApiEnvelope } from "./authApi";

export interface OrderUser {
  email: string;
  fullName: string;
  id: string;
}

export interface Order {
  id: string;
  _id?: string;
  userId: OrderUser;
  amount: number;
  currency?: string;
  type: string;
  purpose: string;
  title: string;
  description: string;
  paymentMethod: string;
  paymentRef?: string | null;
  cardLast4?: string | null;
  status?: string;
  balanceAfter?: number | null;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersSummary {
  totalRevenue: number;
  totalRecharges: number;
  totalSpent: number;
  totalDebits: number;
  todayRevenue: number;
  todayRecharges: number;
  currencySymbol: string;
}

export interface OrdersList {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary?: OrdersSummary;
}

export const ordersApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllOrders: builder.query<ApiEnvelope<OrdersList>, { page: number; limit: number }>({
      query: ({ page, limit }) => ({ url: "/admin/transactions", params: { page, limit } }),
      providesTags: ["Order"],
    }),

    getOrderById: builder.query<ApiEnvelope<{ transaction: Order; order: Order }>, string>({
      query: (id) => `/admin/transactions/${id}`,
      providesTags: ["Order"],
    }),
  }),
});

export const { useGetAllOrdersQuery, useGetOrderByIdQuery } = ordersApi;
