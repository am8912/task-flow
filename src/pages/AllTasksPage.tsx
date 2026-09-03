import { Topbar } from "@/components/layout/Topbar"
import { PageContent } from "@/components/layout/PageContent"
import { TaskSection } from "@/components/tasks/TaskSection"
import { useTasks } from "@/context/tasks-context"

export default function AllTasksPage() {
  const { tasks, toggleTask } = useTasks()

  const open = tasks.filter((t) => t.statusCode !== "DONE")
  const completed = tasks.filter((t) => t.statusCode === "DONE")

  return (
    <>
      <Topbar title="All tasks" />
      <PageContent>
        <TaskSection
          title="Open"
          tasks={open}
          onToggle={toggleTask}
          emptyHint="No open tasks — inbox zero!"
        />
        <TaskSection
          title="Completed"
          tasks={completed}
          onToggle={toggleTask}
          emptyHint="No completed tasks yet."
        />
      </PageContent>
    </>
  )
}
