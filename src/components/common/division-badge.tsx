interface DivisionBadgeProps {
  division?: string | null;
}

export function DivisionBadge({
  division,
}: DivisionBadgeProps) {
  if (!division) {
    return (
      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        -
      </span>
    );
  }

  const styles =
    division === "PA"
      ? "bg-blue-500/10 text-blue-600"
      : division === "TE"
        ? "bg-violet-500/10 text-violet-600"
        : "bg-emerald-500/10 text-emerald-600";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles}`}
    >
      {division}
    </span>
  );
}