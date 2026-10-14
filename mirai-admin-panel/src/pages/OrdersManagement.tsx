import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Eye, ReceiptText } from "lucide-react";

import OrderDetailsModal from "../components/orders/OrderDetailsModal";
import {
  useGetAllOrdersQuery,
  type Order,
} from "../app/features/auth/ordersApi";
import { getErrorMessage } from "../lib/errors";

const PAGE_LIMIT = 10;

const OrdersManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, error } = useGetAllOrdersQuery({
    page,
    limit: PAGE_LIMIT,
  });

  const orders: Order[] = data?.data?.orders ?? [];
  const total = data?.data?.total ?? orders.length;
  const totalPages = Math.max(1, data?.data?.totalPages ?? Math.ceil(total / PAGE_LIMIT));
  const summary = data?.data?.summary;
  const sym = summary?.currencySymbol ?? "₹";
  const money = (n: number) => `${sym}${n.toLocaleString("en-IN")}`;

  const openDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return <div className="text-white text-center mt-20">Loading Orders...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-20">Failed to load orders: {getErrorMessage(error)}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Orders Management</h1>
          <p className="text-white/40 mt-1">View and manage customer transactions.</p>
        </div>
        <div className="px-5 py-3 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20">
          <p className="text-brand-cyan font-semibold">Total Orders : {total}</p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="glass-card rounded-2xl border border-white/5 p-5">
            <p className="text-white/40 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-brand-cyan mt-1">{money(summary.totalRevenue)}</p>
            <p className="text-white/30 text-xs mt-1">{summary.totalRecharges} wallet recharges</p>
          </div>
          <div className="glass-card rounded-2xl border border-white/5 p-5">
            <p className="text-white/40 text-sm">Today's Revenue</p>
            <p className="text-2xl font-bold text-white mt-1">{money(summary.todayRevenue)}</p>
            <p className="text-white/30 text-xs mt-1">{summary.todayRecharges} recharges today</p>
          </div>
          <div className="glass-card rounded-2xl border border-white/5 p-5">
            <p className="text-white/40 text-sm">Spent from Wallets</p>
            <p className="text-2xl font-bold text-white mt-1">{money(summary.totalSpent)}</p>
            <p className="text-white/30 text-xs mt-1">{summary.totalDebits} debits</p>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="glass-card rounded-3xl border border-white/5 p-12 flex flex-col items-center">
          <ReceiptText size={70} className="text-white/20" />
          <h2 className="text-white text-xl font-semibold mt-5">No Orders Found</h2>
        </div>
      ) : (
        <div className="glass-card rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-white/10 bg-white/[0.02]">
                <tr className="text-white/40 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.03] transition">
                    <td className="px-6 py-5">
                      <p className="text-white font-semibold">{order.userId?.fullName ?? "N/A"}</p>
                      <p className="text-white/40 text-sm mt-1">{order.userId?.email ?? "N/A"}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-white/80 font-medium">{order.title}</p>
                      <p className="text-white/40 text-sm capitalize mt-1">{order.purpose}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-brand-cyan font-bold">₹{order.amount}</p>
                      <span className="text-xs text-white/40 capitalize">
                        {order.type}
                        {order.status && order.status !== "success" ? ` · ${order.status}` : ""}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold uppercase">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-white/60 text-sm">
                      {new Date(order.transactionDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-5">
                      <button
                        onClick={() => openDetails(order)}
                        className="mx-auto w-10 h-10 rounded-xl bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan flex items-center justify-center transition"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage((current) => current - 1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition"
          >
            <ChevronLeft size={18} /> Previous
          </button>
          {Array.from({ length: totalPages }, (_, index) => {
            const pageNumber = index + 1;

            return (
              <button
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
                className={`w-11 h-11 rounded-xl font-semibold transition ${
                  page === pageNumber
                    ? "bg-brand-cyan text-dark-bg"
                    : "bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                {pageNumber}
              </button>
            );
          })}
          <button
            disabled={page === totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition"
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      )}

      <OrderDetailsModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
};

export default OrdersManagement;
