"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { GigRecommendation } from "../../types";
import { formatINR } from "../../utils/currency";

function HeadTailSlider({
  min,
  max,
  onChangeMin,
  onChangeMax,
}: {
  min: number;
  max: number;
  onChangeMin: (val: number) => void;
  onChangeMax: (val: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeThumb, setActiveThumb] = useState<"head" | "tail" | null>(null);

  const calcPercent = (clientX: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const raw = ((clientX - rect.left) / rect.width) * 100;
    return Math.round(Math.max(0, Math.min(100, raw)));
  };

  const handlePointerDown = (thumb: "head" | "tail", e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveThumb(thumb);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeThumb) return;
    const p = calcPercent(e.clientX);
    if (activeThumb === "head") {
      onChangeMin(Math.min(p, max));
    } else {
      onChangeMax(Math.max(p, min));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeThumb) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setActiveThumb(null);
    }
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    const p = calcPercent(e.clientX);
    const distHead = Math.abs(p - min);
    const distTail = Math.abs(p - max);
    if (distHead < distTail) {
      onChangeMin(Math.min(p, max));
    } else {
      onChangeMax(Math.max(p, min));
    }
  };

  return (
    <div className="select-none py-1">
      {/* Clean Single Line Track with Head and Tail Thumbs */}
      <div className="relative py-2">
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          className="relative h-2 bg-[#141315] rounded-full border border-[#353437] cursor-pointer"
        >
          {/* Active colored line segment connecting Head to Tail */}
          <div
            className="absolute top-0 bottom-0 bg-gradient-to-r from-[#e8342a] via-[#f59e0b] to-[#10b981] rounded-full pointer-events-none"
            style={{
              left: `${min}%`,
              width: `${Math.max(0, max - min)}%`,
            }}
          />

          {/* HEAD THUMB (Starting Point) */}
          <div
            onPointerDown={(e) => handlePointerDown("head", e)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ left: `${min}%` }}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 touch-none cursor-grab active:cursor-grabbing p-2 -m-2"
          >
            <div
              className={`w-4 h-4 rounded-full bg-[#e8342a] border-2 border-white shadow-[0_0_10px_rgba(232,52,42,0.8)] transition-transform flex items-center justify-center ${
                activeThumb === "head" ? "scale-125" : "hover:scale-110"
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>

          {/* TAIL THUMB (Ending Point) */}
          <div
            onPointerDown={(e) => handlePointerDown("tail", e)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ left: `${max}%` }}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 touch-none cursor-grab active:cursor-grabbing p-2 -m-2"
          >
            <div
              className={`w-4 h-4 rounded-full bg-[#10b981] border-2 border-white shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-transform flex items-center justify-center ${
                activeThumb === "tail" ? "scale-125" : "hover:scale-110"
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useAuth();

  const [recommendations, setRecommendations] = useState<GigRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [eligibilityFilter, setEligibilityFilter] = useState("all");
  const [minScore, setMinScore] = useState<number>(0);
  const [maxScore, setMaxScore] = useState<number>(100);
  const [sortBy, setSortBy] = useState<
    "match_desc" | "match_asc" | "comp_desc" | "comp_asc" | "title_asc"
  >("match_desc");
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

  const updateEligibilityFromScores = (min: number, max: number) => {
    if (min === 0 && max === 100) {
      setEligibilityFilter("all");
    } else if (min === 70 && max === 100) {
      setEligibilityFilter("eligible");
    } else if (min === 40 && max === 69) {
      setEligibilityFilter("partially");
    } else {
      setEligibilityFilter("custom");
    }
  };

  const handleMinScoreChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    if (clamped > maxScore) {
      setMaxScore(clamped);
    }
    setMinScore(clamped);
    updateEligibilityFromScores(clamped, Math.max(clamped, maxScore));
  };

  const handleMaxScoreChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    if (clamped < minScore) {
      setMinScore(clamped);
    }
    setMaxScore(clamped);
    updateEligibilityFromScores(Math.min(clamped, minScore), clamped);
  };

  const handleEligibilityTab = (tabId: string) => {
    setEligibilityFilter(tabId);
    if (tabId === "all") {
      setMinScore(0);
      setMaxScore(100);
    } else if (tabId === "eligible") {
      setMinScore(70);
      setMaxScore(100);
    } else if (tabId === "partially") {
      setMinScore(40);
      setMaxScore(69);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategoryFilter("ALL");
    setEligibilityFilter("all");
    setMinScore(0);
    setMaxScore(100);
    setSortBy("match_desc");
  };

  const parseCompensation = (compStr: string): number => {
    if (!compStr) return 0;
    const nums = compStr.replace(/,/g, "").match(/\d+/g);
    if (!nums || nums.length === 0) return 0;
    return Number(nums[nums.length - 1]);
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

  const filteredRecs = recommendations
    .filter((r) => {
      const matchesSearch =
        r.gig.title.toLowerCase().includes(search.toLowerCase()) ||
        r.gig.category.toLowerCase().includes(search.toLowerCase()) ||
        (r.gig.company ? r.gig.company.toLowerCase().includes(search.toLowerCase()) : false) ||
        r.gig.required_skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        categoryFilter === "ALL" ||
        r.gig.category.toLowerCase().includes(categoryFilter.toLowerCase());

      const matchesScoreRange =
        r.match_percentage >= minScore && r.match_percentage <= maxScore;

      return matchesSearch && matchesCategory && matchesScoreRange;
    })
    .sort((a, b) => {
      if (sortBy === "match_desc") return b.match_percentage - a.match_percentage;
      if (sortBy === "match_asc") return a.match_percentage - b.match_percentage;
      if (sortBy === "comp_desc") return parseCompensation(b.gig.compensation) - parseCompensation(a.gig.compensation);
      if (sortBy === "comp_asc") return parseCompensation(a.gig.compensation) - parseCompensation(b.gig.compensation);
      if (sortBy === "title_asc") return a.gig.title.localeCompare(b.gig.title);
      return 0;
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
              { id: "eligible", label: "ELIGIBLE" },
              { id: "partially", label: "PARTIAL" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleEligibilityTab(tab.id)}
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
              DISPLAYING <strong className="text-[#e5e1e4]">{filteredRecs.length}</strong> VERIFIED MATCHES
            </span>
            <span className="text-[11px] text-[#8e8c90] uppercase tracking-wider">
              RADAR ACTIVE
            </span>
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
                onClick={handleResetFilters}
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
                onClick={handleResetFilters}
                className="text-[10px] font-mono-telemetry text-[#e8342a] hover:underline"
              >
                RESET
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="space-y-1.5 pb-3 border-b border-[#2a2a2c]">
              <label htmlFor="sidebar-sort-select" className="text-[11px] font-mono-telemetry text-[#8e8c90] uppercase block">
                SORT CONTRACTS:
              </label>
              <div className="relative">
                <select
                  id="sidebar-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-[#201f22] border border-[#353437] hover:border-[#8e8c90] text-[#e5e1e4] text-xs font-mono-telemetry rounded px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-[#e8342a] cursor-pointer transition-colors"
                >
                  <option value="match_desc">Match %: High to Low (Best Match)</option>
                  <option value="match_asc">Match %: Low to High</option>
                  <option value="comp_desc">Compensation: High to Low</option>
                  <option value="comp_asc">Compensation: Low to High</option>
                  <option value="title_asc">Role Title (A to Z)</option>
                </select>
                <span className="material-symbols-outlined text-xs text-[#8e8c90] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                  expand_more
                </span>
              </div>
            </div>

            {/* Match Compatibility Head & Tail Slider on a Single Line */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono-telemetry">
                <span className="text-[11px] font-mono-telemetry text-[#8e8c90] uppercase">
                  MATCH COMPATIBILITY:
                </span>
                <span className="text-[10px] font-mono-telemetry text-[#8e8c90] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e8342a]"></span> HEAD
                  <span className="text-[#525054]">—</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span> TAIL
                </span>
              </div>

              {/* Unified Head & Tail Slider on a Single Line */}
              <HeadTailSlider
                min={minScore}
                max={maxScore}
                onChangeMin={handleMinScoreChange}
                onChangeMax={handleMaxScoreChange}
              />

              {/* Quick Presets */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {[
                  { label: "ALL ROLES", min: 0, max: 100, filter: "all" },
                  { label: "HIGH FIT", min: 70, max: 100, filter: "eligible" },
                  { label: "PARTIAL FIT", min: 40, max: 69, filter: "partially" },
                  { label: "PRIME FIT", min: 85, max: 100, filter: "custom" },
                ].map((preset) => {
                  const isActive = minScore === preset.min && maxScore === preset.max;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setMinScore(preset.min);
                        setMaxScore(preset.max);
                        setEligibilityFilter(preset.filter);
                      }}
                      className={`px-2 py-1 text-[10px] font-mono-telemetry rounded transition-all ${
                        isActive
                          ? "bg-[#e8342a] text-white font-bold shadow-sm"
                          : "bg-[#201f22] text-[#8e8c90] hover:text-white border border-[#353437] hover:border-[#8e8c90]"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
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

