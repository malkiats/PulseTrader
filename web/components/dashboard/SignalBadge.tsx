import { cn, signalBg } from "@/lib/utils";
import { type Signal } from "@/lib/types";

interface SignalBadgeProps {
  signal: Signal | string;
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "text-[10px] px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
  lg: "text-sm px-3 py-1.5",
};

export default function SignalBadge({ signal, size = "md" }: SignalBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold ring-1 ring-inset tracking-wide uppercase",
        signalBg(signal),
        sizeStyles[size]
      )}
    >
      {signal}
    </span>
  );
}
