import type { ComponentProps } from "react";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>;

export function ActionButton({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ActionButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), "relative z-10", className)}
      {...props}
    />
  );
}
