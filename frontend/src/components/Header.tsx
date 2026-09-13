import { Link } from "react-router-dom";
import { ShoppingBag, ShoppingCart, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export function Header() {
  const { user, logout } = useAuth();
  const { lines } = useCart();
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f5f5f3]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 text-black">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-black bg-black text-sm font-bold text-white">
            <ShoppingBag size={15} />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/50">Hydra</div>
            <div className="text-lg font-semibold tracking-[-0.06em]">Curls Shop</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-md border border-black/10 bg-white/70 p-1 sm:flex">
          <Link to="/" className="rounded-sm px-3 py-2 text-sm font-medium text-black hover:bg-black hover:text-white">
            Shop
          </Link>
          {user && (
            <Link to="/orders" className="rounded-sm px-3 py-2 text-sm font-medium text-black hover:bg-black hover:text-white">
              Orders
            </Link>
          )}
          {user?.role === "admin" && (
            <Link to="/admin" className="rounded-sm px-3 py-2 text-sm font-medium text-black hover:bg-black hover:text-white">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-md border border-black/10 bg-white text-black hover:border-black hover:bg-black hover:text-white">
            <ShoppingCart size={17} />
            {itemCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[9px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-medium text-black hover:border-black hover:bg-black hover:text-white"
            >
              <UserRound size={15} />
              <span>{user.name.split(" ")[0]}</span>
            </button>
          ) : (
            <Link to="/login" className="rounded-md border border-black bg-black px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-black">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
