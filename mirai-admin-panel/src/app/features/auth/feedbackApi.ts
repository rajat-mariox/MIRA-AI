import { authApi, type ApiEnvelope } from "./authApi";

export interface Feedback {
  _id: string;
  id?: string;
  message: string;
  rating: number;
  platform?: string | null;
  appVersion?: string | null;
  createdAt: string;
  user: { _id?: string; id?: string; name?: string; email?: string; phone?: string };
}

export interface FeedbackStats {
  totalRatings: number;
  averageRating: number;
  distribution: Record<string, number>;
}

export interface FeedbackList {
  feedback: Feedback[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: FeedbackStats;
}

export const feedbackApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllFeedback: builder.query<
      ApiEnvelope<FeedbackList>,
      { page: number; limit: number; rating?: number; search?: string }
    >({
      query: ({ page, limit, rating, search }) => ({
        url: "/admin/feedback",
        params: { page, limit, rating: rating || undefined, search: search || undefined },
      }),
      providesTags: ["Feedback"],
    }),
  }),
});

export const { useGetAllFeedbackQuery } = feedbackApi;
