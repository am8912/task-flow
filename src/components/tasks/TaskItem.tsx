import { IconCheck, IconClock } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { formatDueLabel } from "@/lib/date"
import type { Task } from "@/types"
import { isDone } from "@/types"
import { CategoryBadge } from "./CategoryBadge"
import { TaskActionsMenu } from "./TaskActionsMenu"

interface TaskItemProps {
  task: Task
  onToggle: (id: number) => void
}

export function TaskItem({ task, onToggle }: TaskItemProps) {
  const done = isDone(task)
  const due = formatDueLabel(task)

  return (
    <div className="group flex items-center gap-2.5 rounded-md border border-border bg-surface px-3 py-2.5 transition-colors hover:border-border-strong">
      <button
        type="button"
        onClick={() => onToggle(task.taskId)}
        aria-pressed={done}
        aria-label={done ? "Mark as not done" : "Mark as done"}
        className={cn(
          "flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] transition-colors",
          done
            ? "border-primary bg-primary text-white"
            : "border-border-strong hover:border-primary"
        )}
      >
        {done && <IconCheck className="size-2.5" stroke={3} />}
      </button>

      <span
        className={cn(
          "flex-1 text-[13px]",
          done ? "text-content-3 line-through" : "text-foreground"
        )}
      >
        {task.taskTitle}
      </span>

      <CategoryBadge category={task.category} />

      {due && (
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 text-[11px]",
            due.overdue ? "text-destructive" : "text-content-3"
          )}
        >
          <IconClock className="size-3" />
          {due.text}
        </span>
      )}

      <TaskActionsMenu task={task} />
    </div>
  )
}
