import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Order } from "../lib/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-[#f1f0ec] text-black",
  paid: "bg-black text-white",
  payment_failed: "bg-red-50 text-red-600",
  cancelled: "bg-[#f5f5f3] text-black/60",
};

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Order[]>("/orders/me").then(setOrders).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="p-8 text-center text-black/50">Loading orders...</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-black/10 bg-white p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/45">Orders</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.07em] text-black">No orders yet</h1>
          <p className="mt-3 text-black/60">Your purchase history will appear here once you place an order.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/45">Account</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.08em] text-black">My orders</h1>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="rounded-[22px] border border-black/10 bg-white p-4 shadow-[0_12px_36px_rgba(0,0,0,0.04)] sm:p-5">
            <div className="flex flex-col gap-3 border-b border-black/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45">Order</p>
                <code className="mt-1 block text-xs text-black/55">{order.id}</code>
              </div>

              <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${STATUS_STYLES[order.status]}`}>
                {order.status.replace("_", " ")}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {order.items.map((item) => (
                <div key={`${order.id}-${item.product_id}`} className="flex items-center justify-between gap-3 text-sm text-black/70">
                  <span>
                    {item.product_name} <span className="text-black/45">x{item.quantity}</span>
                  </span>
                  <span className="font-medium text-black">${((item.unit_price_cents * item.quantity) / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4 text-sm font-medium text-black">
              <span>Total</span>
              <span className="text-lg font-semibold tracking-[-0.05em]">${(order.total_cents / 100).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
