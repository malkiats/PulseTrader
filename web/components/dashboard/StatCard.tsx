import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: "default" | "buy" | "sell" | "hold";
  delta?: string;
}

const variantStyles = {
  default: "border-gray-800 bg-[#0f1117]",
  buy: "border-emerald-800/40 bg-emerald-500/5",
  sell: "border-red-800/40 bg-red-500/5",
  hold: "border-amber-800/40 bg-amber-500/5",
};

const valueStyles = {
  default: "text-white",
  buy: "text-emerald-400",
  sell: "text-red-400",
  hold: "text-amber-400",
};

const icons = {
  buy: TrendingUp,
  sell: TrendingDown,
  hold: Minus,
  default: null,
};

export default function StatCard({ title, value, subtitle, variant = "default", delta }: StatCardProps) {
  const Icon = icons[variant];

  return (
    <div className={cn("rounded-xl border p-5 transition", variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-400">{title}</p>
        {Icon && (
          <div className={cn(
            "p-1.5 rounded-lg",
            variant === "buy" && "bg-emerald-500/10 text-emerald-400",
            variant === "sell" && "bg-red-500/10 text-red-400",
            variant === "hold" && "bg-amber-500/10 text-amber-400",
          )}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className={cn("text-3xl font-bold mt-2 tabular-nums tracking-tight", valueStyles[variant])}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      {delta && (
        <p className="text-xs text-gray-500 mt-1">
          <span className="text-gray-400">{delta}</span>
        </p>
      )}
    </div>
  );
}
