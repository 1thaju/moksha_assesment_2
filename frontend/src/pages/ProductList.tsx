import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { api } from "../lib/api";
import type { Product } from "../lib/types";
import { useCart } from "../context/CartContext";

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    api
      .get<Product[]>("/products")
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-8 text-center text-black/50">Loading products...</p>;
  if (error) return <p className="p-8 text-center text-red-600">Failed to load products: {error}</p>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[26px] border border-black/10 bg-[#f0f0ee] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:p-7">
        <div className="grid gap-6 border border-black/10 bg-white p-4 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-black/45">Curly care essentials</p>
            <h1 className="max-w-lg text-4xl font-semibold tracking-[-0.08em] text-black sm:text-5xl">
              Clean formulas for healthy, defined curls.
            </h1>
            <p className="mt-4 max-w-md text-base text-black/65">
              Thoughtful routines, consistent hydration, and styling products designed to bring out your natural texture.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="#shop" className="rounded-md border border-black bg-black px-4 py-3 text-sm font-medium text-white hover:bg-white hover:text-black">
                Shop essentials
              </Link>
              <Link to="/orders" className="rounded-md border border-black/10 bg-[#f5f5f3] px-4 py-3 text-sm font-medium text-black hover:border-black hover:bg-black hover:text-white">
                Your orders
              </Link>
            </div>
          </div>

          <div className="rounded-[20px] border border-black/10 bg-[#f5f5f3] p-4">
            <div className="rounded-[18px] border border-black/10 bg-white p-4">
              <div className="mb-4 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-black/55">
                <span>Best seller</span>
                <span className="rounded-full border border-black/10 bg-[#f1f1ef] px-2 py-1">In stock</span>
              </div>

              <div className="flex h-48 items-center justify-center rounded-[16px] border border-black/10 bg-[#f3f2f0] text-4xl text-black/80">
                ✨
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/50">Hydra Curls</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.06em]">Curling Cream</h2>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-black/45">From</p>
                  <p className="text-2xl font-semibold tracking-[-0.06em]">$12.99</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div id="shop" className="mt-8">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/45">Shop</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.07em]">Our favorites</h2>
          </div>
          <span className="rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-xs font-medium text-black/65">
            {products.length} items
          </span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="group rounded-[22px] border border-black/10 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
            >
              <Link to={`/products/${product.id}`}>
                <div className="mb-4 flex h-52 items-center justify-center overflow-hidden rounded-[18px] border border-black/10 bg-[#f5f5f3]">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                  ) : (
                    <div className="text-base font-medium text-black/50">Product</div>
                  )}
                </div>
              </Link>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold tracking-[-0.04em] text-black">{product.name}</h3>
                  <p className="mt-1 text-sm text-black/55">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>
                </div>
                <span className="rounded-full border border-black/10 bg-[#f5f5f3] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.18em] text-black/60">
                  {product.stock > 0 ? "New" : "Sold"}
                </span>
              </div>

              <div className="mt-4 flex items-end justify-between gap-3 border-t border-black/10 pt-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-black/45">Price</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.06em]">${(product.price_cents / 100).toFixed(2)}</p>
                </div>

                <button
                  disabled={product.stock < 1}
                  onClick={() => addToCart(product)}
                  className="inline-flex items-center gap-2 rounded-md border border-black bg-black px-3.5 py-2.5 text-sm font-medium text-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:border-black/10 disabled:bg-black/10 disabled:text-black/40"
                >
                  <ShoppingCart size={15} />
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
