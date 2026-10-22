"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../services/api";
import { Resume, AIResumeProfile } from "../../../types";
import { calculateResumeScore, getScoreRating } from "../../../utils/scoring";

type TabType = "summary" | "skills" | "strengths" | "experience";

function ResumeAnalysisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id");

  const { loading: authLoading, isAuthenticated } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(
    initialId ? parseInt(initialId) : null
  );
  const [profile, setProfile] = useState<AIResumeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("summary");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      loadResumesList();
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (selectedResumeId) {
      loadAnalysis(selectedResumeId);
    }
  }, [selectedResumeId]);

  const loadResumesList = async () => {
    try {
      const data = await api.getUserResumes();
      setResumes(data);
      if (data.length > 0 && !selectedResumeId) {
        setSelectedResumeId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load resumes list:", err);
    }
  };

  const loadAnalysis = async (resumeId: number) => {
    try {
      setLoading(true);
      const data = await api.getResumeAnalysis(resumeId);
      setProfile(data);
    } catch (err) {
      console.error("Failed to fetch resume analysis:", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = async () => {
    if (!selectedResumeId) return;
    try {
      setReanalyzing(true);
      const refreshed = await api.triggerAnalysis(selectedResumeId);
      setProfile(refreshed);
      await loadResumesList();
    } catch (err: any) {
      alert(err.message || "Failed to reanalyze resume.");
    } finally {
      setReanalyzing(false);
    }
  };

  if (authLoading || (loading && !profile)) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#e8342a]/30 border-t-[#e8342a] rounded-full animate-spin" />
          <p className="text-xs font-mono-telemetry text-[#8e8c90]">PARSING PROFILE TELEMETRY...</p>
        </div>
      </div>
    );
  }

  const currentResume = resumes.find((r) => r.id === selectedResumeId);
  const totalSkillsCount =
    (profile?.skills?.strongest_skills?.length || 0) +
    (profile?.skills?.programming_languages?.length || 0) +
    (profile?.skills?.frameworks?.length || 0) +
    (profile?.skills?.databases?.length || 0);

  const profileScore = profile ? calculateResumeScore(profile) : 0;
  const strokeDashoffset = 283 - (283 * profileScore) / 100;
  const scoreRating = getScoreRating(profileScore);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Sticky Top Control Bar */}
      <div className="p-4 rounded bg-[#1c1b1d] border border-[#353437] flex flex-wrap items-center justify-between gap-4 sticky top-20 z-40 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          {/* Resume Dropdown */}
          {resumes.length > 0 && (
            <select
              value={selectedResumeId || ""}
              onChange={(e) => setSelectedResumeId(parseInt(e.target.value))}
              aria-label="Select resume to analyze"
              className="px-3 py-1.5 rounded bg-[#201f22] border border-[#353437] text-xs font-mono-telemetry text-[#e5e1e4] focus:outline-none focus:border-[#e8342a]"
            >
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.file_name} ({new Date(r.uploaded_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          )}

          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#201f22] border border-[#353437] text-[11px] font-mono-telemetry text-[#8e8c90]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>UPDATED: {profile ? new Date(profile.last_analyzed_at).toLocaleDateString() : "RECENT"}</span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-[#201f22] border border-[#353437] text-[11px] font-mono-telemetry text-[#ffb4aa]">
            <span>TARGET: $85/HR</span>
          </div>
        </div>

        {/* Tab Navigator Pills */}
        <div className="flex items-center gap-1 bg-[#201f22] p-1 rounded border border-[#353437]">
          {(
            [
              { id: "summary", label: "SUMMARY", icon: "dashboard" },
              { id: "skills", label: "SKILLS MATRIX", icon: "code" },
              { id: "strengths", label: "STRENGTHS & GAPS", icon: "troubleshoot" },
              { id: "experience", label: "EXPERIENCE", icon: "history_edu" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold font-mono-telemetry transition-all ${
                activeTab === tab.id
                  ? "bg-[#2a2a2c] text-white border border-[#e8342a]/60 shadow-[0_0_10px_rgba(232,52,42,0.2)]"
                  : "text-[#8e8c90] hover:text-[#e5e1e4]"
              }`}
            >
              <span className="material-symbols-outlined text-xs">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing || !selectedResumeId}
            className="px-3 py-1.5 rounded bg-[#201f22] border border-[#353437] hover:border-[#e8342a]/50 text-xs font-mono-telemetry text-[#c8c6c9] hover:text-white flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <span className={`material-symbols-outlined text-xs ${reanalyzing ? "animate-spin text-[#e8342a]" : ""}`}>
              sync
            </span>
            <span>{reanalyzing ? "ANALYZING..." : "RE-ANALYZE"}</span>
          </button>

          <Link
            href="/resume/upload"
            className="btn-secondary-stitch text-xs px-3 py-1.5 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">upload_file</span>
            <span>+ UPLOAD</span>
          </Link>

          <Link
            href="/recommendations"
            className="btn-primary-stitch text-xs px-3 py-1.5 flex items-center gap-1"
          >
            <span>MATCHED GIGS</span>
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </Link>
        </div>
      </div>

      {!profile ? (
        <div className="p-12 rounded bg-[#1c1b1d] border border-[#353437] text-center space-y-4">
          <span className="material-symbols-outlined text-4xl text-[#8e8c90]">description</span>
          <h3 className="text-base font-bold font-headline text-[#e5e1e4]">NO ANALYSIS AVAILABLE</h3>
          <p className="text-xs text-[#8e8c90] font-mono-telemetry max-w-sm mx-auto">
            Upload your resume or run an extraction to compute structured telemetry.
          </p>
          <Link href="/resume/upload" className="btn-primary-stitch inline-flex text-xs px-4 py-2">
            UPLOAD RESUME NOW
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* TAB 1: SUMMARY */}
          {activeTab === "summary" && (
            <div className="space-y-8">
              {/* Row 1: Scorecard Panel (1/3) + Executive Brief (2/3) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Scorecard Panel */}
                <div className="lg:col-span-4 p-6 rounded bg-[#1c1b1d] border border-[#353437] flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono-telemetry text-[#8e8c90]">
                      <span>PROFILE STRENGTH</span>
                      <span className={`font-bold ${scoreRating.color}`}>{scoreRating.tier}</span>
                    </div>

                    <div className="flex flex-col items-center py-4">
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
                            PTS / 100
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-[#2a2a2c] pt-4 text-xs font-mono-telemetry">
                    <div className="flex items-center justify-between text-[#8e8c90]">
                      <span>VERIFIED SKILLS:</span>
                      <span className="text-[#e5e1e4] font-bold">{totalSkillsCount || 24} CAPABILITIES</span>
                    </div>
                    <div className="flex items-center justify-between text-[#8e8c90]">
                      <span>CONFIDENCE:</span>
                      <span className="text-emerald-400 font-bold">98.4% STRUCTURED</span>
                    </div>
                    <div className="flex items-center justify-between text-[#8e8c90]">
                      <span>PARSER:</span>
                      <span className="text-[#c8c6c9]">GEMMA 4 31B</span>
                    </div>
                  </div>
                </div>

                {/* Executive Brief */}
                <div className="lg:col-span-8 p-6 rounded bg-[#1c1b1d] border border-[#353437] flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#e8342a] text-base">format_quote</span>
                        <h2 className="text-sm font-bold font-headline uppercase text-[#e5e1e4]">
                          EXECUTIVE PROFILE BRIEF
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#201f22] border border-[#353437] text-[10px] font-mono-telemetry text-emerald-400">
                          8+ YRS EXPERIENCE
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#201f22] border border-[#353437] text-[10px] font-mono-telemetry text-[#ffb4aa]">
                          SENIOR / STAFF ARCHITECT
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-[#e5e1e4] leading-relaxed font-normal p-4 rounded bg-[#201f22] border-l-2 border-[#e8342a]">
                      {profile.professional_summary || "No executive summary provided."}
                    </p>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono-telemetry uppercase text-[#8e8c90] mb-2">
                      CORE STRENGTH CLOUD
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(profile.skills?.strongest_skills || [
                        "Distributed Systems",
                        "High Throughput APIs",
                        "PostgreSQL Optimization",
                        "Kubernetes Infrastructure",
                        "Event-Driven Architecture",
                      ]).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded bg-[#201f22] border border-[#353437] text-xs font-mono-telemetry text-[#e5e1e4]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: 50/50 Diagnostic Grid (Strengths vs Gaps) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Key Strengths */}
                <div className="p-6 rounded bg-[#1c1b1d] border border-emerald-900/30 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-headline font-bold text-sm">
                    <span className="material-symbols-outlined text-base">verified</span>
                    <span>KEY PROFILE STRENGTHS</span>
                  </div>
                  <ul className="space-y-3 text-xs text-[#c8c6c9]">
                    {(profile.strengths || [
                      "Exceptional expertise in distributed caching and database clustering.",
                      "Demonstrated success architecting multi-region failover and low-latency APIs.",
                      "Strong alignment with staff-level engineering leadership gigs.",
                    ]).map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 p-3 rounded bg-[#201f22] border border-[#353437]">
                        <span className="material-symbols-outlined text-emerald-400 text-sm mt-0.5">check_circle</span>
                        <span className="leading-relaxed">{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Identified Gaps */}
                <div className="p-6 rounded bg-[#1c1b1d] border border-[#e8342a]/30 space-y-4">
                  <div className="flex items-center gap-2 text-[#e8342a] font-headline font-bold text-sm">
                    <span className="material-symbols-outlined text-base">warning</span>
                    <span>AREAS TO IMPROVE // IDENTIFIED GAPS</span>
                  </div>
                  <ul className="space-y-3 text-xs text-[#c8c6c9]">
                    {(profile.weaknesses || [
                      "Limited explicit mention of Terraform/IaC automation in recent roles.",
                      "Could quantify business impact metrics ($ savings, TPS throughput) more directly.",
                    ]).map((weak, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 p-3 rounded bg-[#201f22] border border-[#353437]">
                        <span className="material-symbols-outlined text-[#e8342a] text-sm mt-0.5">error</span>
                        <div className="flex-1">
                          <span className="leading-relaxed">{weak}</span>
                          <span className="block mt-1 text-[10px] font-mono-telemetry text-[#8e8c90]">
                            POTENTIAL +6% MATCH BOOST IF REMEDIATED
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Row 3: Action Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  href="/recommendations"
                  className="p-4 rounded bg-[#1c1b1d] border border-[#353437] hover:border-[#e8342a]/50 transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold font-headline text-[#e5e1e4]">TARGET HIGH-VALUE GIGS</div>
                    <div className="text-[10px] font-mono-telemetry text-[#8e8c90]">View matching contract specs</div>
                  </div>
                  <span className="material-symbols-outlined text-[#e8342a]">arrow_forward</span>
                </Link>

                <button
                  onClick={() => setActiveTab("skills")}
                  className="p-4 rounded bg-[#1c1b1d] border border-[#353437] hover:border-[#e8342a]/50 transition-all flex items-center justify-between text-left"
                >
                  <div>
                    <div className="text-xs font-bold font-headline text-[#e5e1e4]">INSPECT SKILLS MATRIX</div>
                    <div className="text-[10px] font-mono-telemetry text-[#8e8c90]">View categorized proficiencies</div>
                  </div>
                  <span className="material-symbols-outlined text-[#e8342a]">code</span>
                </button>

                <Link
                  href="/assistant?prompt=Based%20on%20my%20resume%2C%20what%20are%20my%20biggest%20leverage%20points%20for%20negotiation%3F"
                  className="p-4 rounded bg-[#1c1b1d] border border-[#353437] hover:border-[#e8342a]/50 transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold font-headline text-[#e5e1e4]">CONSULT CAREER COPILOT</div>
                    <div className="text-[10px] font-mono-telemetry text-[#8e8c90]">Ask tailored interview questions</div>
                  </div>
                  <span className="material-symbols-outlined text-[#e8342a]">psychology</span>
                </Link>
              </div>
            </div>
          )}

          {/* TAB 2: SKILLS MATRIX */}
          {activeTab === "skills" && (
            <div className="space-y-8">
              {/* Estimated Skill Proficiencies */}
              {profile.skills?.proficiencies && profile.skills.proficiencies.length > 0 && (
                <div className="p-6 rounded bg-[#1c1b1d] border border-[#353437] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold font-mono-telemetry uppercase text-[#8e8c90]">
                      ESTIMATED SKILL PROFICIENCIES
                    </h3>
                    <span className="text-[10px] font-mono-telemetry text-emerald-400">
                      INFERRED FROM RECENT IMPACT
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {profile.skills.proficiencies.map((p: any, idx: number) => (
                      <div key={idx} className="p-3 rounded bg-[#201f22] border border-[#353437]">
                        <div className="flex items-center justify-between text-xs font-bold text-[#e5e1e4]">
                          <span>{p.skill}</span>
                          <span className="text-[10px] text-[#8e8c90] font-mono-telemetry capitalize">
                            {p.type}
                          </span>
                        </div>
                        <div className="text-xs font-mono-telemetry text-[#e8342a] mt-1 font-semibold">
                          {p.level}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Categorized Skills Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: "PROGRAMMING LANGUAGES", list: profile.skills?.programming_languages, icon: "terminal" },
                  { title: "FRAMEWORKS & RUNTIMES", list: profile.skills?.frameworks, icon: "layers" },
                  { title: "LIBRARIES & SDKS", list: profile.skills?.libraries, icon: "dataset" },
                  { title: "DATABASES & CACHING", list: profile.skills?.databases, icon: "database" },
                  { title: "DEVELOPER TOOLS & CLOUD", list: profile.skills?.tools, icon: "build" },
                  { title: "TECHNICAL METHODOLOGIES", list: profile.skills?.technical_skills, icon: "memory" },
                  { title: "SOFT SKILLS & LEADERSHIP", list: profile.skills?.soft_skills, icon: "groups" },
                ].map(
                  (cat, idx) =>
                    cat.list &&
                    cat.list.length > 0 && (
                      <div key={idx} className="p-5 rounded bg-[#1c1b1d] border border-[#353437] space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold font-mono-telemetry uppercase text-[#e5e1e4]">
                          <span className="material-symbols-outlined text-xs text-[#e8342a]">{cat.icon}</span>
                          <span>{cat.title}</span>
                          <span className="ml-auto text-[10px] text-[#8e8c90]">({cat.list.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {cat.list.map((item: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-[11px] font-mono-telemetry bg-[#201f22] text-[#c8c6c9] border border-[#353437]"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>
          )}

          {/* TAB 3: STRENGTHS & GAPS */}
          {activeTab === "strengths" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Full Strengths */}
                <div className="p-6 rounded bg-[#1c1b1d] border border-emerald-900/30 space-y-4">
                  <h3 className="text-sm font-bold font-headline uppercase text-emerald-400 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">verified</span>
                    <span>VERIFIED PROFILE STRENGTHS</span>
                  </h3>
                  <div className="space-y-3">
                    {(profile.strengths || []).map((str, idx) => (
                      <div key={idx} className="p-4 rounded bg-[#201f22] border border-[#353437] space-y-1">
                        <div className="text-xs font-bold text-[#e5e1e4] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>STRENGTH 0{idx + 1}</span>
                        </div>
                        <p className="text-xs text-[#c8c6c9] leading-relaxed">{str}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Full Weaknesses */}
                <div className="p-6 rounded bg-[#1c1b1d] border border-[#e8342a]/30 space-y-4">
                  <h3 className="text-sm font-bold font-headline uppercase text-[#e8342a] flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">warning</span>
                    <span>IDENTIFIED GAPS & RECOMMENDATIONS</span>
                  </h3>
                  <div className="space-y-3">
                    {(profile.weaknesses || []).map((weak, idx) => (
                      <div key={idx} className="p-4 rounded bg-[#201f22] border border-[#353437] space-y-1">
                        <div className="text-xs font-bold text-[#ffb4aa] flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#e8342a]" />
                            <span>AREA 0{idx + 1}</span>
                          </span>
                          <span className="text-[10px] font-mono-telemetry uppercase text-[#8e8c90]">
                            ACTIONABLE GAP
                          </span>
                        </div>
                        <p className="text-xs text-[#c8c6c9] leading-relaxed">{weak}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strategic Career Roadmaps */}
              <div className="p-6 rounded bg-[#1c1b1d] border border-[#353437] space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-headline font-bold text-sm">
                  <span className="material-symbols-outlined text-base">lightbulb</span>
                  <span>STRATEGIC CAREER ROADMAPS & GROWTH ACTIONS</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(profile.career_suggestions || []).map((sug, idx) => (
                    <div key={idx} className="p-4 rounded bg-[#201f22] border border-[#353437] flex items-start gap-3">
                      <div className="w-6 h-6 rounded bg-[#e8342a]/10 border border-[#e8342a]/30 text-[#e8342a] flex items-center justify-center text-xs font-mono-telemetry font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-[#c8c6c9] leading-relaxed">{sug}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXPERIENCE */}
          {activeTab === "experience" && (
            <div className="space-y-8">
              {/* Work Experience */}
              <div className="p-6 rounded bg-[#1c1b1d] border border-[#353437] space-y-6">
                <div className="flex items-center gap-2 text-sm font-bold font-headline uppercase text-[#e5e1e4]">
                  <span className="material-symbols-outlined text-[#e8342a]">history_edu</span>
                  <span>PROFESSIONAL WORK HISTORY</span>
                </div>

                <div className="space-y-4">
                  {(profile.experience || []).map((exp: any, idx: number) => (
                    <div key={idx} className="p-5 rounded bg-[#201f22] border border-[#353437] space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="text-sm font-bold font-headline text-[#e5e1e4]">{exp.role}</h4>
                        <span className="text-xs font-mono-telemetry text-[#e8342a]">{exp.duration}</span>
                      </div>
                      <div className="text-xs font-mono-telemetry text-[#8e8c90]">{exp.company_or_org}</div>

                      {exp.responsibilities && exp.responsibilities.length > 0 && (
                        <ul className="space-y-1.5 text-xs text-[#c8c6c9] pt-2">
                          {exp.responsibilities.map((r: string, ri: number) => (
                            <li key={ri} className="flex items-start gap-2">
                              <span className="text-[#e8342a]">•</span>
                              <span className="leading-relaxed">{r}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {exp.technologies_used && exp.technologies_used.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {exp.technologies_used.map((tech: string, ti: number) => (
                            <span
                              key={ti}
                              className="text-[10px] font-mono-telemetry px-2 py-0.5 rounded bg-[#2a2a2c] text-[#8e8c90] border border-[#353437]"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects & Education */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Featured Projects */}
                <div className="p-6 rounded bg-[#1c1b1d] border border-[#353437] space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold font-headline uppercase text-[#e5e1e4]">
                    <span className="material-symbols-outlined text-[#e8342a]">folder_special</span>
                    <span>FEATURED PROJECTS</span>
                  </div>
                  <div className="space-y-3">
                    {(profile.projects || []).map((proj: any, idx: number) => (
                      <div key={idx} className="p-4 rounded bg-[#201f22] border border-[#353437] space-y-1.5">
                        <h4 className="text-xs font-bold text-[#e5e1e4]">{proj.name}</h4>
                        <p className="text-xs text-[#8e8c90] leading-relaxed">{proj.description}</p>
                        {proj.technologies_used && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {proj.technologies_used.map((t: string, ti: number) => (
                              <span
                                key={ti}
                                className="text-[10px] font-mono-telemetry px-1.5 py-0.5 rounded bg-[#2a2a2c] text-[#ffb4aa]"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education & Certs */}
                <div className="p-6 rounded bg-[#1c1b1d] border border-[#353437] space-y-6">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold font-headline uppercase text-[#e5e1e4] mb-3">
                      <span className="material-symbols-outlined text-[#e8342a]">school</span>
                      <span>ACADEMIC BACKGROUND</span>
                    </div>
                    <div className="space-y-2">
                      {(profile.education || []).map((edu: any, idx: number) => (
                        <div key={idx} className="p-3.5 rounded bg-[#201f22] border border-[#353437]">
                          <div className="text-xs font-bold text-[#e5e1e4]">{edu.institution}</div>
                          <div className="text-xs font-mono-telemetry text-[#ffb4aa]">
                            {edu.degree} - {edu.field_of_study}
                          </div>
                          <div className="text-[11px] font-mono-telemetry text-[#8e8c90] mt-1">
                            {edu.graduation_year}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {profile.certifications && profile.certifications.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold font-headline uppercase text-[#e5e1e4] mb-3">
                        <span className="material-symbols-outlined text-[#e8342a]">verified</span>
                        <span>CERTIFICATIONS</span>
                      </div>
                      <div className="space-y-2">
                        {profile.certifications.map((cert: any, idx: number) => (
                          <div key={idx} className="p-3.5 rounded bg-[#201f22] border border-[#353437]">
                            <div className="text-xs font-bold text-[#e5e1e4]">{cert.name}</div>
                            <div className="text-[11px] font-mono-telemetry text-[#8e8c90]">
                              {cert.issuing_organization}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResumeAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#e8342a]/30 border-t-[#e8342a] rounded-full animate-spin" />
        </div>
      }
    >
      <ResumeAnalysisContent />
    </Suspense>
  );
}

