"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type NewsItem } from "@/lib/types";
import { sentimentColor, timeAgo } from "@/lib/utils";
import { ExternalLink, Search, RefreshCw } from "lucide-react";

const CATEGORIES = ["All", "earnings", "regulation", "acquisition", "event", "product", "macro", "opinion", "general"];

const sentimentBadge = {
  positive: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  negative: "bg-red-500/10 text-red-400 ring-red-500/20",
  neutral: "bg-gray-500/10 text-gray-400 ring-gray-500/20",
};

export default function NewsPage() {
  const supabase = createClient();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  async function fetchNews() {
    setLoading(true);
    const { data } = await supabase
      .from("news_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setNews(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = news.filter((item) => {
    const matchCategory = category === "All" || item.news_category === category;
    const matchSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.ticker.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search news or ticker…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-xs rounded-lg bg-[#1a1d27] border border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition w-52"
          />
        </div>

        <button
          onClick={fetchNews}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/5 transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide transition ${
              category === cat
                ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40"
                : "bg-gray-800/60 text-gray-500 hover:text-gray-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* News list */}
      <div className="bg-[#0f1117] border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500 text-sm gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading news…
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-16 text-gray-600 text-sm">
            No news articles found. Run the signal engine to fetch news.
          </p>
        ) : (
          <div className="divide-y divide-gray-800/40">
            {filtered.map((item) => (
              <div key={item.id} className="px-6 py-4 hover:bg-white/[0.02] transition">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-bold font-mono text-indigo-400">{item.ticker}</span>
                      {item.news_category && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 uppercase tracking-wider font-semibold">
                          {item.news_category}
                        </span>
                      )}
                      {item.sentiment_label && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full ring-1 ring-inset font-semibold uppercase tracking-wider ${
                            sentimentBadge[item.sentiment_label as keyof typeof sentimentBadge] ??
                            sentimentBadge.neutral
                          }`}
                        >
                          {item.sentiment_label}
                        </span>
                      )}
                      {item.impact_weight != null && (
                        <span className="text-[9px] text-gray-600 font-mono">
                          weight: {item.impact_weight.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-200 leading-relaxed">{item.title}</p>

                    <div className="flex items-center gap-3 mt-2">
                      {item.source && (
                        <span className="text-xs text-gray-600">{item.source}</span>
                      )}
                      {item.sentiment_score != null && (
                        <span className={`text-xs font-mono ${sentimentColor(item.sentiment_label)}`}>
                          {item.sentiment_score > 0 ? "+" : ""}
                          {item.sentiment_score.toFixed(3)}
                        </span>
                      )}
                      <span className="text-xs text-gray-600 ml-auto">
                        {item.published_at ? timeAgo(item.published_at) : timeAgo(item.created_at)}
                      </span>
                    </div>
                  </div>

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 mt-1 text-gray-600 hover:text-indigo-400 transition"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
