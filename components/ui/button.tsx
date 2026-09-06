import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer font-heading tracking-wide",
  {
    variants: {
      variant: {
        default:
          "bg-[#FF5B00] text-white border-2 border-[#C2410C] shadow-[0_4px_0_#9A3412] hover:bg-[#FF6D1A] active:translate-y-1 active:shadow-none",
        arcadeOrange:
          "bg-[#FF5B00] text-white border-2 border-[#C2410C] shadow-[0_5px_0_#9A3412] hover:bg-[#FF6D1A] active:translate-y-1 active:shadow-[0_1px_0_#9A3412]",
        arcadeWhite:
          "bg-white text-slate-800 border-2 border-slate-300 shadow-[0_4px_0_#94A3B8] hover:bg-slate-50 hover:border-slate-400 active:translate-y-1 active:shadow-none",
        arcadeBlue:
          "bg-[#2563EB] text-white border-2 border-[#1E40AF] shadow-[0_4px_0_#1E3A8A] hover:bg-[#3B82F6] active:translate-y-1 active:shadow-none",
        arcadeGreen:
          "bg-[#059669] text-white border-2 border-[#047857] shadow-[0_4px_0_#064E3B] hover:bg-[#10B981] active:translate-y-1 active:shadow-none",
        arcadeRose:
          "bg-[#E11D48] text-white border-2 border-[#9F1239] shadow-[0_4px_0_#881337] hover:bg-[#F43F5E] active:translate-y-1 active:shadow-none",
        secondary:
          "bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
        outline:
          "border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900",
        ghost: "hover:bg-slate-100 hover:text-slate-900",
        link: "text-[#FF5B00] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-xl px-3.5 text-xs",
        lg: "h-14 rounded-2xl px-8 text-base",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
