import { request, requestWithMessage } from './client';

export type SupportTicket = {
  id: string;
  _id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  source: string;
  priority: string;
  status: string;
  statusLabel: string;
  adminResponse: string;
  respondedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** POST /support with the app's "Raise a Dispute" shape; returns the ticket + confirmation message */
export function raiseDispute(issueType: string, description: string) {
  return requestWithMessage<{ ticket: SupportTicket }>('/support', {
    method: 'POST',
    body: { issueType, description },
  });
}

/** GET /support (own tickets) */
export function listTickets(page = 1, limit = 20) {
  return request<{
    tickets: SupportTicket[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>('/support', { query: { page, limit } });
}
