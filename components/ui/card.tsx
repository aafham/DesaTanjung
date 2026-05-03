import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-4xl border border-line bg-surface p-6 shadow-soft sm:p-7",
        className,
      )}
      {...props}
    />
  );
}
