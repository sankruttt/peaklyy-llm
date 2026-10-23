"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { GigRecommendation } from "../../types";
import { formatINR } from "../../utils/currency";

export default function RecommendationsPage() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useAuth();

  const [recommendations, setRecommendations] = useState<GigRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [eligibilityFilter, setEligibilityFilter] = useState("all");
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [appliedGigs, setAppliedGigs] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      loadRecommendations();
    }
  }, [authLoading, isAuthenticated]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const data = await api.getRecommendations();
      setRecommendations(data);
    } catch (err) {
      console.error("Failed to load recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const res = await api.refreshRecommendations();
      setRecommendations(res.recommendations);
    } catch (err: any) {
      alert(err.message || "Failed to refresh recommendations.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleApply = (gigId: number, gigTitle: string) => {
    setAppliedGigs((prev) => ({ ...prev, [gigId]: true }));
    alert(`Application successfully submitted for "${gigTitle}"!`);
  };

  const categoryPills = [
    { label: "ALL ROLES", value: "ALL" },
    { label: "FRONTEND", value: "frontend" },
    { label: "FULL STACK", value: "full stack" },
    { label: "BACKEND", value: "backend" },
    { label: "PYTHON", value: "python" },
    { label: "ML & AI", value: "machine learning" },
    { label: "UI/UX", value: "ui/ux" },
  ];

  const filteredRecs = recommendations.filter((r) => {
    const matchesSearch =
      r.gig.title.toLowerCase().includes(search.toLowerCase()) ||
      r.gig.category.toLowerCase().includes(search.toLowerCase()) ||
      (r.gig.company ? r.gig.company.toLowerCase().includes(search.toLowerCase()) : false) ||
      r.gig.required_skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      categoryFilter === "ALL" ||
      r.gig.category.toLowerCase().includes(categoryFilter.toLowerCase());

    const matchesEligibility =
      eligibilityFilter === "all" ||
      (eligibilityFilter === "eligible" && r.match_percentage >= 70) ||
      (eligibilityFilter === "partially" && r.match_percentage < 70 && r.match_percentage >= 40);

    const matchesMinScore = r.match_percentage >= minMatchScore;

    return matchesSearch && matchesCategory && matchesEligibility && matchesMinScore;
  });

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#e8342a]/30 border-t-[#e8342a] rounded-full animate-spin" />
          <p className="text-xs font-mono-telemetry text-[#8e8c90]">COMPUTING GIG MATCH TELEMETRY...</p>
        </div>
      </div>
    );
  }

  const averageMatchScore =
    recommendations.length > 0
      ? Math.round(
          recommendations.reduce((sum, r) => sum + r.match_percentage, 0) /
            recommendations.length
        )
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#353437]">
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-mono-telemetry text-[#8e8c90]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>HYBRID MATCHER // TF-IDF + COSINE COMPATIBILITY</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#e5e1e4] tracking-tight font-headline">
            GIG MATCHES & OPPORTUNITIES
          </h1>
          <p className="text-xs text-[#8e8c90] font-mono-telemetry mt-1">
            Algorithmic role scoring derived from extracted resume proficiencies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 rounded bg-[#201f22] border border-[#353437] hover:border-[#e8342a]/50 text-xs font-mono-telemetry text-[#c8c6c9] hover:text-white flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <span className={`material-symbols-outlined text-xs ${refreshing ? "animate-spin text-[#e8342a]" : ""}`}>
              sync
            </span>
            <span>{refreshing ? "RE-SCORING..." : "REFRESH RADAR"}</span>
          </button>
          <Link
            href="/resume/upload"
            className="btn-primary-stitch text-xs px-4 py-2 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-xs">upload_file</span>
            <span>UPDATE RESUME</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded bg-[#1c1b1d] border border-[#353437] space-y-4">
        {/* Row 1: Search & Eligibility Tabs */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined text-sm text-[#8e8c90] absolute left-3 top-1/2 -translate-y-1/2">
              search
            </span>
            <input
              type="text"
              placeholder="Search contracts by skill, keyword, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-16 py-2 rounded bg-[#201f22] border border-[#353437] text-xs font-mono-telemetry text-[#e5e1e4] placeholder-[#8e8c90] focus:outline-none focus:border-[#e8342a]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono-telemetry text-[#8e8c90] hover:text-white"
              >
                CLEAR
              </button>
            )}
          </div>

          {/* Eligibility Segment Tabs */}
          <div className="flex items-center gap-1 bg-[#201f22] p-1 rounded border border-[#353437] w-full md:w-auto">
            {[
              { id: "all", label: "ALL MATCHES" },
              { id: "eligible", label: "ELIGIBLE ≥70%" },
              { id: "partially", label: "PARTIAL 40-69%" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setEligibilityFilter(tab.id)}
                className={`flex-1 md:flex-none px-3 py-1 rounded text-xs font-semibold font-mono-telemetry transition-all ${
                  eligibilityFilter === tab.id
                    ? "bg-[#2a2a2c] text-white border border-[#e8342a]/60 shadow-[0_0_10px_rgba(232,52,42,0.2)]"
                    : "text-[#8e8c90] hover:text-[#e5e1e4]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#2a2a2c]">
          <span className="text-[10px] font-mono-telemetry uppercase text-[#8e8c90] mr-2">
            ROLE DOMAINS:
          </span>
          {categoryPills.map((pill) => (
            <button
              key={pill.value}
              onClick={() => setCategoryFilter(pill.value)}
              className={`px-3 py-1 rounded text-[11px] font-mono-telemetry transition-all ${
                categoryFilter === pill.value
                  ? "bg-[#e8342a] text-white font-bold shadow-md shadow-[#e8342a]/20"
                  : "bg-[#201f22] text-[#c8c6c9] border border-[#353437] hover:border-[#8e8c90]"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* 12-Column Layout: 8 cols Left (Feed), 4 cols Right (Refine Matrix) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Match Feed */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono-telemetry text-[#8e8c90] pb-2">
            <span>
              DISPLAYING {filteredRecs.length} VERIFIED MATCHES
            </span>
            <span>SORT: COMPATIBILITY DESCENDING</span>
          </div>

          {filteredRecs.length > 0 ? (
            <div className="space-y-4">
              {filteredRecs.map((rec) => {
                const isHighMatch = rec.match_percentage >= 70;
                const hasApplied = appliedGigs[rec.gig.id];

                return (
                  <div
                    key={rec.id}
                    className="p-6 rounded bg-[#1c1b1d] border border-[#353437] hover:border-[#e8342a]/60 transition-all space-y-4 group"
                  >
                    {/* Top Row: Match %, Category, Rate */}
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
                        <span className="px-2 py-0.5 rounded bg-[#201f22] border border-[#353437] text-[10px] font-mono-telemetry text-emerald-400">
                          VERIFIED CONTRACT
                        </span>
                      </div>

                      <div className="text-xs font-mono-telemetry font-bold text-[#e8342a]">
                        {formatINR(rec.gig.compensation)}
                      </div>
                    </div>

                    {/* Title & Metadata */}
                    <div>
                      <h3 className="text-base font-bold font-headline text-[#e5e1e4] group-hover:text-[#ffb4aa] transition-colors">
                        <Link href={`/gigs/${rec.gig.id}`}>{rec.gig.title}</Link>
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#8e8c90] font-mono-telemetry mt-1">
                        <span>{rec.gig.company || "VERITAS // CLOUD"}</span>
                        <span>•</span>
                        <span>{rec.gig.location || "REMOTE // GLOBAL"}</span>
                        <span>•</span>
                        <span>{rec.gig.duration || "6 MONTHS"}</span>
                      </div>
                    </div>

                    {/* Description preview */}
                    <p className="text-xs text-[#c8c6c9] leading-relaxed line-clamp-2">
                      {rec.gig.description}
                    </p>

                    {/* AI Recommendation Context */}
                    <div className="p-3 rounded bg-[#201f22] border-l-2 border-[#e8342a] text-xs text-[#e5e1e4] leading-relaxed">
                      <span className="text-[10px] font-mono-telemetry uppercase text-[#8e8c90] block mb-0.5">
                        MATCH SYNTHESIS
                      </span>
                      {rec.recommendation_reason}
                    </div>

                    {/* Skills pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {rec.matched_skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-mono-telemetry bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        >
                          ✓ {s}
                        </span>
                      ))}
                      {rec.missing_skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-mono-telemetry bg-[#2a2a2c] text-[#8e8c90] border border-[#353437]"
                        >
                          +{s}
                        </span>
                      ))}
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-[#2a2a2c] flex items-center justify-between">
                      <span className="text-[10px] font-mono-telemetry text-[#8e8c90]">
                        POSTED 2D AGO // VERIFIED CLIENT
                      </span>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/gigs/${rec.gig.id}`}
                          className="text-xs font-mono-telemetry text-[#c8c6c9] hover:text-white"
                        >
                          VIEW SPEC
                        </Link>
                        <button
                          onClick={() => handleApply(rec.gig.id, rec.gig.title)}
                          disabled={hasApplied}
                          className={`text-xs px-4 py-1.5 rounded font-mono-telemetry font-bold transition-all ${
                            hasApplied
                              ? "bg-emerald-600/80 text-white cursor-default"
                              : "btn-primary-stitch"
                          }`}
                        >
                          {hasApplied ? "✓ APPLIED" : "QUICK APPLY"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 rounded bg-[#1c1b1d] border border-[#353437] text-center space-y-4">
              <span className="material-symbols-outlined text-4xl text-[#8e8c90]">search_off</span>
              <h4 className="text-base font-bold font-headline text-[#e5e1e4]">
                NO GIG MATCHES FOUND FOR ACTIVE FILTERS
              </h4>
              <p className="text-xs text-[#8e8c90] font-mono-telemetry max-w-sm mx-auto">
                Adjust your search query or reset minimum match thresholds to explore additional database contracts.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("ALL");
                  setEligibilityFilter("all");
                  setMinMatchScore(0);
                }}
                className="btn-secondary-stitch text-xs px-4 py-2"
              >
                RESET FILTERS
              </button>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Sticky Refine Matrix Sidebar */}
        <div className="lg:col-span-4 sticky top-24 space-y-6">
          <div className="p-6 rounded bg-[#1c1b1d] border border-[#353437] space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#2a2a2c]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#e8342a] text-sm">tune</span>
                <h3 className="text-xs font-bold font-mono-telemetry uppercase text-[#e5e1e4]">
                  REFINE MATRIX
                </h3>
              </div>
              <button
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("ALL");
                  setEligibilityFilter("all");
                  setMinMatchScore(0);
                }}
                className="text-[10px] font-mono-telemetry text-[#e8342a] hover:underline"
              >
                RESET
              </button>
            </div>

            {/* Instant Match Minimum Score Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-telemetry">
                <span className="text-[#8e8c90]">MIN MATCH COMPATIBILITY:</span>
                <span className="text-white font-bold">{minMatchScore}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={minMatchScore}
                onChange={(e) => setMinMatchScore(parseInt(e.target.value))}
                className="w-full accent-[#e8342a] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono-telemetry text-[#8e8c90]">
                <span>0%</span>
                <span>50%</span>
                <span>90%</span>
              </div>
            </div>

            {/* Contract Architecture Filter */}
            <div className="space-y-3 pt-3 border-t border-[#2a2a2c]">
              <div className="text-[11px] font-mono-telemetry uppercase text-[#8e8c90]">
                CONTRACT ARCHITECTURE
              </div>
              <div className="space-y-2 text-xs font-mono-telemetry text-[#c8c6c9]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-[#e8342a] rounded" />
                  <span>Direct Contract (1099)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-[#e8342a] rounded" />
                  <span>Full-Time Placement (W2)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-[#e8342a] rounded" />
                  <span>Milestone / Fixed Scope</span>
                </label>
              </div>
            </div>

            {/* Deployment Target Filter */}
            <div className="space-y-3 pt-3 border-t border-[#2a2a2c]">
              <div className="text-[11px] font-mono-telemetry uppercase text-[#8e8c90]">
                DEPLOYMENT TARGET
              </div>
              <div className="space-y-2 text-xs font-mono-telemetry text-[#c8c6c9]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-[#e8342a] rounded" />
                  <span>Fully Remote (Global)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-[#e8342a] rounded" />
                  <span>Remote (US Timezones)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="accent-[#e8342a] rounded" />
                  <span>Hybrid / Onsite</span>
                </label>
              </div>
            </div>

            {/* Real-Time Skill Telemetry */}
            <div className="p-4 rounded bg-[#201f22] border border-[#353437] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-telemetry">
                <span className="text-[#8e8c90]">SKILL OVERLAP:</span>
                <span className="text-emerald-400 font-bold">
                  {averageMatchScore > 0 ? `${averageMatchScore}% AVG` : "--"}
                </span>
              </div>
              <div className="w-full bg-[#2a2a2c] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${averageMatchScore}%` }}
                />
              </div>
              <p className="text-[10px] font-mono-telemetry text-[#8e8c90]">
                {recommendations.length > 0
                  ? `Calculated across ${recommendations.length} recommended contracts.`
                  : "Upload a resume to compute skill affinity."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

