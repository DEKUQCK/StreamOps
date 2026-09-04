export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="h-7 w-48 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex flex-col gap-3 md:col-span-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-16 animate-pulse bg-muted/40" />
          ))}
        </div>
        <div className="card h-40 animate-pulse bg-muted/40" />
      </div>
    </div>
  );
}
