interface ProgressCardProps {
  label: string
  done: number
  total: number
  hint?: string
}

export function ProgressCard({ label, done, total, hint }: ProgressCardProps) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <div className="rounded-md border border-border bg-surface px-3.5 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-content-2">{label}</span>
        <span className="text-xs font-medium text-brand">
          {done} / {total} tasks
        </span>
      </div>
      <div className="h-1 rounded-full bg-secondary">
        <div
          className="h-1 rounded-full bg-brand transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {hint && <p className="mt-1.5 text-[11px] text-content-3">{hint}</p>}
    </div>
  )
}
