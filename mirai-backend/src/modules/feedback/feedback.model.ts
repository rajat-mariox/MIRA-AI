import { Schema, model, type InferSchemaType } from 'mongoose';
import { withIdJSON } from '../../utils/idTransform';

const feedbackSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5, index: true },
    /** Optional free text ("Share your thoughts"); empty for a stars-only rating. */
    message: { type: String, trim: true, default: '' },
    platform: { type: String, enum: ['ios', 'android', 'web'] },
    appVersion: { type: String, trim: true },
  },
  { timestamps: true, versionKey: false },
);

feedbackSchema.index({ createdAt: -1 });
withIdJSON(feedbackSchema);

export type FeedbackAttrs = InferSchemaType<typeof feedbackSchema>;
export const Feedback = model('Feedback', feedbackSchema);
export type FeedbackDocument = InstanceType<typeof Feedback>;
