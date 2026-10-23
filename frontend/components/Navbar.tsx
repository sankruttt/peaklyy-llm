"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { LogOut } from "lucide-react";
import peaklyyLogo from "@/public/peaklyy_logo.png";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { name: "Resume AI", href: "/resume/analysis", icon: "description" },
    { name: "Gig Matches", href: "/recommendations", icon: "work" },
    { name: "Mawa", href: "/assistant", icon: "psychology" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#1c1b1d]/90 backdrop-blur-md border-b border-[#353437] px-4 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-full overflow-hidden shadow-lg shadow-[#e8342a]/20 group-hover:scale-105 transition-transform shrink-0 border border-[#353437]">
              <Image
                src={peaklyyLogo}
                alt="Peaklyy Logo"
                width={36}
                height={36}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-[#e5e1e4] group-hover:text-white transition-colors font-headline">
                PEAKLYY<span className="text-[#e8342a]">.</span>
              </span>
            </div>
          </Link>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href === "/resume/analysis" && pathname.startsWith("/resume")) ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
                    isActive
                      ? "text-white bg-[#2a2a2c] border border-[#e8342a]/60 shadow-[0_0_12px_rgba(232,52,42,0.2)]"
                      : "text-[#c8c6c9] hover:text-white hover:bg-[#201f22]"
                  }`}
                >
                  <span className={`material-symbols-outlined text-[16px] ${isActive ? "text-[#e8342a]" : "text-[#8e8c90]"}`}>
                    {link.icon}
                  </span>
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Status & Auth */}
        <div className="flex items-center gap-4">

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded bg-[#201f22] border border-[#353437] hover:border-[#e8342a]/50 text-xs font-medium text-[#e5e1e4] transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-[#e8342a]/20 text-[#e8342a] border border-[#e8342a]/40 flex items-center justify-center text-[10px] font-bold font-headline">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline font-mono-telemetry">{user.name.split(" ")[0]}</span>
              </Link>
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded bg-[#201f22] border border-[#353437] text-[#c8c6c9] hover:text-[#e8342a] hover:border-[#e8342a]/40 transition-all flex items-center justify-center"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded text-xs font-semibold tracking-wider uppercase text-[#c8c6c9] hover:text-white hover:bg-[#201f22] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="btn-primary-stitch text-xs px-3.5 py-1.5"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

