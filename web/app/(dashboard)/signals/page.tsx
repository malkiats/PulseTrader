"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { type StockSignal, type Signal } from "@/lib/types";
import SignalTable from "@/components/dashboard/SignalTable";
import SignalBadge from "@/components/dashboard/SignalBadge";
import { Search, Filter, RefreshCw } from "lucide-react";

const SIGNAL_OPTIONS: (Signal | "ALL")[] = ["ALL", "BUY", "SELL", "HOLD"];

export default function SignalsPage() {
  const supabase = createClient();
  const [signals, setSignals] = useState<StockSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [signalFilter, setSignalFilter] = useState<Signal | "ALL">("ALL");

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (signalFilter !== "ALL") {
      query = query.eq("signal", signalFilter);
    }

    const { data } = await query;
    setSignals(data ?? []);
    setLoading(false);
  }, [supabase, signalFilter]);

  useEffect(() => {
    fetchSignals();

    // Real-time subscription
    const channel = supabase
      .channel("signals-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "signals" },
        (payload) => {
          setSignals((prev) => [payload.new as StockSignal, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSignals, supabase]);

  const filtered = signals.filter(
    (s) =>
      !search ||
      s.ticker.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    buy: signals.filter((s) => s.signal === "BUY").length,
    sell: signals.filter((s) => s.signal === "SELL").length,
    hold: signals.filter((s) => s.signal === "HOLD").length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Signal filter pills */}
      <div className="flex items-center gap-3 flex-wrap">
        {SIGNAL_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => setSignalFilter(opt)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              signalFilter === opt
                ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40"
                : "bg-gray-800/60 text-gray-400 hover:text-gray-200"
            }`}
          >
            {opt}
            {opt !== "ALL" && (
              <span className="ml-1.5 opacity-60">
                {opt === "BUY" ? counts.buy : opt === "SELL" ? counts.sell : counts.hold}
              </span>
            )}
          </button>
        ))}

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search ticker…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-xs rounded-lg bg-[#1a1d27] border border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition w-40"
          />
        </div>

        <button
          onClick={fetchSignals}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/5 transition"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filter info */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Filter className="h-3.5 w-3.5" />
        <span>
          Showing {filtered.length} signal{filtered.length !== 1 ? "s" : ""}
          {signalFilter !== "ALL" && (
            <>
              {" · "}
              <SignalBadge signal={signalFilter} size="sm" />
            </>
          )}
        </span>
        <span className="ml-auto text-indigo-400 animate-pulse text-[10px]">● Live</span>
      </div>

      {/* Table */}
      <div className="bg-[#0f1117] border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500 text-sm gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading signals…
          </div>
        ) : (
          <SignalTable signals={filtered} />
        )}
      </div>
    </div>
  );
}
