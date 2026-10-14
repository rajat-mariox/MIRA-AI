import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import * as planService from './plan.service';
import { purchasePlan } from './chatSubscription.service';
import type { CreatePlanInput, ListPlansAdminQuery, UpdatePlanInput } from './plan.validation';

export async function listActive(_req: Request, res: Response) {
  const plans = await planService.listActivePlans();
  return sendSuccess(res, 200, 'plan.listFetched', { plans });
}

export async function purchase(req: Request, res: Response) {
  const data = await purchasePlan(String(req.user!._id), String(req.params.id));
  return sendSuccess(res, 201, 'plan.purchased', data, { title: data.subscription.title });
}

export async function adminList(req: Request, res: Response) {
  const data = await planService.adminList(req.query as unknown as ListPlansAdminQuery);
  return sendSuccess(res, 200, 'plan.listFetched', data);
}

export async function adminGet(req: Request, res: Response) {
  const plan = await planService.adminGet(String(req.params.id));
  return sendSuccess(res, 200, 'plan.fetched', { plan });
}

export async function adminCreate(req: Request, res: Response) {
  const plan = await planService.adminCreate(req.body as CreatePlanInput);
  return sendSuccess(res, 201, 'plan.created', { plan });
}

export async function adminUpdate(req: Request, res: Response) {
  const plan = await planService.adminUpdate(String(req.params.id), req.body as UpdatePlanInput);
  return sendSuccess(res, 200, 'plan.updated', { plan });
}

export async function adminDelete(req: Request, res: Response) {
  await planService.adminDelete(String(req.params.id));
  return sendSuccess(res, 200, 'plan.deleted');
}
