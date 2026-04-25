import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type Signal } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function signalColor(signal: Signal | string) {
  if (signal === "BUY") return "text-emerald-400";
  if (signal === "SELL") return "text-red-400";
  return "text-amber-400";
}

export function signalBg(signal: Signal | string) {
  if (signal === "BUY") return "bg-emerald-400/10 text-emerald-400 ring-emerald-400/20";
  if (signal === "SELL") return "bg-red-400/10 text-red-400 ring-red-400/20";
  return "bg-amber-400/10 text-amber-400 ring-amber-400/20";
}

export function sentimentColor(label: string | null) {
  if (label === "positive") return "text-emerald-400";
  if (label === "negative") return "text-red-400";
  return "text-gray-400";
}

export function formatPrice(price: number | null, currency: "USD" | "INR" = "USD") {
  if (price == null) return "—";
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}

export function formatScore(score: number | null) {
  if (score == null) return "—";
  return score.toFixed(3);
}

export function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}
