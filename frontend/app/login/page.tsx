"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import peaklyyLogo from "@/public/peaklyy_logo.png";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="p-8 sm:p-10 rounded bg-[#1c1b1d] border border-[#353437] shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <div className="relative w-14 h-14 rounded-full overflow-hidden mx-auto shadow-xl shadow-[#e8342a]/20 border border-[#353437]">
              <Image
                src={peaklyyLogo}
                alt="Peaklyy Logo"
                width={56}
                height={56}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold font-headline uppercase text-[#e5e1e4]">
              PEAKLYY AUTHENTICATION
            </h1>
            <p className="text-xs font-mono-telemetry text-[#8e8c90]">
              Sign in to synchronize your profile and active contract radar.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded bg-[#e8342a]/10 border border-[#e8342a]/40 flex items-start gap-2.5 text-xs text-[#ffb4aa]">
              <span className="material-symbols-outlined text-[#e8342a] text-sm shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono-telemetry uppercase text-[#8e8c90] mb-1.5">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <span className="material-symbols-outlined text-sm text-[#8e8c90] absolute left-3.5 top-1/2 -translate-y-1/2">
                  mail
                </span>
                <input
                  type="email"
                  required
                  placeholder="batman@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded bg-[#201f22] border border-[#353437] focus:border-[#e8342a] focus:outline-none text-xs font-mono-telemetry text-[#e5e1e4] placeholder-[#8e8c90] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono-telemetry uppercase text-[#8e8c90] mb-1.5">
                ACCESS KEY / PASSWORD
              </label>
              <div className="relative">
                <span className="material-symbols-outlined text-sm text-[#8e8c90] absolute left-3.5 top-1/2 -translate-y-1/2">
                  lock
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded bg-[#201f22] border border-[#353437] focus:border-[#e8342a] focus:outline-none text-xs font-mono-telemetry text-[#e5e1e4] placeholder-[#8e8c90] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 btn-primary-stitch text-xs py-3 flex items-center justify-center gap-2 font-mono-telemetry font-bold disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>SIGN IN TO CONSOLE</span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-[#2a2a2c] text-center">
            <p className="text-xs font-mono-telemetry text-[#8e8c90]">
              Don't have an account?{" "}
              <Link href="/register" className="font-bold text-[#e8342a] hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

