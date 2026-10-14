import { authApi, type ApiEnvelope } from "./authApi";

export type CmsType = "terms" | "privacy" | "about";

export interface CMSItem {
  _id: string;
  id?: string;
  type: CmsType;
  title?: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const cmsApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllCMS: builder.query<ApiEnvelope<CMSItem[]>, void>({
      query: () => "/admin/cms",
      providesTags: ["Cms"],
    }),

    updateCMS: builder.mutation<ApiEnvelope<CMSItem>, { id: string; content: string }>({
      query: ({ id, content }) => ({ url: `/admin/cms/${id}`, method: "PUT", body: { content } }),
      invalidatesTags: ["Cms"],
    }),

    /** POST /admin/cms upserts by `type`, so it also works when the page does not exist yet. */
    upsertCMS: builder.mutation<
      ApiEnvelope<CMSItem>,
      { type: CmsType; content: string; title?: string; isActive?: boolean }
    >({
      query: (body) => ({ url: "/admin/cms", method: "POST", body }),
      invalidatesTags: ["Cms"],
    }),

    deleteCMS: builder.mutation<ApiEnvelope<undefined>, string>({
      query: (id) => ({ url: `/admin/cms/${id}`, method: "DELETE" }),
      invalidatesTags: ["Cms"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetAllCMSQuery, useUpdateCMSMutation, useUpsertCMSMutation, useDeleteCMSMutation } = cmsApi;
