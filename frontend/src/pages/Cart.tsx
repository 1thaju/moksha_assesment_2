import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import type { Order } from "../lib/types";

export function Cart() {
  const { lines, updateQuantity, removeFromCart, totalCents, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    if (!user) {
      navigate("/login");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const order = await api.post<Order>("/orders", {
        items: lines.map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
      });
      const session = await api.post<{ checkout_url: string }>(`/orders/${order.id}/checkout`);
      clearCart();
      window.location.href = session.checkout_url;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong starting checkout.");
    } finally {
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-black/10 bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/45">Your bag</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.07em] text-black">Your cart is empty</h1>
          <p className="mt-3 text-black/60">Add a few favorites and come back when you’re ready to check out.</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center rounded-md border border-black bg-black px-4 py-3 text-sm font-medium text-white hover:bg-white hover:text-black"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = totalCents;
  const shipping = subtotal > 5000 ? 0 : 800;
  const total = subtotal + shipping;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/45">Cart</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.08em] text-black">Your bag</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {lines.map((line) => (
            <div key={line.product.id} className="flex flex-col gap-4 rounded-[22px] border border-black/10 bg-white p-4 shadow-[0_12px_36px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-[16px] border border-black/10 bg-[#f5f5f3]">
                  {line.product.image_url ? (
                    <img src={line.product.image_url} alt={line.product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                      IMG
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-lg font-semibold tracking-[-0.04em] text-black">{line.product.name}</p>
                  <p className="mt-1 text-sm text-black/55">${(line.product.price_cents / 100).toFixed(2)} each</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="inline-flex items-center rounded-md border border-black/10 bg-[#f5f5f3] p-1">
                  <button
                    type="button"
                    onClick={() => updateQuantity(line.product.id, Math.max(1, line.quantity - 1))}
                    className="rounded-sm p-2 text-black hover:bg-white"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="min-w-8 text-center text-sm font-medium text-black">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(line.product.id, line.quantity + 1)}
                    className="rounded-sm p-2 text-black hover:bg-white"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(line.product.id)}
                  className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-2.5 py-2 text-xs font-medium text-black hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remove ${line.product.name}`}
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="rounded-[24px] border border-black/10 bg-[#f5f5f3] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.04)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45">Summary</p>

          <div className="mt-5 space-y-3 text-sm text-black/70">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${(subtotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : `$${(shipping / 100).toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between border-t border-black/10 pt-3 text-base font-semibold text-black">
              <span>Total</span>
              <span>${(total / 100).toFixed(2)}</span>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <button
            onClick={handleCheckout}
            disabled={submitting}
            className="mt-6 w-full rounded-md border border-black bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Preparing checkout..." : "Proceed to checkout"}
          </button>

          <Link to="/" className="mt-3 block text-center text-sm text-black/60 hover:text-black">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
