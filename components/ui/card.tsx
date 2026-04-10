import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-4xl border border-line bg-surface p-5 shadow-soft sm:p-6",
        className,
      )}
      {...props}
    />
  );
}
