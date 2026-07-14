interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "amber" | "accent" | "indigo";
}

export function StatusBadge({
  children,
  variant = "default",
}: StatusBadgeProps) {
  const variantClass =
    variant === "amber"
      ? "amber"
      : variant === "accent"
        ? "accent"
        : variant === "indigo"
          ? "indigo"
          : "";

  return (
    <span className={`badge-status ${variantClass}`.trim()}>{children}</span>
  );
}
