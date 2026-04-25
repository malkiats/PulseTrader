import { type NewsItem } from "@/lib/types";
import { sentimentColor, timeAgo } from "@/lib/utils";
import { ExternalLink, Newspaper } from "lucide-react";

interface NewsPanelProps {
  news: NewsItem[];
}

const categoryColors: Record<string, string> = {
  earnings: "bg-indigo-500/10 text-indigo-400",
  regulation: "bg-red-500/10 text-red-400",
  acquisition: "bg-purple-500/10 text-purple-400",
  event: "bg-blue-500/10 text-blue-400",
  product: "bg-cyan-500/10 text-cyan-400",
  macro: "bg-amber-500/10 text-amber-400",
  opinion: "bg-gray-500/10 text-gray-400",
  general: "bg-gray-500/10 text-gray-400",
};

export default function NewsPanel({ news }: NewsPanelProps) {
  if (news.length === 0) {
    return (
      <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-white">Latest News</h2>
        </div>
        <p className="text-xs text-gray-600 text-center py-6">
          No news fetched yet. Run the signal engine.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0f1117] border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800/60 flex items-center gap-2">
        <Newspaper className="h-4 w-4 text-gray-500" />
        <h2 className="text-sm font-semibold text-white">Latest News</h2>
        <span className="ml-auto text-xs text-gray-500">{news.length} articles</span>
      </div>

      <div className="divide-y divide-gray-800/40 max-h-96 overflow-y-auto">
        {news.map((item) => {
          const catStyle = categoryColors[item.news_category ?? "general"] ?? categoryColors.general;
          return (
            <div key={item.id} className="px-5 py-3.5 hover:bg-white/[0.02] transition">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] font-bold font-mono text-indigo-400">
                      {item.ticker}
                    </span>
                    {item.news_category && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${catStyle}`}>
                        {item.news_category}
                      </span>
                    )}
                    {item.sentiment_label && (
                      <span className={`text-[9px] font-semibold uppercase tracking-wider ${sentimentColor(item.sentiment_label)}`}>
                        {item.sentiment_label}
                        {item.sentiment_score != null && ` (${item.sentiment_score > 0 ? "+" : ""}${item.sentiment_score.toFixed(2)})`}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {item.source && (
                      <span className="text-[10px] text-gray-600">{item.source}</span>
                    )}
                    <span className="text-[10px] text-gray-600">
                      {item.published_at ? timeAgo(item.published_at) : timeAgo(item.created_at)}
                    </span>
                  </div>
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-gray-600 hover:text-indigo-400 transition mt-0.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
