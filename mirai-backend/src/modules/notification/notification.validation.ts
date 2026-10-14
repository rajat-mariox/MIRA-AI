import { z } from 'zod';
import { paginationQuery } from '../../utils/pagination';
import { idParam, objectId } from '../../utils/validators';
import { NOTIFICATION_JOBS } from '../../jobs/notificationJobs';

export const listNotificationsQuery = z.object({ ...paginationQuery });
export const notificationIdParam = idParam('id');

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuery>;

/** POST /admin/notifications/run-job */
export const runJobSchema = z
  .object({
    job: z.enum(NOTIFICATION_JOBS),
    userId: objectId.optional(),
    force: z.boolean().default(false),
    /** IST "as of" date (YYYY-MM-DD): dedupe key + festival lookup (festivals of the next day). Default today. */
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
      .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date')
      .optional(),
  })
  .strict();
export type RunJobInput = z.infer<typeof runJobSchema>;
