"use client";

import { MarketModeToggle } from "./MarketModeToggle";
import { BestBuyCard } from "./BestBuyCard";

export function DashboardHeader({ marketMode }: { marketMode: "global" | "indian" }) {

  return (
    <>
      {/* Market Mode Toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <MarketModeToggle mode={marketMode} />
      </div>

      {/* Best Buy Recommendation */}
      <BestBuyCard marketMode={marketMode} />
    </>
  );
}
