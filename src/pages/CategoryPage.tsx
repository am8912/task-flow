import { Navigate, useParams } from "react-router-dom"
import { Topbar } from "@/components/layout/Topbar"
import { PageContent } from "@/components/layout/PageContent"
import { TaskSection } from "@/components/tasks/TaskSection"
import { useTasks } from "@/context/tasks-context"
import { CATEGORY_LABEL } from "@/data/mockTasks"
import type { Category } from "@/types"

const CATEGORY_KEYS: Category[] = ["learning", "work", "personal"]

function isCategory(value: string | undefined): value is Category {
  return value !== undefined && CATEGORY_KEYS.includes(value as Category)
}

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>()
  const { tasks, toggleTask } = useTasks()

  if (!isCategory(category)) {
    return <Navigate to="/" replace />
  }

  const list = tasks.filter((t) => t.category === category)
  const open = list.filter((t) => t.statusCode !== "DONE")
  const completed = list.filter((t) => t.statusCode === "DONE")

  return (
    <>
      <Topbar title={CATEGORY_LABEL[category]} />
      <PageContent>
        <TaskSection
          title="Open"
          tasks={open}
          onToggle={toggleTask}
          emptyHint="No open tasks in this category."
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
