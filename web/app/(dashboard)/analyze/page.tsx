"use client";

import { useState } from "react";
import { Brain, Search, AlertCircle, Loader2 } from "lucide-react";
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

export default function AnalyzePage() {
  const [ticker, setTicker] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<any>(null);
  const [history, setHistory] = useState<string[]>([]);

  const handleAnalyze = async (searchTicker?: string) => {
    const tickerToAnalyze = (searchTicker || ticker).toUpperCase().trim();

    if (!tickerToAnalyze) {
      setError("Please enter a ticker symbol");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticker: tickerToAnalyze }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze stock");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setUsage(data.usage);
      setTicker(tickerToAnalyze);

      // Add to history
      if (!history.includes(tickerToAnalyze)) {
        setHistory((prev) => [tickerToAnalyze, ...prev.slice(0, 9)]);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Brain className="w-8 h-8 text-purple-400" />
        <div>
          <h1 className="text-3xl font-bold text-white">Stock Analysis</h1>
          <p className="text-sm text-slate-400">
            Get AI-powered trading insights and recommendations
          </p>
        </div>
      </div>

      {/* Search Box */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAnalyze();
          }}
          className="flex gap-3"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="Enter stock ticker (e.g., AAPL, MSFT, TSLA)"
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all transform hover:scale-105 active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                Analyzing...
              </>
            ) : (
              "Analyze"
            )}
          </button>
        </form>

        {/* Quick History */}
        {history.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-400 mb-2">Recent searches</p>
            <div className="flex flex-wrap gap-2">
              {history.map((t) => (
                <button
                  key={t}
                  onClick={() => handleAnalyze(t)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Analysis Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Recommendation Card */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{ticker}</h2>
              <Badge className={`${getRecommendationColor(analysis.recommendation)} border text-lg px-4 py-2`}>
                {analysis.recommendation}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">Confidence Level</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${(analysis.confidence / 10) * 100}%` }}
                    />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">
                  {analysis.confidence}/10
                </p>
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">Risk Level</p>
                <Badge className={`${getRiskColor(analysis.risk_level)} text-sm px-3 py-1`}>
                  {analysis.risk_level}
                </Badge>
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">Price Target (1-3mo)</p>
                <p className="text-sm text-slate-300">
                  ${analysis.price_target_low.toFixed(2)} -{" "}
                  ${analysis.price_target_high.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Key Insights</h3>
            <ul className="space-y-3">
              {analysis.key_insights.map((insight, i) => (
                <li key={i} className="flex gap-3 text-slate-300">
                  <span className="text-blue-400 text-xl flex-shrink-0">•</span>
                  <span className="text-sm">{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Items */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Action Items</h3>
            <ul className="space-y-3">
              {analysis.action_items.map((item, i) => (
                <li key={i} className="flex gap-3 text-slate-300">
                  <span className="text-yellow-400 text-xl flex-shrink-0">→</span>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Detailed Rationale */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Analysis Rationale</h3>
            <p className="text-slate-300 leading-relaxed text-sm">
              {analysis.rationale}
            </p>
          </div>

          {/* Usage Info */}
          {usage && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-xs text-slate-400">
              <p>
                Model: {usage.model} | Tokens used: {usage.total_tokens} (prompt:{" "}
                {usage.prompt_tokens}, completion: {usage.completion_tokens})
              </p>
              <p className="text-slate-500 mt-2">
                💡 Tip: Only request analysis when you need it to save API credits!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Initial state message */}
      {!analysis && !error && !isLoading && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-12 text-center">
          <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
          <p className="text-slate-400">
            Enter a stock ticker to get AI-powered trading analysis
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Includes technical analysis, sentiment insights, and smart recommendations
          </p>
        </div>
      )}
    </div>
  );
}
