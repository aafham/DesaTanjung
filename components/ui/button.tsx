import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-primary text-primary-foreground shadow-sm hover:bg-teal-800",
    secondary: "bg-slate-100 text-slate-950 hover:bg-slate-200",
    ghost: "bg-transparent text-slate-800 hover:bg-slate-100",
    danger: "bg-danger text-white shadow-sm hover:bg-rose-800",
  };

  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-12 items-center justify-center rounded-full px-5 py-3 text-center text-base font-bold leading-tight whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
