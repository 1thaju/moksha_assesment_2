import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";

export function CheckoutSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get("order_id");

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-black/10 bg-white p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-black/10 bg-[#f5f5f3] text-black">
          <CheckCircle2 size={28} />
        </div>

        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-black/45">Payment success</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.07em] text-black">Order confirmed</h1>

        <p className="mt-4 text-base text-black/65">
          Thanks for shopping with Hydra Curls. Your order {orderId ? <code className="text-xs">{orderId}</code> : ""} is being prepared.
          We’ll email updates as it moves through fulfillment.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/orders"
            className="inline-flex items-center justify-center rounded-md border border-black bg-black px-4 py-3 text-sm font-medium text-white hover:bg-white hover:text-black"
          >
            View my orders
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-black/10 bg-[#f5f5f3] px-4 py-3 text-sm font-medium text-black hover:border-black hover:bg-black hover:text-white"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export function CheckoutCancel() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-black/10 bg-white p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600">
          <XCircle size={28} />
        </div>

        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-black/45">Payment cancelled</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.07em] text-black">No charge was made</h1>

        <p className="mt-4 text-base text-black/65">
          Your cart is still saved, so you can come back and try again whenever you’re ready.
        </p>

        <Link
          to="/cart"
          className="mt-7 inline-flex items-center justify-center rounded-md border border-black bg-black px-4 py-3 text-sm font-medium text-white hover:bg-white hover:text-black"
        >
          Back to cart
        </Link>
      </div>
    </div>
  );
}
