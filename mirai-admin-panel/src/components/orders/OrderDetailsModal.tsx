import React from "react";
import { Calendar, CreditCard, Mail, User, X } from "lucide-react";

import {
  useGetOrderByIdQuery,
  type Order,
} from "../../app/features/auth/ordersApi";

interface OrderDetailsModalProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  open,
  onClose,
  order,
}) => {
  const { data, isLoading, error } = useGetOrderByIdQuery(order?.id ?? "", {
    skip: !open || !order,
  });

  const orderDetails: Order | null =
    data?.data?.transaction ?? data?.data?.order ?? order;

  if (!open || !order) return null;

  return (
    <div className="fixed inset-0 !mt-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
      <div className="w-full max-w-3xl max-h-[calc(100vh-40px)] rounded-3xl bg-[#16181D] border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">Order Details</h2>
            <p className="text-white/40 text-sm mt-1">Transaction information</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <p className="text-white/60 text-center py-12">Loading order details...</p>
          ) : error || !orderDetails ? (
            <p className="text-red-400 text-center py-12">Failed to load order details.</p>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <User className="text-brand-cyan" />
                  <div>
                    <p className="text-white/40 text-sm">Customer</p>
                    <p className="text-white font-semibold">{orderDetails.userId?.fullName ?? "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="text-brand-cyan" />
                  <div>
                    <p className="text-white/40 text-sm">Email</p>
                    <p className="text-white font-semibold">{orderDetails.userId?.email ?? "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="text-brand-cyan" />
                  <div>
                    <p className="text-white/40 text-sm">Payment Method</p>
                    <p className="text-white font-semibold uppercase">{orderDetails.paymentMethod}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="text-brand-cyan" />
                  <div>
                    <p className="text-white/40 text-sm">Transaction Date</p>
                    <p className="text-white font-semibold">
                      {new Date(orderDetails.transactionDate).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                  <p className="text-white/40 text-sm">Amount</p>
                  <p className="text-2xl font-bold text-brand-cyan mt-2">₹{orderDetails.amount}</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                  <p className="text-white/40 text-sm">Type</p>
                  <p className="text-white font-semibold capitalize mt-2">{orderDetails.type}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3">
                <div>
                  <p className="text-white/40 text-sm">Title</p>
                  <p className="text-white font-semibold mt-1">{orderDetails.title}</p>
                </div>
                <div>
                  <p className="text-white/40 text-sm">Purpose</p>
                  <p className="text-white/70 capitalize mt-1">{orderDetails.purpose}</p>
                </div>
                <div>
                  <p className="text-white/40 text-sm">Description</p>
                  <p className="text-white/70 mt-1">{orderDetails.description || "N/A"}</p>
                </div>
                <div>
                  <p className="text-white/40 text-sm">Status</p>
                  <p className="text-white/70 capitalize mt-1">{orderDetails.status ?? "success"}</p>
                </div>
                {orderDetails.paymentRef ? (
                  <div>
                    <p className="text-white/40 text-sm">Payment Reference</p>
                    <p className="text-white/70 mt-1 break-all">
                      {orderDetails.paymentRef}
                      {orderDetails.cardLast4 ? ` (card •••• ${orderDetails.cardLast4})` : ""}
                    </p>
                  </div>
                ) : null}
                {orderDetails.balanceAfter !== null && orderDetails.balanceAfter !== undefined ? (
                  <div>
                    <p className="text-white/40 text-sm">Wallet Balance After</p>
                    <p className="text-white/70 mt-1">₹{orderDetails.balanceAfter}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-white/40 text-sm">Transaction ID</p>
                  <p className="text-white/70 mt-1 break-all">{orderDetails.id}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 px-8 py-6 flex justify-end shrink-0">
          <button onClick={onClose} className="px-6 py-3 rounded-xl bg-brand-cyan text-dark-bg font-semibold">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
