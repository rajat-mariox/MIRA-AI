import { authApi, type ApiEnvelope } from "./authApi";

export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "closed";

/** A website contact-form submission (backend module `lead`). */
export interface Lead {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  source?: string;
  page?: string;
  referrer?: string;
  status: LeadStatus;
  notes?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LeadList {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: Partial<Record<LeadStatus | "total", number>>;
}

export const leadsApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeads: builder.query<ApiEnvelope<LeadList>, { page: number; limit: number; status?: string; search?: string }>({
      query: ({ page, limit, status, search }) => ({
        url: "/admin/leads",
        params: { page, limit, status: status || undefined, search: search || undefined },
      }),
      providesTags: [{ type: "Lead", id: "LIST" }],
    }),

    getLeadById: builder.query<ApiEnvelope<{ lead: Lead }>, string>({
      query: (id) => `/admin/leads/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Lead", id }],
    }),

    updateLead: builder.mutation<ApiEnvelope<{ lead: Lead }>, { id: string; status?: LeadStatus; notes?: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/leads/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Lead", id: "LIST" }, { type: "Lead", id }],
    }),

    deleteLead: builder.mutation<ApiEnvelope<undefined>, string>({
      query: (id) => ({ url: `/admin/leads/${id}`, method: "DELETE" }),
      // Only the list: re-fetching the deleted lead's detail would just 404.
      invalidatesTags: [{ type: "Lead", id: "LIST" }],
    }),
  }),
});

export const { useGetLeadsQuery, useGetLeadByIdQuery, useUpdateLeadMutation, useDeleteLeadMutation } = leadsApi;
