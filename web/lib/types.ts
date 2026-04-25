export type Signal = "BUY" | "SELL" | "HOLD";

export interface StockSignal {
  id: string;
  ticker: string;
  signal: Signal;
  price: number;
  rsi: number | null;
  ma50: number | null;
  ma200: number | null;
  sentiment_score: number | null;
  technical_score: number | null;
  event_score: number | null;
  fundamental_score: number | null;
  final_score: number | null;
  created_at: string;
}

export interface NewsItem {
  id: string;
  ticker: string;
  title: string;
  source: string | null;
  url: string | null;
  published_at: string | null;
  sentiment_label: "positive" | "negative" | "neutral" | null;
  sentiment_score: number | null;
  news_category: string | null;
  impact_weight: number | null;
  created_at: string;
}

export interface WatchlistEntry {
  id: string;
  user_id: string;
  ticker: string;
  created_at: string;
}

export interface MarketData {
  id: string;
  ticker: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
  created_at: string;
}

export interface DashboardStats {
  totalSignals: number;
  buyCount: number;
  sellCount: number;
  holdCount: number;
  activeStocks: number;
}
