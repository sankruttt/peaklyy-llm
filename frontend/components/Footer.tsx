"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-[#353437] bg-[#1c1b1d] text-[#c8c6c9] text-xs mt-auto py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 border border-[#353437] shadow-sm shadow-[#e8342a]/20 group-hover:scale-105 transition-transform">
            <Image
              src="/peaklyy_logo.png"
              alt="Peaklyy Logo"
              fill
              sizes="28px"
              className="object-cover"
            />
          </div>
          <span className="font-bold text-base text-[#e5e1e4] font-headline tracking-tight">
            PEAKLYY<span className="text-[#e8342a]">.</span>
          </span>
        </Link>

        {/* Rights Reserved */}
        <p className="text-[11px] text-[#8e8c90] font-mono-telemetry">
          © {new Date().getFullYear()} PEAKLYY. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
}
