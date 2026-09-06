import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-heading tracking-wider uppercase",
  {
    variants: {
      variant: {
        default:
          "border-orange-300 bg-orange-100 text-[#FF5B00] shadow-sm",
        secondary:
          "border-slate-200 bg-slate-100 text-slate-700",
        destructive:
          "border-rose-300 bg-rose-100 text-rose-800",
        success:
          "border-emerald-300 bg-emerald-100 text-emerald-800",
        blue:
          "border-blue-300 bg-blue-100 text-blue-800",
        amber:
          "border-amber-300 bg-amber-100 text-amber-900",
        outline:
          "border-slate-300 text-slate-700 bg-transparent",
        glow:
          "border-[#FF5B00] bg-[#FF5B00] text-white shadow-[0_0_12px_rgba(255,91,0,0.4)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
