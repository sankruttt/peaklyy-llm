"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Resume, GigRecommendation } from "../../types";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [recommendations, setRecommendations] = useState<GigRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      loadStats();
    }
  }, [authLoading, isAuthenticated]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [r, recs] = await Promise.all([
        api.getUserResumes(),
        api.getRecommendations(),
      ]);
      setResumes(r);
      setRecommendations(recs);
    } catch (err) {
      console.error("Failed to load profile stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#e8342a]/30 border-t-[#e8342a] rounded-full animate-spin" />
      </div>
    );
  }

  const topMatch = recommendations.length > 0 ? recommendations[0] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Profile Header Card */}
      <div className="p-8 sm:p-10 rounded bg-[#1c1b1d] border border-[#353437] space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded bg-[#e8342a] flex items-center justify-center text-white text-3xl font-black font-headline shadow-xl shadow-[#e8342a]/30 shrink-0">
            {user?.name.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-headline uppercase text-[#e5e1e4]">
              {user?.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-mono-telemetry text-[#8e8c90]">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs text-[#e8342a]">mail</span>
                {user?.email}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs text-[#e8342a]">calendar_today</span>
                Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "2026"}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="btn-secondary-stitch text-xs px-4 py-2 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-xs text-[#e8342a]">logout</span>
            <span>SIGN OUT</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[#2a2a2c]">
          <div className="p-4 rounded bg-[#201f22] border border-[#353437]">
            <span className="text-[10px] font-mono-telemetry uppercase text-[#8e8c90]">
              UPLOADED RESUMES
            </span>
            <div className="text-2xl font-black font-headline text-[#e5e1e4] mt-1">
              {resumes.length}
            </div>
          </div>
          <div className="p-4 rounded bg-[#201f22] border border-[#353437]">
            <span className="text-[10px] font-mono-telemetry uppercase text-[#8e8c90]">
              TOP COMPATIBILITY
            </span>
            <div className="text-2xl font-black font-headline text-[#e8342a] mt-1">
              {topMatch ? `${topMatch.match_percentage}%` : "--"}
            </div>
          </div>
          <div className="p-4 rounded bg-[#201f22] border border-[#353437]">
            <span className="text-[10px] font-mono-telemetry uppercase text-[#8e8c90]">
              TOP SUITABLE DOMAIN
            </span>
            <div className="text-xs font-mono-telemetry font-bold text-emerald-400 mt-2 truncate">
              {topMatch ? topMatch.gig.category.toUpperCase() : "UPLOAD RESUME"}
            </div>
          </div>
        </div>
      </div>

      {/* Security & System Status */}
      <div className="p-8 rounded bg-[#1c1b1d] border border-[#353437] space-y-6">
        <h3 className="text-xs font-bold font-mono-telemetry uppercase text-[#e5e1e4] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#e8342a] text-sm">verified_user</span>
          <span>SYSTEM & DATA ISOLATION PROTOCOLS</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono-telemetry">
          <div className="p-4 rounded bg-[#201f22] border border-[#353437] space-y-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              POSTGRESQL STRICT ISOLATION
            </span>
            <p className="text-[11px] text-[#8e8c90] leading-relaxed">
              All parsed resumes, computed compatibility scores, and dialog history are isolated by authenticated user ID.
            </p>
          </div>

          <div className="p-4 rounded bg-[#201f22] border border-[#353437] space-y-1">
            <span className="font-bold text-[#ffb4aa] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e8342a]" />
              STRUCTURED LLM INFERENCE
            </span>
            <p className="text-[11px] text-[#8e8c90] leading-relaxed">
              OpenRouter Gemma 4 31B semantic extraction with Pydantic JSON schema constraints.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded bg-[#201f22] border border-[#353437]">
        <div>
          <h4 className="text-xs font-bold font-headline uppercase text-[#e5e1e4]">
            KEEP YOUR PROFILE RADAR CURRENT
          </h4>
          <p className="text-[11px] font-mono-telemetry text-[#8e8c90]">
            Upload a revised resume at any time to re-calibrate your gig match scores.
          </p>
        </div>
        <Link
          href="/resume/upload"
          className="btn-primary-stitch text-xs px-4 py-2 flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-xs">upload_file</span>
          <span>UPLOAD NEW RESUME</span>
        </Link>
      </div>
    </div>
  );
}

