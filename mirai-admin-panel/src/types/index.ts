import type { ApiPlan } from '../services/plan.service';

/** Plan row as displayed by the Plans page (mapped from the backend's ApiPlan). */
export interface Plan {
  id: string;
  packageName: string;
  numberOfQuestions: number;
  priceINR: number;
  status: 'Active' | 'Inactive';
  createdAt: string;
  /** The backend document (keeps fields the form does not edit). */
  raw?: ApiPlan;
}
