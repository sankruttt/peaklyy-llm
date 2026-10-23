"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../services/api";
import { Gig, GigRecommendation } from "../../../types";
import { formatINR } from "../../../utils/currency";

export default function GigDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const gigId = parseInt(params.id as string);

  const { isAuthenticated, loading: authLoading } = useAuth();
  const [gig, setGig] = useState<Gig | null>(null);
  const [recommendation, setRecommendation] = useState<GigRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (isNaN(gigId)) {
      router.push("/recommendations");
      return;
    }
    loadData();
  }, [gigId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const gigData = await api.getGig(gigId);
      setGig(gigData);

      if (isAuthenticated) {
        try {
          const recData = await api.getGigRecommendation(gigId);
          setRecommendation(recData);
        } catch {
          // No recommendation calculated yet for this gig
        }
      }
    } catch (err) {
      console.error("Failed to load gig details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    setApplied(true);
    alert(`Application successfully submitted for "${gig?.title}"!`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#e8342a]/30 border-t-[#e8342a] rounded-full animate-spin" />
          <p className="text-xs font-mono-telemetry text-[#8e8c90]">LOADING CONTRACT SPECIFICATION...</p>
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold font-headline text-[#e5e1e4]">CONTRACT SPEC NOT FOUND</h2>
        <p className="text-xs font-mono-telemetry text-[#8e8c90]">The requested contract opportunity could not be located.</p>
        <Link href="/recommendations" className="text-xs font-mono-telemetry text-[#e8342a] hover:underline">
          RETURN TO GIG RADAR
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/recommendations"
          className="inline-flex items-center gap-1.5 text-xs font-mono-telemetry text-[#8e8c90] hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>RETURN TO GIG MATCHES</span>
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="p-8 sm:p-10 rounded bg-[#1c1b1d] border border-[#353437] space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-[#201f22] border border-[#353437] text-[#8e8c90] font-mono-telemetry">
                {gig.category}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-[#201f22] border border-[#353437] text-emerald-400 font-mono-telemetry">
                {gig.experience_level || "SENIOR LEVEL"}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-[#201f22] border border-[#353437] text-[#ffb4aa] font-mono-telemetry">
                {gig.work_type || "CONTRACT"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#e5e1e4] tracking-tight font-headline">
              {gig.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#8e8c90] font-mono-telemetry pt-1">
              <span>COMPANY: {gig.company || "VERITAS // CLOUD"}</span>
              <span>•</span>
              <span>LOCATION: {gig.location || "REMOTE // US"}</span>
              <span>•</span>
              <span>DURATION: {gig.duration || "6 MONTHS"}</span>
              <span>•</span>
              <span>DEADLINE: {gig.application_deadline || "ROLLING"}</span>
            </div>
          </div>

          <div className="p-5 rounded bg-[#201f22] border border-[#353437] shrink-0 text-center space-y-3 min-w-[200px]">
            <span className="text-[10px] uppercase font-bold text-[#8e8c90] tracking-wider font-mono-telemetry">
              COMPENSATION
            </span>
            <div className="text-2xl font-black font-headline text-[#e8342a]">{formatINR(gig.compensation)}</div>

            <button
              onClick={handleApply}
              disabled={applied}
              className={`w-full py-2 px-4 rounded text-xs font-mono-telemetry font-bold transition-all ${
                applied
                  ? "bg-emerald-600/80 text-white cursor-default"
                  : "btn-primary-stitch"
              }`}
            >
              {applied ? "✓ APPLIED" : "QUICK APPLY"}
            </button>
          </div>
        </div>
      </div>

      {/* AI Compatibility Panel (if recommendation exists) */}
      {recommendation && (
        <div className="p-6 sm:p-8 rounded bg-[#1c1b1d] border border-[#e8342a]/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2a2a2c]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-[#e8342a] flex items-center justify-center text-white font-black text-xl font-headline shadow-lg shadow-[#e8342a]/30">
                {recommendation.match_percentage}%
              </div>
              <div>
                <h3 className="text-sm font-bold font-headline uppercase text-[#e5e1e4] flex items-center gap-2">
                  <span>NEURAL COMPATIBILITY SCORE</span>
                </h3>
                <span className="text-xs font-mono-telemetry text-emerald-400">
                  STATUS: {recommendation.eligibility_status.toUpperCase()}
                </span>
              </div>
            </div>

            <Link
              href={`/assistant?prompt=${encodeURIComponent(
                `Can you analyze my match for the "${gig.title}" gig and advise how I can stand out?`
              )}`}
              className="btn-secondary-stitch text-xs px-3.5 py-1.5 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-xs text-[#e8342a]">psychology</span>
              <span>ASK MAWA ABOUT THIS GIG</span>
            </Link>
          </div>

          <div className="p-3.5 rounded bg-[#201f22] border-l-2 border-[#e8342a] text-xs text-[#c8c6c9] leading-relaxed">
            <span className="text-[10px] font-mono-telemetry uppercase text-[#8e8c90] block mb-0.5">
              MATCH SYNTHESIS
            </span>
            {recommendation.recommendation_reason}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 rounded bg-[#201f22] border border-[#353437]">
              <span className="text-[10px] font-mono-telemetry uppercase text-emerald-400 font-bold">
                MATCHED SKILLS ({recommendation.matched_skills.length})
              </span>
              <div className="flex flex-wrap gap-1 mt-2">
                {recommendation.matched_skills.map((s, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono-telemetry px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  >
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded bg-[#201f22] border border-[#353437]">
              <span className="text-[10px] font-mono-telemetry uppercase text-[#8e8c90] font-bold">
                MISSING SKILLS ({recommendation.missing_skills.length})
              </span>
              <div className="flex flex-wrap gap-1 mt-2">
                {recommendation.missing_skills.map((s, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono-telemetry px-2 py-0.5 rounded bg-[#2a2a2c] text-[#8e8c90] border border-[#353437]"
                  >
                    +{s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gig Description & Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Description (2 cols) */}
        <div className="md:col-span-2 p-8 rounded bg-[#1c1b1d] border border-[#353437] space-y-6">
          <div>
            <h3 className="text-sm font-bold font-headline uppercase text-[#e5e1e4] mb-2">
              CONTRACT ROLE OVERVIEW
            </h3>
            <p className="text-xs text-[#c8c6c9] leading-relaxed whitespace-pre-line">
              {gig.description}
            </p>
          </div>

          {gig.eligibility_requirements && gig.eligibility_requirements.length > 0 && (
            <div>
              <h3 className="text-sm font-bold font-headline uppercase text-[#e5e1e4] mb-2">
                ELIGIBILITY & RESPONSIBILITIES
              </h3>
              <ul className="space-y-1.5 text-xs text-[#c8c6c9]">
                {gig.eligibility_requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#e8342a]">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Skills sidebar (1 col) */}
        <div className="p-6 rounded bg-[#1c1b1d] border border-[#353437] space-y-6 h-fit">
          <div>
            <h4 className="text-[11px] font-bold font-mono-telemetry uppercase text-[#8e8c90] mb-3">
              REQUIRED CAPABILITIES
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {gig.required_skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[11px] font-mono-telemetry bg-[#201f22] border border-[#353437] text-[#e5e1e4]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {gig.preferred_skills && gig.preferred_skills.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold font-mono-telemetry uppercase text-[#8e8c90] mb-3">
                PREFERRED CAPABILITIES
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {gig.preferred_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[11px] font-mono-telemetry bg-[#201f22] border border-[#353437] text-[#8e8c90]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

