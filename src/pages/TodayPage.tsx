import { Topbar } from "@/components/layout/Topbar"
import { PageContent } from "@/components/layout/PageContent"
import { TaskSection } from "@/components/tasks/TaskSection"
import { ProgressCard } from "@/components/tasks/ProgressCard"
import { useTasks } from "@/context/tasks-context"
import { doneToday, inProgressToday } from "@/lib/tasks"
import { formatToday } from "@/lib/date"

export default function TodayPage() {
  const { tasks, toggleTask } = useTasks()

  const inProgress = inProgressToday(tasks)
  const done = doneToday(tasks)

  const learning = tasks.filter((t) => t.category === "learning")
  const learningDone = learning.filter((t) => t.statusCode === "DONE").length
  const remaining = Math.max(learning.length - learningDone, 0)

  return (
    <>
      <Topbar title="Today" subtitle={formatToday()} />
      <PageContent>
        <TaskSection
          title="In progress"
          tasks={inProgress}
          onToggle={toggleTask}
          emptyHint="All clear for today 🎉"
        />
        <TaskSection
          title="Done today"
          tasks={done}
          onToggle={toggleTask}
          emptyHint="Nothing completed yet today."
        />
        <ProgressCard
          label="Learning progress this week"
          done={learningDone}
          total={learning.length}
          hint={`Keep going — ${remaining} more to hit your weekly goal`}
        />
      </PageContent>
    </>
  )
}
