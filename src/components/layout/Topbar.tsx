import { IconFilter, IconMenu2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { AddTaskDialog } from "@/components/tasks/AddTaskDialog"
import { useSidebar } from "@/context/sidebar-context"

interface TopbarProps {
  title: string
  /** Optional muted suffix, e.g. the date on the Today page. */
  subtitle?: string
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const { open } = useSidebar()

  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-5 py-3.5">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={open}
          aria-label="Open menu"
          className="-ml-1 cursor-pointer rounded-md p-1.5 text-content-2 hover:bg-secondary md:hidden"
        >
          <IconMenu2 size={18} />
        </button>
        <h1 className="min-w-0 truncate text-[15px] font-medium text-foreground">
          {title}
          {subtitle && (
            <span className="font-normal text-content-3"> — {subtitle}</span>
          )}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button variant="outline" size="sm">
          <IconFilter className="size-3.5" />
          <span className="hidden sm:inline">Filter</span>
        </Button>
        <AddTaskDialog />
      </div>
    </header>
  )
}
