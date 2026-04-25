"use client";

import { type StockSignal } from "@/lib/types";
import { formatPrice, formatScore, timeAgo } from "@/lib/utils";
import SignalBadge from "./SignalBadge";
import { AIAnalysisPanel } from "./AIAnalysisPanel";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface SignalTableProps {
  signals: StockSignal[];
  showTicker?: boolean;
  limit?: number;
  marketMode?: "global" | "indian";
}

export default function SignalTable({ signals, showTicker = true, limit, marketMode = "global" }: SignalTableProps) {
  const rows = limit ? signals.slice(0, limit) : signals;

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        No signals yet. Start the signal engine to generate data.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800/60">
            {showTicker && (
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Ticker
              </th>
            )}
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Signal
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              RSI
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
              Sentiment
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
              Score
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Time
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/40">
          {rows.map((s) => (
            <tr key={s.id} className="hover:bg-white/[0.02] transition">
              {showTicker && (
                <td className="py-3.5 px-4 font-bold text-white">
                  {s.ticker}
                </td>
              )}
              <td className="py-3.5 px-4">
                <SignalBadge signal={s.signal} size="sm" />
              </td>
              <td className="py-3.5 px-4 text-right font-mono text-gray-200">
                {formatPrice(s.price, marketMode === "indian" ? "INR" : "USD")}
              </td>
              <td className="py-3.5 px-4 text-right hidden sm:table-cell">
                <RsiCell rsi={s.rsi} />
              </td>
              <td className="py-3.5 px-4 text-right hidden md:table-cell">
                <SentimentCell score={s.sentiment_score} />
              </td>
              <td className="py-3.5 px-4 text-right hidden lg:table-cell font-mono text-gray-400 text-xs">
                {formatScore(s.final_score)}
              </td>
              <td suppressHydrationWarning className="py-3.5 px-4 text-right text-xs text-gray-500">
                {timeAgo(s.created_at)}
              </td>
              <td className="py-3.5 px-4 text-center">
                <AIAnalysisPanel ticker={s.ticker} price={s.price} signal={s.signal} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RsiCell({ rsi }: { rsi: number | null }) {
  if (rsi == null) return <span className="text-gray-600">—</span>;
  const color =
    rsi < 30 ? "text-emerald-400" : rsi > 70 ? "text-red-400" : "text-gray-300";
  const Icon = rsi < 30 ? ArrowUpRight : rsi > 70 ? ArrowDownRight : Minus;
  return (
    <span className={`inline-flex items-center gap-0.5 font-mono text-xs ${color}`}>
      <Icon className="h-3 w-3" />
      {rsi.toFixed(1)}
    </span>
  );
}

function SentimentCell({ score }: { score: number | null }) {
  if (score == null) return <span className="text-gray-600">—</span>;
  const color =
    score > 0.1 ? "text-emerald-400" : score < -0.1 ? "text-red-400" : "text-gray-400";
  return (
    <span className={`font-mono text-xs ${color}`}>
      {score > 0 ? "+" : ""}
      {score.toFixed(3)}
    </span>
  );
}
