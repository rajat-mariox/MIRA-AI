import { requestWithMessage } from './client';

export type Feedback = { id: string; _id: string; rating: number; message: string; createdAt: string };

/** POST /feedback: `promptStoreReview` tells the app to suggest a Play Store review */
export function sendFeedback(rating: number, thoughts?: string) {
  return requestWithMessage<{ feedback: Feedback; promptStoreReview: boolean }>('/feedback', {
    method: 'POST',
    body: { rating, ...(thoughts ? { thoughts } : {}) },
  });
}
