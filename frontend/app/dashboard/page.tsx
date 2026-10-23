"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Resume, GigRecommendation } from "../../types";
import { calculateResumeScore, getScoreRating } from "../../utils/scoring";
import { formatINR } from "../../utils/currency";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [recommendations, setRecommendations] = useState<GigRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [authLoading, isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [resumesData, recsData] = await Promise.all([
        api.getUserResumes(),
        api.getRecommendations(),
      ]);
      setResumes(resumesData);
      setRecommendations(recsData);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshRecommendations = async () => {
    try {
      setRefreshing(true);
      const res = await api.refreshRecommendations();
      setRecommendations(res.recommendations);
    } catch (err: any) {
      alert(err.message || "Failed to refresh recommendations");
    } finally {
      setRefreshing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#e8342a]/30 border-t-[#e8342a] rounded-full animate-spin" />
          <p className="text-xs font-mono-telemetry text-[#8e8c90]">SYNCHRONIZING RADAR TELEMETRY...</p>
        </div>
      </div>
    );
  }

  const latestResume = resumes.length > 0 ? resumes[0] : null;
  const topMatch = recommendations.length > 0 ? recommendations[0] : null;
  const topScore = topMatch ? topMatch.match_percentage : 0;
  // Calculate dynamic profile strength score from analyzed resume
  const profileScore = latestResume?.ai_profile ? calculateResumeScore(latestResume.ai_profile) : 0;
  const strokeDashoffset = latestResume?.ai_profile ? 283 - (283 * profileScore) / 100 : 283;
  const scoreRating = latestResume?.ai_profile
    ? getScoreRating(profileScore)
    : { label: "NO RESUME INDEXED", tier: "LEVEL 0", color: "text-[#8e8c90]" };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#353437]">
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-mono-telemetry text-[#8e8c90]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>RADAR STATUS: ACTIVE // NODE 01</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#e5e1e4] tracking-tight font-headline">
            GOOD MORNING, {user?.name?.toUpperCase() || "ENGINEER"}
          </h1>
          <p className="text-xs text-[#8e8c90] font-mono-telemetry mt-1">
            Real-time hybrid gig matching engine & neural profile diagnostic.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/assistant"
            className="btn-secondary-stitch text-xs px-4 py-2 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px] text-[#e8342a]">psychology</span>
            <span>AI ASSISTANT</span>
          </Link>
          <Link
            href="/resume/upload"
            className="btn-primary-stitch text-xs px-4 py-2 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            <span>+ NEW RESUME</span>
          </Link>
        </div>
      </div>

      {/* 3 KPI Metric Cards (Engine Status tab removed) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Top Match */}
        <div className="p-5 rounded bg-[#1c1b1d] border border-[#353437] hover:border-[#e8342a]/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono-telemetry text-[#8e8c90]">
            <span>TOP MATCH</span>
            <span className="material-symbols-outlined text-emerald-400 text-sm">verified</span>
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold font-headline text-[#e5e1e4]">
              {topScore > 0 ? `${topScore}%` : "--"}
            </div>
            <p className="text-[11px] text-[#8e8c90] font-mono-telemetry truncate mt-1">
              {topMatch ? topMatch.gig.title : "No matches computed yet"}
            </p>
          </div>
          <div className="w-full bg-[#2a2a2c] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${topScore > 0 ? topScore : 0}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Active Resumes */}
        <div className="p-5 rounded bg-[#1c1b1d] border border-[#353437] hover:border-[#e8342a]/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono-telemetry text-[#8e8c90]">
            <span>ACTIVE RESUMES</span>
            <span className="material-symbols-outlined text-[#e8342a] text-sm">description</span>
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold font-headline text-[#e5e1e4]">
              {resumes.length}
            </div>
            <p className="text-[11px] font-mono-telemetry truncate mt-1 flex items-center gap-1">
              {latestResume ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-emerald-400 font-semibold">{latestResume.analysis_status.toUpperCase()}</span>
                </>
              ) : (
                <span className="text-[#8e8c90]">NO RESUME UPLOADED</span>
              )}
            </p>
          </div>
          <div className="text-[10px] text-[#8e8c90] font-mono-telemetry truncate">
            {latestResume ? `LATEST: ${latestResume.file_name}` : "AWAITING FILE UPLOAD"}
          </div>
        </div>

        {/* Metric 3: Matched Gigs */}
        <div className="p-5 rounded bg-[#1c1b1d] border border-[#353437] hover:border-[#e8342a]/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono-telemetry text-[#8e8c90]">
            <span>MATCHED GIGS</span>
            <span className="material-symbols-outlined text-[#e8342a] text-sm">work</span>
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold font-headline text-[#e5e1e4]">
              {recommendations.length}
            </div>
            <p className="text-[11px] text-[#8e8c90] font-mono-telemetry mt-1">
              {recommendations.length > 0 ? "CALCULATED FROM ACTIVE RESUME" : "RUN RADAR TO COMPUTE"}
            </p>
          </div>
          <div className="text-[10px] text-[#8e8c90] font-mono-telemetry">
            CONTRACT & DIRECT HIRE
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid: 8 cols Left, 4 cols Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Recommended Gigs */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold font-headline uppercase tracking-tight text-[#e5e1e4]">
                RECOMMENDED GIG MATCHES
              </h2>
              <span className="px-2 py-0.5 rounded bg-[#2a2a2c] border border-[#353437] text-[10px] font-mono-telemetry text-[#c8c6c9]">
                {recommendations.length} MATCHES
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefreshRecommendations}
                disabled={refreshing || !latestResume}
                className="px-3 py-1 rounded bg-[#201f22] border border-[#353437] hover:border-[#e8342a]/50 text-xs font-mono-telemetry text-[#c8c6c9] hover:text-white flex items-center gap-1.5 transition-all disabled:opacity-40"
              >
                <span className={`material-symbols-outlined text-xs ${refreshing ? "animate-spin text-[#e8342a]" : ""}`}>
                  sync
                </span>
                <span>{refreshing ? "COMPUTING..." : "REFRESH RADAR"}</span>
              </button>
              <Link
                href="/recommendations"
                className="text-xs font-mono-telemetry text-[#e8342a] hover:underline"
              >
                VIEW ALL →
              </Link>
            </div>
          </div>

          {recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.slice(0, 5).map((rec) => {
                const isHighMatch = rec.match_percentage >= 70;
                return (
                  <div
                    key={rec.id}
                    className="p-6 rounded bg-[#1c1b1d] border border-[#353437] hover:border-[#e8342a]/60 transition-all space-y-4 group"
                  >
                    {/* Card Top: Badges & Compensation */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-mono-telemetry font-bold ${
                            isHighMatch
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {rec.match_percentage}% MATCH
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#201f22] border border-[#353437] text-[10px] font-mono-telemetry text-[#8e8c90] uppercase">
                          {rec.gig.category}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#201f22] border border-[#353437] text-[10px] font-mono-telemetry text-[#8e8c90]">
                          {rec.gig.experience_level || "SENIOR"}
                        </span>
                      </div>

                      <div className="text-xs font-mono-telemetry font-bold text-[#e8342a]">
                        {formatINR(rec.gig.compensation)}
                      </div>
                    </div>

                    {/* Card Body: Title & Company */}
                    <div>
                      <h3 className="text-base font-bold font-headline text-[#e5e1e4] group-hover:text-[#ffb4aa] transition-colors">
                        <Link href={`/gigs/${rec.gig.id}`}>{rec.gig.title}</Link>
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-[#8e8c90] font-mono-telemetry mt-1">
                        <span>{rec.gig.company || "VERITAS // CLOUD"}</span>
                        <span>•</span>
                        <span>{rec.gig.location || "REMOTE // US"}</span>
                      </div>
                    </div>

                    {/* Recommendation Reason */}
                    <div className="p-3 rounded bg-[#201f22] border-l-2 border-[#e8342a] text-xs text-[#c8c6c9] leading-relaxed">
                      <span className="text-[10px] font-mono-telemetry uppercase text-[#8e8c90] block mb-0.5">
                        MATCH SYNTHESIS
                      </span>
                      {rec.recommendation_reason}
                    </div>

                    {/* Skills Tags */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {rec.matched_skills.slice(0, 5).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-mono-telemetry bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        >
                          ✓ {skill}
                        </span>
                      ))}
                      {rec.missing_skills.slice(0, 2).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-mono-telemetry bg-[#2a2a2c] text-[#8e8c90] border border-[#353437]"
                        >
                          +{skill}
                        </span>
                      ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-[#2a2a2c] flex items-center justify-between">
                      <span className="text-[10px] font-mono-telemetry text-[#8e8c90]">
                        POSTED 2D AGO // VERIFIED GIG
                      </span>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/gigs/${rec.gig.id}`}
                          className="text-xs font-mono-telemetry text-[#c8c6c9] hover:text-white"
                        >
                          VIEW SPEC
                        </Link>
                        <Link
                          href={`/gigs/${rec.gig.id}`}
                          className="btn-primary-stitch text-xs px-3 py-1"
                        >
                          QUICK APPLY
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 rounded bg-[#1c1b1d] border border-[#353437] text-center space-y-4">
              <span className="material-symbols-outlined text-4xl text-[#8e8c90]">work_off</span>
              <h4 className="text-base font-bold font-headline text-[#e5e1e4]">
                NO GIG RECOMMENDATIONS GENERATED YET
              </h4>
              <p className="text-xs text-[#8e8c90] font-mono-telemetry max-w-md mx-auto">
                Upload your resume or trigger the recommendation radar to discover curated high-fit contracts.
              </p>
              <Link
                href="/resume/upload"
                className="btn-primary-stitch inline-flex text-xs px-4 py-2"
              >
                UPLOAD FIRST RESUME
              </Link>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Active Profile & AI Assistant */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Active Profile Strength */}
          <div className="p-6 rounded bg-[#1c1b1d] border border-[#353437] space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono-telemetry uppercase text-[#8e8c90] tracking-wider">
                ACTIVE PROFILE RADAR
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Radial Meter SVG */}
            <div className="flex flex-col items-center py-2">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#2a2a2c"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#e8342a"
                    strokeWidth="8"
                    strokeDasharray="283"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute flex flex-col items-center text-center">
                  <span className="text-3xl font-extrabold font-headline text-[#e5e1e4]">
                    {profileScore}
                  </span>
                  <span className="text-[9px] font-mono-telemetry text-[#8e8c90] uppercase tracking-wider">
                    STRENGTH PTS
                  </span>
                </div>
              </div>
              <p className={`text-xs font-mono-telemetry mt-3 ${scoreRating.color}`}>
                {scoreRating.label} // {scoreRating.tier}
              </p>
            </div>

            {/* Current Resume Info */}
            <div className="p-3 rounded bg-[#201f22] border border-[#353437] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-telemetry">
                <span className="text-[#e5e1e4] font-bold truncate max-w-[180px]">
                  {latestResume ? latestResume.file_name : "No Resume Uploaded"}
                </span>
                <span className="text-[10px] text-[#e8342a] uppercase font-bold">
                  {latestResume ? (latestResume.file_type || "PDF") : "--"}
                </span>
              </div>
              <div className="text-[10px] text-[#8e8c90] font-mono-telemetry">
                STATUS: {latestResume ? latestResume.analysis_status.toUpperCase() : "AWAITING UPLOAD"}
              </div>
            </div>

            {/* Validated Skills Cloud */}
            <div>
              <div className="text-[10px] font-mono-telemetry uppercase text-[#8e8c90] mb-2">
                VERIFIED SKILLS RADAR
              </div>
              {latestResume?.ai_profile?.skills?.strongest_skills && latestResume.ai_profile.skills.strongest_skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {latestResume.ai_profile.skills.strongest_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-[#201f22] border border-[#353437] text-[10px] font-mono-telemetry text-[#c8c6c9]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] font-mono-telemetry text-[#8e8c90]">
                  {latestResume ? "No prominent skills identified yet." : "Upload a resume to analyze proficiencies & skills."}
                </p>
              )}
            </div>

            {/* Button to Full Analysis or Upload */}
            {latestResume ? (
              <Link
                href={`/resume/analysis?id=${latestResume.id}`}
                className="w-full btn-secondary-stitch text-xs py-2 flex items-center justify-center gap-2 block text-center"
              >
                <span>OPEN FULL DIAGNOSTIC</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            ) : (
              <Link
                href="/resume/upload"
                className="w-full btn-primary-stitch text-xs py-2 flex items-center justify-center gap-2 block text-center"
              >
                <span className="material-symbols-outlined text-xs">upload_file</span>
                <span>UPLOAD FIRST RESUME</span>
              </Link>
            )}
          </div>

          {/* Card 2: AI Career Assistant Shortcuts */}
          <div className="p-6 rounded bg-[#1c1b1d] border border-[#353437] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#e8342a]/10 border border-[#e8342a]/30 text-[#e8342a] flex items-center justify-center">
                <span className="material-symbols-outlined text-base">psychology</span>
              </div>
              <div>
                <h4 className="text-xs font-bold font-headline uppercase text-[#e5e1e4]">
                  MAWA // AI COPILOT
                </h4>
                <p className="text-[10px] text-[#8e8c90] font-mono-telemetry">
                  Direct context into your profile & gigs
                </p>
              </div>
            </div>

            <p className="text-xs text-[#c8c6c9] leading-relaxed">
              Explore role alignment, compensate negotiations, or generate cover summaries.
            </p>

            <div className="space-y-2">
              <Link
                href="/assistant?prompt=Explain%20why%20I%20matched%20highest%20with%20my%20top%20recommended%20gig"
                className="p-2.5 rounded bg-[#201f22] border border-[#353437] hover:border-[#e8342a]/40 text-xs font-mono-telemetry text-[#c8c6c9] hover:text-white flex items-center justify-between transition-colors block"
              >
                <span className="truncate">"Explain why I matched with top gig"</span>
                <span className="material-symbols-outlined text-xs text-[#e8342a]">chevron_right</span>
              </Link>
              <Link
                href="/assistant?prompt=What%20skills%20should%20I%20learn%20to%20increase%20my%20hourly%20rate%3F"
                className="p-2.5 rounded bg-[#201f22] border border-[#353437] hover:border-[#e8342a]/40 text-xs font-mono-telemetry text-[#c8c6c9] hover:text-white flex items-center justify-between transition-colors block"
              >
                <span className="truncate">"What skills will increase my rate?"</span>
                <span className="material-symbols-outlined text-xs text-[#e8342a]">chevron_right</span>
              </Link>
            </div>

            <Link
              href="/assistant"
              className="w-full btn-primary-stitch text-xs py-2 flex items-center justify-center gap-2 block text-center"
            >
              <span>LAUNCH MAWA</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

