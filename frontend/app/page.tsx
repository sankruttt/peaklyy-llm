"use client";

import Link from "next/link";

export default function LandingPage() {
  const tracks = [
    { title: "Distributed Core & Backend", tech: "Python, FastAPI, PostgreSQL, Redis", icon: "dns" },
    { title: "Next.js & Frontend Architecture", tech: "TypeScript, React 19, Tailwind, Microfrontends", icon: "web" },
    { title: "Applied ML & Neural Workflows", tech: "PyTorch, LangChain, Structured Extraction", icon: "psychology" },
    { title: "Cloud & Kubernetes Infrastructure", tech: "Docker, Helm, Terraform, Multi-Region", icon: "cloud_sync" },
    { title: "Product & Systems UI/UX", tech: "Design Systems, Motion, Space Grotesk", icon: "palette" },
    { title: "Data Pipelines & Telemetry", tech: "Asyncio, Kafka, DuckDB, Vector Store", icon: "dataset" },
  ];

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 text-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#e8342a]/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded bg-[#201f22] border border-[#353437] text-[#e8342a] text-xs font-mono-telemetry font-bold mb-8">
          <span className="w-2 h-2 rounded-full bg-[#e8342a] animate-pulse" />
          <span>CAREER RADAR // NEURAL COPILOT 2.4</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none mb-6 font-headline text-[#e5e1e4]">
          ENGINEERING GIGS WITH <span className="text-[#e8342a]">NEURAL PRECISION.</span>
        </h1>

        <p className="text-sm sm:text-base text-[#8e8c90] max-w-2xl mx-auto mb-10 font-mono-telemetry leading-relaxed">
          Upload your resume specification, run structured Gemma 4 31B semantic extraction, and unlock database-backed contract recommendations with real-time telemetry.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/resume/upload"
            className="w-full sm:w-auto btn-primary-stitch text-xs px-8 py-3.5 flex items-center justify-center gap-2 font-mono-telemetry font-bold"
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            <span>INITIALIZE RESUME PARSER</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>

          <Link
            href="/recommendations"
            className="w-full sm:w-auto btn-secondary-stitch text-xs px-8 py-3.5 flex items-center justify-center gap-2 font-mono-telemetry"
          >
            <span className="material-symbols-outlined text-sm text-[#e8342a]">work</span>
            <span>EXPLORE GIG RADAR</span>
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="mt-16 pt-10 border-t border-[#2a2a2c] grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-headline font-bold text-[#e5e1e4]">
              <span className="material-symbols-outlined text-xs text-[#e8342a]">verified</span>
              <span>STRUCTURED LLM</span>
            </div>
            <p className="text-[11px] font-mono-telemetry text-[#8e8c90]">Gemma 4 31B semantic profiling.</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-headline font-bold text-[#e5e1e4]">
              <span className="material-symbols-outlined text-xs text-emerald-400">tune</span>
              <span>HYBRID SCORING</span>
            </div>
            <p className="text-[11px] font-mono-telemetry text-[#8e8c90]">TF-IDF + Cosine compatibility rating.</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-headline font-bold text-[#e5e1e4]">
              <span className="material-symbols-outlined text-xs text-[#ffb4aa]">psychology</span>
              <span>NEURAL COPILOT</span>
            </div>
            <p className="text-[11px] font-mono-telemetry text-[#8e8c90]">Contextual career negotiation & prep.</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-headline font-bold text-[#e5e1e4]">
              <span className="material-symbols-outlined text-xs text-emerald-400">database</span>
              <span>POSTGRES NEON</span>
            </div>
            <p className="text-[11px] font-mono-telemetry text-[#8e8c90]">Production-grade JWT data isolation.</p>
          </div>
        </div>
      </section>

      {/* 3 Pillars Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-headline uppercase text-[#e5e1e4]">
            THREE CORE PLATFORM NODES
          </h2>
          <p className="text-xs font-mono-telemetry text-[#8e8c90] max-w-lg mx-auto">
            Unified telemetry to calibrate your profile, discover contracts, and accelerate negotiation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-8 rounded bg-[#1c1b1d] border border-[#353437] hover:border-[#e8342a]/60 transition-all flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded bg-[#201f22] border border-[#353437] flex items-center justify-center text-[#e8342a]">
                <span className="material-symbols-outlined text-xl">description</span>
              </div>
              <h3 className="text-base font-bold font-headline uppercase text-[#e5e1e4]">
                01. RESUME INTELLIGENCE
              </h3>
              <p className="text-xs text-[#8e8c90] font-mono-telemetry leading-relaxed">
                Extracts languages, framework competencies, responsibilities, projects, and diagnostic weaknesses from PDF/DOCX files.
              </p>
            </div>
            <Link
              href="/resume/analysis"
              className="text-xs font-mono-telemetry text-[#e8342a] flex items-center gap-1 group-hover:translate-x-1 transition-transform"
            >
              <span>INSPECT RADAR DIAGNOSTIC</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </Link>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded bg-[#1c1b1d] border border-[#e8342a]/40 hover:border-[#e8342a] transition-all flex flex-col justify-between space-y-6 group shadow-lg shadow-[#e8342a]/5">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded bg-[#e8342a] flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-xl">work</span>
              </div>
              <h3 className="text-base font-bold font-headline uppercase text-[#e5e1e4]">
                02. HYBRID GIG MATCHING
              </h3>
              <p className="text-xs text-[#8e8c90] font-mono-telemetry leading-relaxed">
                Computes weighted compatibility percentages against active contracts with personalized synthesis and missing capability tags.
              </p>
            </div>
            <Link
              href="/recommendations"
              className="text-xs font-mono-telemetry text-[#e8342a] flex items-center gap-1 group-hover:translate-x-1 transition-transform"
            >
              <span>VIEW GIG MATCHES</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </Link>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded bg-[#1c1b1d] border border-[#353437] hover:border-[#e8342a]/60 transition-all flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded bg-[#201f22] border border-[#353437] flex items-center justify-center text-[#e8342a]">
                <span className="material-symbols-outlined text-xl">psychology</span>
              </div>
              <h3 className="text-base font-bold font-headline uppercase text-[#e5e1e4]">
                03. NEURAL CAREER COPILOT
              </h3>
              <p className="text-xs text-[#8e8c90] font-mono-telemetry leading-relaxed">
                A conversational advisor with real-time context of your analyzed resume, strengths, and targeted contract specifications.
              </p>
            </div>
            <Link
              href="/assistant"
              className="text-xs font-mono-telemetry text-[#e8342a] flex items-center gap-1 group-hover:translate-x-1 transition-transform"
            >
              <span>OPEN ASSISTANT CHAT</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Opportunity Tracks */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold font-headline uppercase text-[#e5e1e4]">
              ACTIVE OPPORTUNITY TRACKS
            </h3>
            <p className="text-xs font-mono-telemetry text-[#8e8c90]">Contracts verified in database repository.</p>
          </div>
          <Link href="/recommendations" className="text-xs font-mono-telemetry text-[#e8342a] hover:underline">
            EXPLORE ALL →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map((t, idx) => (
            <div
              key={idx}
              className="p-4 rounded bg-[#1c1b1d] border border-[#353437] hover:border-[#e8342a]/50 transition-all flex items-center justify-between group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#e8342a]">{t.icon}</span>
                  <h4 className="text-xs font-bold font-headline text-[#e5e1e4] group-hover:text-[#ffb4aa] transition-colors">
                    {t.title}
                  </h4>
                </div>
                <p className="text-[10px] font-mono-telemetry text-[#8e8c90]">{t.tech}</p>
              </div>
              <span className="material-symbols-outlined text-xs text-[#8e8c90] group-hover:text-white transition-colors">
                chevron_right
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

