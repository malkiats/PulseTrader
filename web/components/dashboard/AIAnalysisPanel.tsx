"use client";

import { useState } from "react";
import { Brain, Zap, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AnalysisData {
  recommendation: "BUY" | "SELL" | "HOLD";
  confidence: number;
  key_insights: string[];
  price_target_low: number;
  price_target_high: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  action_items: string[];
  rationale: string;
}

interface AIAnalysisProps {
  ticker: string;
  price?: number;
  signal?: string;
}

export function AIAnalysisPanel({ ticker, price, signal }: AIAnalysisProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<any>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticker }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze stock");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setUsage(data.usage);
      setIsOpen(true);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "BUY":
        return "bg-green-500/20 text-green-600 border-green-500/50";
      case "SELL":
        return "bg-red-500/20 text-red-600 border-red-500/50";
      default:
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/50";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "LOW":
        return "bg-green-500/20 text-green-600";
      case "HIGH":
        return "bg-red-500/20 text-red-600";
      default:
        return "bg-yellow-500/20 text-yellow-600";
    }
  };

  return (
    <>
      <button
        onClick={handleAnalyze}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all transform hover:scale-105 active:scale-95"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Brain className="w-4 h-4" />
            AI Analysis
          </>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">
                  {ticker} - AI Trading Analysis
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {error ? (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Analysis Error</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              ) : analysis ? (
                <>
                  {/* Recommendation Card */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-200">
                        Recommendation
                      </h3>
                      <Badge className={`${getRecommendationColor(analysis.recommendation)} border`}>
                        {analysis.recommendation}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-400">Confidence</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                              style={{ width: `${(analysis.confidence / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-white w-8">
                            {analysis.confidence}/10
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-slate-400">Risk Level</p>
                        <div className="mt-1">
                          <Badge className={`${getRiskColor(analysis.risk_level)}`}>
                            {analysis.risk_level}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price Target */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      Price Target (1-3 months)
                    </h3>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-slate-400">Low</p>
                        <p className="text-lg font-bold text-green-400">
                          ${analysis.price_target_low.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex-1 mx-4 h-1 bg-slate-700 rounded-full" />
                      <div className="text-right">
                        <p className="text-xs text-slate-400">High</p>
                        <p className="text-lg font-bold text-green-400">
                          ${analysis.price_target_high.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Key Insights */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-200 mb-3">
                      Key Insights
                    </h3>
                    <ul className="space-y-2">
                      {analysis.key_insights.map((insight, i) => (
                        <li key={i} className="flex gap-2 text-slate-300 text-sm">
                          <span className="text-blue-400 flex-shrink-0">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Items */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      Action Items
                    </h3>
                    <ul className="space-y-2">
                      {analysis.action_items.map((item, i) => (
                        <li key={i} className="flex gap-2 text-slate-300 text-sm">
                          <span className="text-yellow-400 flex-shrink-0">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Rationale */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-200 mb-2">
                      Analysis Rationale
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {analysis.rationale}
                    </p>
                  </div>

                  {/* Usage Info */}
                  {usage && (
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                      <p className="text-xs text-slate-400">
                        Model: {usage.model} | Tokens: {usage.total_tokens}{" "}
                        (prompt: {usage.prompt_tokens}, completion:{" "}
                        {usage.completion_tokens})
                      </p>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 px-6 py-4 flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-all"
              >
                {isLoading ? "Analyzing..." : "Re-analyze"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
