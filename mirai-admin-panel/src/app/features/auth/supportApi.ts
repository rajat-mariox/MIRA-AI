import { authApi, type ApiEnvelope } from "./authApi";

export type TicketStatus = "open" | "in-progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface SupportTicket {
  _id: string;
  id?: string;
  ticketNumber?: string;
  subject: string;
  description: string;
  category?: string;
  source?: string;
  status: TicketStatus;
  priority: TicketPriority;
  adminResponse?: string;
  respondedAt?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  user: { _id?: string; id?: string; name?: string; email?: string; phone?: string };
}

export interface SupportList {
  tickets: SupportTicket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: Partial<Record<TicketStatus | "total", number>>;
}

export const supportApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllSupport: builder.query<
      ApiEnvelope<SupportList>,
      { page: number; limit: number; status?: string; priority?: string; search?: string }
    >({
      query: ({ page, limit, status, priority, search }) => ({
        url: "/admin/support",
        params: {
          page,
          limit,
          status: status || undefined,
          priority: priority || undefined,
          search: search || undefined,
        },
      }),
      providesTags: ["Support"],
    }),

    /** Detail returns the ticket directly in `data`. */
    getSupportById: builder.query<ApiEnvelope<SupportTicket>, string>({
      query: (id) => `/admin/support/${id}`,
      providesTags: ["Support"],
    }),

    updateSupport: builder.mutation<
      ApiEnvelope<SupportTicket>,
      { id: string; status?: TicketStatus; priority?: TicketPriority; adminResponse?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/admin/support/${id}`, method: "PUT", body }),
      invalidatesTags: ["Support"],
    }),
  }),
});

export const { useGetAllSupportQuery, useGetSupportByIdQuery, useUpdateSupportMutation } = supportApi;
