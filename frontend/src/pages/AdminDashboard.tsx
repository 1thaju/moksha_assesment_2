import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { Order, Product } from "../lib/types";

type ProductFormState = {
  name: string;
  description: string;
  price_cents: string;
  currency: string;
  image_url: string;
  stock: string;
};

const emptyForm = (): ProductFormState => ({
  name: "",
  description: "",
  price_cents: "",
  currency: "usd",
  image_url: "",
  stock: "",
});

export function AdminDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState<ProductFormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role !== "admin") return;

    Promise.all([
      api.get<Product[]>("/products"),
      api.get<Order[]>("/orders"),
    ])
      .then(([productsData, ordersData]) => {
        setProducts(productsData);
        setOrders(ordersData);
      })
      .catch(() => {
        setProducts([]);
        setOrders([]);
      });
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + order.total_cents, 0),
    [orders]
  );

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price_cents: String(product.price_cents / 100),
      currency: product.currency ?? "usd",
      image_url: product.image_url ?? "",
      stock: String(product.stock),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price_cents: Math.round(Number(form.price_cents) * 100),
        currency: form.currency || "usd",
        image_url: form.image_url.trim() || null,
        stock: Number(form.stock) || 0,
      };

      if (editingId) {
        const updated = await api.patch<Product>(`/products/${editingId}`, payload);
        setProducts((prev) => prev.map((product) => (product.id === editingId ? updated : product)));
      } else {
        const created = await api.post<Product>("/products", payload);
        setProducts((prev) => [created, ...prev]);
      }

      resetForm();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteProduct(id: string) {
    await api.delete(`/products/${id}`);
    setProducts((prev) => prev.filter((product) => product.id !== id));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 border-b border-black/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-black/45">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.07em] text-black">Product management</h1>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md border border-black/10 bg-white px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-black/45">Products</div>
            <div className="mt-1 text-xl font-semibold">{products.length}</div>
          </div>
          <div className="rounded-md border border-black/10 bg-white px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-black/45">Revenue</div>
            <div className="mt-1 text-xl font-semibold">${(totalRevenue / 100).toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[24px] border border-black/10 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.05)] sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-[-0.05em]">Products</h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-[#f5f5f3] px-3 py-2 text-sm font-medium text-black hover:border-black hover:bg-black hover:text-white"
              >
                <X size={14} /> Cancel edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-[18px] border border-black/10 bg-[#f5f5f3] p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-black/70">
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45">Name</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-md border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                  placeholder="Hydrating Shampoo"
                />
              </label>

              <label className="text-sm text-black/70">
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45">Price</span>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price_cents}
                  onChange={(e) => setForm({ ...form, price_cents: e.target.value })}
                  className="w-full rounded-md border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                  placeholder="19.99"
                />
              </label>

              <label className="text-sm text-black/70">
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45">Stock</span>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full rounded-md border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                  placeholder="12"
                />
              </label>

              <label className="text-sm text-black/70">
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45">Currency</span>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full rounded-md border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                >
                  <option value="usd">USD</option>
                  <option value="eur">EUR</option>
                  <option value="gbp">GBP</option>
                </select>
              </label>
            </div>

            <label className="block text-sm text-black/70">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45">Image URL</span>
              <input
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="w-full rounded-md border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                placeholder="https://..."
              />
            </label>

            <label className="block text-sm text-black/70">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="min-h-24 w-full rounded-md border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                placeholder="Product description"
              />
            </label>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-md border border-black bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editingId ? <Save size={15} /> : <Plus size={15} />}
                {submitting ? "Saving..." : editingId ? "Update product" : "Add product"}
              </button>
            </div>
          </form>

          <div className="mt-6 overflow-hidden rounded-[18px] border border-black/10">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#f5f5f3] text-[10px] uppercase tracking-[0.2em] text-black/45">
                  <tr>
                    <th className="px-3 py-3">Product</th>
                    <th className="px-3 py-3">Price</th>
                    <th className="px-3 py-3">Stock</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-t border-black/10">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-black/10 bg-[#f5f5f3] text-[10px] font-semibold uppercase text-black/55">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              "IMG"
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-black">{product.name}</p>
                            <p className="text-xs text-black/45">{product.description || "No description"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-medium">${(product.price_cents / 100).toFixed(2)}</td>
                      <td className="px-3 py-3">{product.stock}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(product)}
                            className="inline-flex items-center gap-1 rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-xs font-medium text-black hover:border-black hover:bg-black hover:text-white"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-black/10 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.05)] sm:p-6">
          <h2 className="text-xl font-semibold tracking-[-0.05em]">Order overview</h2>

          <div className="mt-4 space-y-3">
            {orders.length === 0 ? (
              <div className="rounded-md border border-dashed border-black/15 bg-[#f5f5f3] p-4 text-sm text-black/50">
                No orders yet.
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="rounded-[18px] border border-black/10 bg-[#f5f5f3] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45">Order</p>
                      <p className="mt-1 font-medium text-black">{order.id}</p>
                    </div>
                    <span className="rounded-full border border-black/10 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/65">
                      {order.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-black/45">Items</p>
                      <p className="mt-1 text-sm font-medium text-black">{order.items.length}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-black/45">Total</p>
                      <p className="mt-1 text-lg font-semibold tracking-[-0.05em]">${(order.total_cents / 100).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
