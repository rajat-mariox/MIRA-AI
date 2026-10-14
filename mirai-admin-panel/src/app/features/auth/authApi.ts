import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { getToken, handleUnauthorized } from "../../../lib/session";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

/** Same 401 behaviour as the axios client: clear the session and redirect to /login. */
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extra) => {
  const result = await rawBaseQuery(args, api, extra);
  if (result.error?.status === 401) handleUnauthorized();
  return result;
};

/** Root RTK Query API; feature files add endpoints with `authApi.injectEndpoints`. */
export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery,
  tagTypes: ["Banner", "Cms", "Faq", "Feedback", "Support", "Order", "Lead", "Profile"],
  endpoints: (builder) => ({
    getProfile: builder.query<ApiEnvelope<{ admin: AdminProfile; user: AdminProfile }>, void>({
      query: () => "/admin/profile",
      providesTags: ["Profile"],
    }),
  }),
});

export interface ApiEnvelope<T> {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: T;
}

export interface AdminProfile {
  id: string;
  _id: string;
  name: string;
  fullName?: string;
  email: string;
  role: string;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const { useGetProfileQuery } = authApi;
