"use client";

import { useState } from "react";
import {
  AlertCircle,
  Loader2,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Recommendation {
  ticker: string;
  rank: number;
  buy_reason: string;
  technical_reason: string;
  sentiment_reason: string;
  entry_price: number;
  target_price_today: number;
  target_price_week: number;
  risk_factors: string[];
  confidence: number;
}

interface BestBuyData {
  top_recommendations: Recommendation[];
  market_outlook: string;
  best_time_to_buy: string;
  portfolio_suggestion: string;
}

export function BestBuyCard({ marketMode = "global" }: { marketMode?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<BestBuyData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<any>(null);

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendations(null);

    try {
      const response = await fetch(`/api/best-buy?mode=${marketMode}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get recommendations");
      }

      const data = await response.json();
      setRecommendations(data.analysis);
      setUsage(data.usage);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 8) return "bg-green-500/20 text-green-600";
    if (confidence >= 6) return "bg-blue-500/20 text-blue-600";
    return "bg-yellow-500/20 text-yellow-600";
  };

  const formatMoney = (value: number) => {
    const isIndian = marketMode === "indian";
    return new Intl.NumberFormat(isIndian ? "en-IN" : "en-US", {
      style: "currency",
      currency: isIndian ? "INR" : "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Star className="w-6 h-6 text-yellow-300" fill="currentColor" />
          <div>
            <h2 className="text-lg font-bold text-white">Best Buy Today</h2>
            <p className="text-xs text-purple-100">
              AI-powered stock recommendations
            </p>
          </div>
        </div>
        <button
          onClick={handleGetRecommendations}
          disabled={isLoading}
          className="px-3 py-1 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white rounded text-xs font-semibold transition-all"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin inline" />
          ) : (
            "Generate"
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {error ? (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        ) : isLoading && !recommendations ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400 mr-2" />
            <p className="text-slate-400">Analyzing market...</p>
          </div>
        ) : recommendations ? (
          <>
            {/* Market Outlook */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-2">Market Outlook</p>
              <p className="text-sm text-slate-200">{recommendations.market_outlook}</p>
            </div>

            {/* Top Recommendations */}
            <div className="space-y-3">
              {recommendations.top_recommendations
                .slice(0, 3)
                .map((rec, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-700/30 border border-slate-600 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-white">
                          #{rec.rank}
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white">
                            {rec.ticker}
                          </p>
                          <p className="text-xs text-slate-400">
                            Entry: {formatMoney(rec.entry_price)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={`${getConfidenceColor(
                          rec.confidence
                        )} border`}
                      >
                        {rec.confidence}/10
                      </Badge>
                    </div>

                    <p className="text-sm text-slate-300 mb-3">
                      {rec.buy_reason}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                      <div className="bg-slate-800 rounded px-2 py-1.5">
                        <p className="text-slate-400">Target Today</p>
                        <p className="text-green-400 font-semibold">
                          {formatMoney(rec.target_price_today)}
                        </p>
                      </div>
                      <div className="bg-slate-800 rounded px-2 py-1.5">
                        <p className="text-slate-400">Target Week</p>
                        <p className="text-blue-400 font-semibold">
                          {formatMoney(rec.target_price_week)}
                        </p>
                      </div>
                    </div>

                    {rec.risk_factors.length > 0 && (
                      <div className="text-xs text-slate-400">
                        <p className="font-semibold mb-1">Risks:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          {rec.risk_factors.slice(0, 2).map((risk, i) => (
                            <li key={i}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Best Time to Buy & Portfolio Suggestion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Best Time</p>
                <p className="text-sm font-semibold text-slate-200">
                  {recommendations.best_time_to_buy}
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Top Pick</p>
                <p className="text-sm font-semibold text-yellow-400">
                  {recommendations.portfolio_suggestion}
                </p>
              </div>
            </div>

            {/* Token Usage */}
            {usage && (
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
                <p>
                  Tokens: {usage.total_tokens} | Model: {usage.model}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
            <p className="text-sm text-slate-300">
              Click <span className="font-semibold text-white">Generate</span> to get AI best-buy picks for
              <span className="font-semibold text-white"> {marketMode === "indian" ? "Indian" : "Global"}</span> market.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              OpenAI is called only when you click Generate.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
