"use client";

import { usePathname } from "next/navigation";
import { Bell, RefreshCw } from "lucide-react";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/signals": "Signals",
  "/watchlist": "Watchlist",
  "/news": "News Feed",
};

export default function Header({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  const title = titles[pathname] ?? "PulseTrader";
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "PT";

  return (
    <header className="h-16 border-b border-gray-800/60 flex items-center justify-between px-6 bg-[#080a0f]/80 backdrop-blur-sm sticky top-0 z-10">
      <div>
        <h1 className="text-base font-semibold text-white">{title}</h1>
        <p className="text-xs text-gray-500 hidden sm:block">
          AI-powered trading signals · Live data
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Live indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">Live</span>
        </div>

        <button className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>

        <button className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition relative" title="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-indigo-500/20 ring-1 ring-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400">
          {initials}
        </div>
      </div>
    </header>
  );
}
