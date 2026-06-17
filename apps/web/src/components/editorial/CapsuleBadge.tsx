type CapsuleBadgeProps = {
  children: string;
  className?: string;
};

/** Editorial limited-series label — maison typography, not marketplace urgency. */
export function CapsuleBadge({ children, className }: CapsuleBadgeProps) {
  const classes = ["text-[10px] font-medium uppercase tracking-[0.35em] text-stone-500", className]
    .filter(Boolean)
    .join(" ");

  return <p className={classes}>{children}</p>;
}
