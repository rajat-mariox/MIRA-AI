import { authApi, type ApiEnvelope } from "./authApi";

export interface Banner {
  id: string;
  _id?: string;
  title: string;
  subtitle?: string;
  /** CTA label (backend default "View Today"). */
  buttonText?: string;
  /** Absolute URL or server-relative `/uploads/...` path (see lib/media.ts). */
  imageUrl: string;
  link: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export type BannerInput = Pick<Banner, "title" | "imageUrl" | "link" | "isActive" | "order"> & {
  subtitle: string;
  buttonText: string;
};

export interface UploadedFile {
  url: string;
  /** Server-relative `/uploads/...` path (local storage) or the same absolute URL (S3). */
  path?: string;
  key: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  storage?: string;
}

export const bannerApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllBanners: builder.query<ApiEnvelope<{ banners: Banner[]; total: number }>, void>({
      query: () => "/admin/banners",
      providesTags: ["Banner"],
    }),

    getBannerById: builder.query<ApiEnvelope<{ banner: Banner }>, string>({
      query: (id) => `/admin/banners/${id}`,
      providesTags: ["Banner"],
    }),

    createBanner: builder.mutation<ApiEnvelope<{ banner: Banner }>, BannerInput>({
      query: (body) => ({ url: "/admin/banners", method: "POST", body }),
      invalidatesTags: ["Banner"],
    }),

    updateBanner: builder.mutation<ApiEnvelope<{ banner: Banner }>, Partial<BannerInput> & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/banners/${id}`, method: "PUT", body }),
      invalidatesTags: ["Banner"],
    }),

    deleteBanner: builder.mutation<ApiEnvelope<undefined>, string>({
      query: (id) => ({ url: `/admin/banners/${id}`, method: "DELETE" }),
      invalidatesTags: ["Banner"],
    }),

    /** POST /media/upload (multipart, field `images`) with the admin token -> `urls` (absolute) + `paths` (relative, preferred for storing). */
    uploadImages: builder.mutation<ApiEnvelope<{ urls: string[]; paths?: string[]; files: UploadedFile[] }>, File[]>({
      query: (files) => {
        const form = new FormData();
        files.forEach((f) => form.append("images", f));
        return { url: "/media/upload", method: "POST", body: form };
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllBannersQuery,
  useGetBannerByIdQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  useUploadImagesMutation,
} = bannerApi;
