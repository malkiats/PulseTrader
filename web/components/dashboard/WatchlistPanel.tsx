"use client";

import { useState } from "react";
import { type WatchlistEntry, type StockSignal } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import SignalBadge from "./SignalBadge";
import { AIAnalysisPanel } from "./AIAnalysisPanel";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface WatchlistPanelProps {
  watchlist: WatchlistEntry[];
  latestSignals: Record<string, StockSignal>;
}

const DEFAULT_TICKERS = ["AAPL", "MSFT", "GOOGL", "TSLA", "NVDA", "AMZN", "META", "NFLX"];

export default function WatchlistPanel({ watchlist, latestSignals }: WatchlistPanelProps) {
  const supabase = createClient();
  const [items, setItems] = useState<WatchlistEntry[]>(watchlist);
  const [newTicker, setNewTicker] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addTicker(ticker: string) {
    const clean = ticker.toUpperCase().trim();
    if (!clean || items.find((i) => i.ticker === clean)) return;
    setAdding(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error: err } = await supabase
      .from("watchlists")
      .insert({ user_id: user.id, ticker: clean })
      .select()
      .single();

    if (err) {
      setError("Failed to add ticker.");
    } else if (data) {
      setItems((prev) => [...prev, data]);
    }
    setNewTicker("");
    setAdding(false);
  }

  async function removeTicker(id: string) {
    await supabase.from("watchlists").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await addTicker(newTicker);
  }

  return (
    <div className="bg-[#0f1117] border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800/60 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Watchlist</h2>
        <span className="text-xs text-gray-500">{items.length} stocks</span>
      </div>

      {/* Add ticker form */}
      <div className="px-5 py-3 border-b border-gray-800/40">
        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
            placeholder="Add ticker (e.g. AAPL)"
            maxLength={10}
            className="flex-1 text-xs px-3 py-2 rounded-lg bg-[#1a1d27] border border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
          />
          <button
            type="submit"
            disabled={adding || !newTicker}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition disabled:opacity-50"
          >
            {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          </button>
        </form>

        {/* Quick-add suggestions */}
        {items.length === 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {DEFAULT_TICKERS.map((t) => (
              <button
                key={t}
                onClick={() => addTicker(t)}
                className="text-[10px] px-2 py-1 rounded-md bg-gray-800 text-gray-400 hover:bg-indigo-500/20 hover:text-indigo-400 transition font-mono"
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Watchlist items */}
      <div className="divide-y divide-gray-800/40 max-h-80 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-8">
            Add tickers to track signals
          </p>
        ) : (
          items.map((item) => {
            const sig = latestSignals[item.ticker];
            return (
              <div
                key={item.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition group"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-white font-mono">{item.ticker}</span>
                  {sig ? (
                    <SignalBadge signal={sig.signal} size="sm" />
                  ) : (
                    <span className="text-[10px] text-gray-600">No signal</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {sig?.price && (
                    <span className="text-xs text-gray-400 font-mono">
                      ${sig.price.toFixed(2)}
                    </span>
                  )}
                  <AIAnalysisPanel ticker={item.ticker} price={sig?.price} signal={sig?.signal} />
                  <button
                    onClick={() => removeTicker(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
