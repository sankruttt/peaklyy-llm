"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#353437] bg-[#1c1b1d] text-[#c8c6c9] text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-[#e8342a] flex items-center justify-center text-white font-bold text-xs font-headline">
                P
              </div>
              <span className="font-bold text-base text-[#e5e1e4] font-headline tracking-tight">
                PEAKLYY<span className="text-[#e8342a]">.</span>
              </span>
            </div>
            <p className="text-[11px] text-[#8e8c90] leading-relaxed">
              Neural Career Radar & Hybrid Gig Recommendation Engine for elite engineers and designers.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#201f22] border border-[#353437] text-[10px] font-mono-telemetry text-[#e8342a]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e8342a] animate-pulse" />
              <span>HYBRID MATCHER v2.4</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#e5e1e4] font-headline mb-3">
              Platform Nodes
            </h4>
            <ul className="space-y-2 text-[11px] font-mono-telemetry">
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  /dashboard
                </Link>
              </li>
              <li>
                <Link href="/resume/analysis" className="hover:text-white transition-colors">
                  /resume/analysis
                </Link>
              </li>
              <li>
                <Link href="/recommendations" className="hover:text-white transition-colors">
                  /recommendations
                </Link>
              </li>
              <li>
                <Link href="/assistant" className="hover:text-white transition-colors">
                  /assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Intelligence */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#e5e1e4] font-headline mb-3">
              Telemetry
            </h4>
            <ul className="space-y-1.5 text-[11px] text-[#8e8c90] font-mono-telemetry">
              <li>LATENCY: &lt; 400ms</li>
              <li>MATCH CRITERIA: TF-IDF + Cosine</li>
              <li>PARSER: Gemma 4 31B Structured</li>
              <li>SECURITY: JWT Strict Isolation</li>
            </ul>
          </div>

          {/* Architecture */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#e5e1e4] font-headline mb-3">
              Architecture
            </h4>
            <div className="space-y-1.5 text-[11px] text-[#8e8c90] font-mono-telemetry">
              <div>STACK: Next.js 16 + FastAPI</div>
              <div>DATABASE: PostgreSQL Neon Cloud</div>
              <div>STATE: Production Synchronized</div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#2a2a2c] flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-[#8e8c90] font-mono-telemetry">
          <p>© 2026 PEAKLYY. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-white cursor-pointer">PRIVACY PROTOCOL</span>
            <span className="hover:text-white cursor-pointer">TERMS OF SERVICE</span>
            <span className="hover:text-white cursor-pointer">API TELEMETRY</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
