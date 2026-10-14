import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import * as walletService from './wallet.service';
import type { AdminListTransactionsQuery, DebitInput, ListTransactionsQuery, RechargeInput } from './wallet.validation';

// User handlers run behind requireAuth, so req.user is always set.

export async function getDashboard(req: Request, res: Response) {
  const data = await walletService.getDashboard(String(req.user!._id), req.lang);
  return sendSuccess(res, 200, 'wallet.fetched', data);
}

export async function listTransactions(req: Request, res: Response) {
  const data = await walletService.listTransactions(
    String(req.user!._id),
    req.lang,
    req.query as unknown as ListTransactionsQuery,
  );
  return sendSuccess(res, 200, 'wallet.transactionsFetched', data);
}

export async function recharge(req: Request, res: Response) {
  const data = await walletService.recharge(String(req.user!._id), req.lang, req.body as RechargeInput);
  return sendSuccess(res, 201, 'wallet.recharged', data, { amount: data.transaction.amountText.replace(/^\+/, '') });
}

export async function debit(req: Request, res: Response) {
  const data = await walletService.debit(String(req.user!._id), req.lang, req.body as DebitInput);
  return sendSuccess(res, 201, 'wallet.debited', data);
}

export async function adminList(req: Request, res: Response) {
  const data = await walletService.adminListTransactions(req.query as unknown as AdminListTransactionsQuery);
  return sendSuccess(res, 200, 'wallet.ordersFetched', data);
}

export async function adminGet(req: Request, res: Response) {
  const order = await walletService.adminGetTransaction(String(req.params.id));
  // Panel reads data.transaction ?? data.order ?? data
  return sendSuccess(res, 200, 'wallet.orderFetched', { transaction: order, order });
}
