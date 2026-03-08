import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0fdfa] relative font-sans">
      
      {/* Mint Fresh Breeze Background (Aquarius) */}
      <div
          className="absolute inset-0 z-0"
          style={{
          backgroundImage: `
              linear-gradient(45deg, 
              rgba(240,253,250,1) 0%, 
              rgba(204,251,241,0.7) 30%, 
              rgba(153,246,228,0.5) 60%, 
              rgba(94,234,212,0.4) 100%
              ),
              radial-gradient(circle at 40% 30%, rgba(255,255,255,0.8) 0%, transparent 40%),
              radial-gradient(circle at 80% 70%, rgba(167,243,208,0.5) 0%, transparent 50%),
              radial-gradient(circle at 20% 80%, rgba(209,250,229,0.6) 0%, transparent 45%)
          `,
          }}
      />

      {/* Glassmorphic Container */}
      <div className="w-full max-w-md space-y-8 bg-white/60 p-8 rounded-3xl border border-white shadow-xl backdrop-blur-xl relative z-10 m-4">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-slate-800">Welcome Back</h2>
          <p className="text-sm text-slate-500 font-medium">Sign in to your TodoX account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-white/70 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all text-sm placeholder-slate-400 text-slate-700 shadow-inner"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-white/70 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all text-sm placeholder-slate-400 text-slate-700 shadow-inner"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3 px-4 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center transform hover:-translate-y-0.5"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 font-medium">
          Don't have an account?{" "}
          <Link to="/signup" className="text-teal-600 hover:text-teal-700 font-bold transition-colors underline decoration-2 underline-offset-4 decoration-teal-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
