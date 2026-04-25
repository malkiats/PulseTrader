"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  TrendingUp,
  LayoutDashboard,
  Zap,
  Star,
  Newspaper,
  Brain,
  Shield,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/signals", label: "Signals", icon: Zap },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/analyze", label: "AI Analysis", icon: Brain },
  { href: "/news", label: "News", icon: Newspaper },
];

const adminItems = [
  { href: "/admin/users", label: "Admin Users", icon: Shield },
];

export default function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-[#0c0e14] border-r border-gray-800/60 h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-800/60">
        <div className="p-1.5 rounded-lg bg-indigo-500/10 ring-1 ring-indigo-500/30">
          <TrendingUp className="h-5 w-5 text-indigo-400" />
        </div>
        <span className="text-base font-bold text-white tracking-tight">PulseTrader</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
          Navigation
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition group",
                active
                  ? "bg-indigo-500/10 text-indigo-300 ring-1 ring-inset ring-indigo-500/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0 transition", active ? "text-indigo-400" : "text-gray-500 group-hover:text-gray-300")} />
              {label}
              {active && <ChevronRight className="ml-auto h-3 w-3 text-indigo-500" />}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <p className="px-3 mt-5 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
              Admin
            </p>
            {adminItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition group",
                    active
                      ? "bg-indigo-500/10 text-indigo-300 ring-1 ring-inset ring-indigo-500/20"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0 transition", active ? "text-indigo-400" : "text-gray-500 group-hover:text-gray-300")} />
                  {label}
                  {active && <ChevronRight className="ml-auto h-3 w-3 text-indigo-500" />}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-gray-800/60">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition w-full"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
