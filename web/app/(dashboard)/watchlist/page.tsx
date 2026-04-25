import { createClient } from "@/lib/supabase/server";
import { type StockSignal } from "@/lib/types";
import WatchlistPanel from "@/components/dashboard/WatchlistPanel";
import SignalTable from "@/components/dashboard/SignalTable";

export const revalidate = 30;

export default async function WatchlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: watchlist = [] } = await supabase
    .from("watchlists")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const tickers = (watchlist ?? []).map((w) => w.ticker);

  let signals: StockSignal[] = [];
  if (tickers.length > 0) {
    const { data } = await supabase
      .from("signals")
      .select("*")
      .in("ticker", tickers)
      .order("created_at", { ascending: false })
      .limit(100);
    signals = data ?? [];
  }

  const latestSignals: Record<string, StockSignal> = {};
  for (const sig of signals) {
    if (!latestSignals[sig.ticker]) {
      latestSignals[sig.ticker] = sig;
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <WatchlistPanel watchlist={watchlist ?? []} latestSignals={latestSignals} />
        </div>

        <div className="lg:col-span-2">
          <div className="bg-[#0f1117] border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800/60">
              <h2 className="text-sm font-semibold text-white">Signal History for Watchlist</h2>
              <p className="text-xs text-gray-500 mt-0.5">Latest 100 signals for your tracked stocks</p>
            </div>
            <SignalTable signals={signals} />
          </div>
        </div>
      </div>
    </div>
  );
}
