interface RoleBadgeProps {
  role: string;
}

export function RoleBadge({
  role,
}: RoleBadgeProps) {
  const styles =
    role === "admin"
      ? "bg-red-500/10 text-red-600"
      : role === "tl"
        ? "bg-blue-500/10 text-blue-600"
        : role === "manager"
          ? "bg-violet-500/10 text-violet-600"
          : "bg-emerald-500/10 text-emerald-600";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium uppercase ${styles}`}
    >
      {role}
    </span>
  );
}