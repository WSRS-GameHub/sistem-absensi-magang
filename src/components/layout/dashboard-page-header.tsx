interface DashboardPageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function DashboardPageHeader({
  title,
  description,
  action,
}: DashboardPageHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900 md:text-[30px]">
          {title}
        </h1>

        {/* Garis aksen PLN */}
        <div className="mt-2 h-1 w-16 rounded-full bg-[#FFD453]" />

        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 md:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>

      {action ? (
        <div className="shrink-0 self-start md:self-auto">
          {action}
        </div>
      ) : null}
    </div>
  );
}