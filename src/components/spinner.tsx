import { LoaderIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type SpinnerProps = ComponentProps<typeof LoaderIcon> & {
  /**
   * The size of the spinner. Can be a Tailwind size class or custom size.
   */
  size?: string;
};

export const Spinner = ({
  className,
  size = "size-4",
  ...props
}: SpinnerProps) => {
  return (
    <LoaderIcon className={cn(size, "animate-spin", className)} {...props} />
  );
};
