import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { api } from "../lib/api";
import type { Product } from "../lib/types";
import { useCart } from "../context/CartContext";

export function ProductDetail() {
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!productId) return;
    api.get<Product>(`/products/${productId}`).then(setProduct);
  }, [productId]);

  if (!product) return <p className="p-8 text-center text-black/50">Loading product...</p>;

  const canAdd = product.stock > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-black/55">
        <Link to="/" className="hover:text-black">Shop</Link>
        <span>/</span>
        <span className="text-black">{product.name}</span>
      </div>

      <div className="grid gap-8 rounded-[28px] border border-black/10 bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.05)] md:grid-cols-2 md:p-6">
        <div className="overflow-hidden rounded-[22px] border border-black/10 bg-[#f5f5f3]">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-full min-h-[420px] w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[420px] items-center justify-center text-xl font-semibold tracking-[-0.05em] text-black/35">
              Product image
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/45">
            <span>Hydra care</span>
            <span className="rounded-full border border-black/10 bg-[#f5f5f3] px-2 py-1 text-black/55">
              {product.stock > 0 ? "In stock" : "Sold out"}
            </span>
          </div>

          <h1 className="text-4xl font-semibold tracking-[-0.08em] text-black">{product.name}</h1>

          <div className="mt-5 flex items-end gap-3">
            <p className="text-4xl font-semibold tracking-[-0.08em] text-black">
              ${(product.price_cents / 100).toFixed(2)}
            </p>
            <p className="text-sm text-black/45">{product.currency.toUpperCase()}</p>
          </div>

          <p className="mt-5 max-w-lg text-base leading-7 text-black/65">{product.description}</p>

          <div className="mt-6 flex items-center gap-3">
            <div className="inline-flex items-center rounded-md border border-black/10 bg-[#f5f5f3] p-1">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="rounded-sm p-2 text-black hover:bg-white"
              >
                <Minus size={15} />
              </button>
              <span className="min-w-10 text-center text-sm font-medium text-black">{quantity}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((q) => Math.min(product.stock || 1, q + 1))}
                className="rounded-sm p-2 text-black hover:bg-white"
              >
                <Plus size={15} />
              </button>
            </div>

            <button
              disabled={!canAdd}
              onClick={() => addToCart(product, quantity)}
              className="inline-flex items-center gap-2 rounded-md border border-black bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:border-black/10 disabled:bg-black/10 disabled:text-black/40"
            >
              <ShoppingBag size={16} />
              {canAdd ? "Add to cart" : "Out of stock"}
            </button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-black/10 bg-[#f5f5f3] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45">Ships</p>
              <p className="mt-1 text-sm font-medium text-black">2–4 days</p>
            </div>
            <div className="rounded-md border border-black/10 bg-[#f5f5f3] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45">Texture</p>
              <p className="mt-1 text-sm font-medium text-black">Hydrating</p>
            </div>
            <div className="rounded-md border border-black/10 bg-[#f5f5f3] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45">Stock</p>
              <p className="mt-1 text-sm font-medium text-black">{product.stock}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
