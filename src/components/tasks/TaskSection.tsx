import type { Task } from "@/types"
import { TaskItem } from "./TaskItem"

interface TaskSectionProps {
  title: string
  tasks: Task[]
  onToggle: (id: number) => void
  emptyHint?: string
}

export function TaskSection({
  title,
  tasks,
  onToggle,
  emptyHint = "Nothing here yet.",
}: TaskSectionProps) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-content-3">
          {title}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {tasks.length === 0 ? (
        <p className="px-1 py-1.5 text-[13px] text-content-3">{emptyHint}</p>
      ) : (
        <div className="flex flex-col gap-1">
          {tasks.map((task) => (
            <TaskItem key={task.taskId} task={task} onToggle={onToggle} />
          ))}
        </div>
      )}
    </section>
  )
}
