"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Globe, MapPin } from "lucide-react";

interface MarketModeToggleProps {
  mode: "global" | "indian";
}

export function MarketModeToggle({ mode }: MarketModeToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleToggle = (newMode: "global" | "indian") => {
    if (newMode === mode) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", newMode);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg p-1">
      <button
        onClick={() => handleToggle("global")}
        disabled={isPending}
        className={`flex items-center gap-2 px-3 py-2 rounded transition-all font-medium text-sm ${
          mode === "global"
            ? "bg-indigo-600 text-white"
            : "text-slate-400 hover:text-slate-300"
        }`}
      >
        <Globe className="w-4 h-4" />
        Global
      </button>
      <button
        onClick={() => handleToggle("indian")}
        disabled={isPending}
        className={`flex items-center gap-2 px-3 py-2 rounded transition-all font-medium text-sm ${
          mode === "indian"
            ? "bg-saffron-600 text-white"
            : "text-slate-400 hover:text-slate-300"
        }`}
        style={
          mode === "indian"
            ? { backgroundColor: "#FF9933" }
            : {}
        }
      >
        <MapPin className="w-4 h-4" />
        India
      </button>
    </div>
  );
}
