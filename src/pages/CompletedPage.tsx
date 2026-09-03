import { Topbar } from "@/components/layout/Topbar"
import { PageContent } from "@/components/layout/PageContent"
import { TaskSection } from "@/components/tasks/TaskSection"
import { useTasks } from "@/context/tasks-context"

export default function CompletedPage() {
  const { tasks, toggleTask } = useTasks()
  const completed = tasks.filter((t) => t.statusCode === "DONE")

  return (
    <>
      <Topbar title="Completed" />
      <PageContent>
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
