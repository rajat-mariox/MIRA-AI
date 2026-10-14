import { authApi, type ApiEnvelope } from "./authApi";

export interface FAQ {
  _id: string;
  id?: string;
  question: string;
  answer: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export type FAQInput = Pick<FAQ, "question" | "answer" | "isActive" | "order">;

export const faqApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllFAQ: builder.query<ApiEnvelope<FAQ[]>, void>({
      query: () => "/admin/faq",
      providesTags: ["Faq"],
    }),

    getFAQById: builder.query<ApiEnvelope<FAQ>, string>({
      query: (id) => `/admin/faq/${id}`,
      providesTags: ["Faq"],
    }),

    createFAQ: builder.mutation<ApiEnvelope<FAQ>, FAQInput>({
      query: (body) => ({ url: "/admin/faq", method: "POST", body }),
      invalidatesTags: ["Faq"],
    }),

    updateFAQ: builder.mutation<ApiEnvelope<FAQ>, Partial<FAQInput> & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/faq/${id}`, method: "PUT", body }),
      invalidatesTags: ["Faq"],
    }),

    deleteFAQ: builder.mutation<ApiEnvelope<undefined>, string>({
      query: (id) => ({ url: `/admin/faq/${id}`, method: "DELETE" }),
      invalidatesTags: ["Faq"],
    }),
  }),
});

export const {
  useGetAllFAQQuery,
  useGetFAQByIdQuery,
  useCreateFAQMutation,
  useUpdateFAQMutation,
  useDeleteFAQMutation,
} = faqApi;
