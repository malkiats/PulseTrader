import { createClient } from "@/lib/supabase/server";
import { type StockSignal, type DashboardStats } from "@/lib/types";
import StatCard from "@/components/dashboard/StatCard";
import SignalTable from "@/components/dashboard/SignalTable";
import WatchlistPanel from "@/components/dashboard/WatchlistPanel";
import NewsPanel from "@/components/dashboard/NewsPanel";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export const revalidate = 30; // revalidate every 30s

type DashboardPageProps = {
  searchParams?: Promise<{ mode?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient();
  const resolvedSearchParams = (await searchParams) ?? {};
  const marketMode = resolvedSearchParams.mode === "indian" ? "indian" : "global";
  const isIndianTicker = (ticker: string) => ticker.endsWith(".NS");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch latest 50 signals
  const { data: signals = [] } = await supabase
    .from("signals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch user watchlist
  const { data: watchlist = [] } = await supabase
    .from("watchlists")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  // Fetch latest news (20 items)
  const { data: news = [] } = await supabase
    .from("news_items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const filteredSignals = (signals ?? []).filter((s) =>
    marketMode === "indian" ? isIndianTicker(s.ticker) : !isIndianTicker(s.ticker)
  );
  const filteredNews = (news ?? []).filter((n) =>
    marketMode === "indian" ? isIndianTicker(n.ticker) : !isIndianTicker(n.ticker)
  );

  // Build stats
  const safeSignals: StockSignal[] = filteredSignals;
  const stats: DashboardStats = {
    totalSignals: safeSignals.length,
    buyCount: safeSignals.filter((s) => s.signal === "BUY").length,
    sellCount: safeSignals.filter((s) => s.signal === "SELL").length,
    holdCount: safeSignals.filter((s) => s.signal === "HOLD").length,
    activeStocks: new Set(safeSignals.map((s) => s.ticker)).size,
  };

  // Build latest signal per ticker map (for watchlist panel)
  const latestSignals: Record<string, StockSignal> = {};
  for (const sig of safeSignals) {
    if (!latestSignals[sig.ticker]) {
      latestSignals[sig.ticker] = sig;
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <DashboardHeader marketMode={marketMode} />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Signals"
          value={stats.totalSignals}
          subtitle={`Across ${stats.activeStocks} stocks`}
        />
        <StatCard
          title="BUY Signals"
          value={stats.buyCount}
          variant="buy"
          subtitle="Oversold + bullish"
        />
        <StatCard
          title="SELL Signals"
          value={stats.sellCount}
          variant="sell"
          subtitle="Overbought + bearish"
        />
        <StatCard
          title="HOLD Signals"
          value={stats.holdCount}
          variant="hold"
          subtitle="Neutral conditions"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent signals — takes 2/3 */}
        <div className="xl:col-span-2">
          <div className="bg-[#0f1117] border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800/60 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Recent Signals</h2>
              <a href="/signals" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
                View all →
              </a>
            </div>
            <SignalTable signals={safeSignals} limit={15} marketMode={marketMode} />
          </div>
        </div>

        {/* Watchlist — takes 1/3 */}
        <div>
          <WatchlistPanel watchlist={watchlist ?? []} latestSignals={latestSignals} />
        </div>
      </div>

      {/* News feed */}
      <NewsPanel news={filteredNews.slice(0, 20)} />
    </div>
  );
}
