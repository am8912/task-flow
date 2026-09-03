import { IconFilter } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { AddTaskDialog } from "@/components/tasks/AddTaskDialog"

interface TopbarProps {
  title: string
  /** Optional muted suffix, e.g. the date on the Today page. */
  subtitle?: string
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-5 py-3.5">
      <h1 className="text-[15px] font-medium text-foreground">
        {title}
        {subtitle && (
          <span className="font-normal text-content-3"> — {subtitle}</span>
        )}
      </h1>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <IconFilter className="size-3.5" />
          Filter
        </Button>
        <AddTaskDialog />
      </div>
    </header>
  )
}
