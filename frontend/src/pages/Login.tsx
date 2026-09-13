import { useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GoogleSignInButton } from "../components/GoogleSignInButton";

export function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="mx-auto flex min-h-[72vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
        <div className="border-b border-black/10 bg-[#f5f5f3] px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-black bg-black text-white">
            <ShieldCheck size={18} />
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.07em]">Welcome back</h1>
          <p className="mt-2 text-sm text-black/60">Sign in to manage orders and checkout faster.</p>
        </div>

        <div className="px-6 py-8 text-center">
          <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.26em] text-black/45">Continue with</p>
          <GoogleSignInButton />
        </div>
      </div>
    </div>
  );
}
