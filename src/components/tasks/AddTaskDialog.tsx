import { useEffect, useRef, useState } from "react"
import { IconCheck, IconPlus, IconX } from "@tabler/icons-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTasks } from "@/context/tasks-context"
import api from "@/services/api"

interface Category {
  categoryId: number
  categoryName: string
}

const NEW_CATEGORY_VALUE = "__new__"

export function AddTaskDialog() {
  const { addTask } = useTasks()

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [categories, setCategories] = useState<Category[]>([])
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const newCatRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      api.get("/categories").then((res) => setCategories(res.data.data))
    }
  }, [open])

  function resetForm() {
    setTitle("")
    setSelectedCategoryId("")
    setDueDate("")
    setShowNewCategory(false)
    setNewCategoryName("")
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) resetForm()
  }

  function handleCategoryChange(value: string) {
    if (value === NEW_CATEGORY_VALUE) {
      setShowNewCategory(true)
      setTimeout(() => newCatRef.current?.focus(), 0)
    } else {
      setSelectedCategoryId(value)
      setShowNewCategory(false)
    }
  }

  async function confirmNewCategory() {
    const name = newCategoryName.trim()
    if (!name) return
    const res = await api.post("/categories", { categoryName: name })
    const created: Category = res.data.data
    setCategories((prev) => [...prev, created])
    setSelectedCategoryId(String(created.categoryId))
    setShowNewCategory(false)
    setNewCategoryName("")
  }

  function cancelNewCategory() {
    setShowNewCategory(false)
    setNewCategoryName("")
  }

  async function handleSubmit() {
    if (!title.trim() || !selectedCategoryId) return
    setSubmitting(true)
    try {
      const category = categories.find(
        (c) => String(c.categoryId) === selectedCategoryId
      )
      await addTask({
        taskTitle: title.trim(),
        categoryId: Number(selectedCategoryId),
        category: category?.categoryName ?? "",
        dueDate: dueDate || null,
      })
      handleOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = title.trim() !== "" && selectedCategoryId !== ""

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <IconPlus size={15} />
          Add Task
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card sm:max-w-[440px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
              <IconPlus size={18} />
            </span>
            <div className="flex flex-col gap-1 text-left">
              <DialogTitle>New Task</DialogTitle>
              <DialogDescription>Add a new task to your list.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              placeholder="e.g. Review pull request #42"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit) handleSubmit()
              }}
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <Select
              value={selectedCategoryId}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category…" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem
                    key={category.categoryId}
                    value={String(category.categoryId)}
                  >
                    {category.categoryName}
                  </SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem
                  value={NEW_CATEGORY_VALUE}
                  className="text-brand focus:text-brand"
                >
                  ＋ Add new category…
                </SelectItem>
              </SelectContent>
            </Select>

            {showNewCategory && (
              <div className="flex items-center gap-1.5 animate-in slide-in-from-top-1 duration-150">
                <Input
                  ref={newCatRef}
                  placeholder="New category name…"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmNewCategory()
                    if (e.key === "Escape") cancelNewCategory()
                  }}
                  className="h-8 text-xs"
                />
                <Button
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={confirmNewCategory}
                >
                  <IconCheck size={14} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={cancelNewCategory}
                >
                  <IconX size={14} />
                </Button>
              </div>
            )}
          </div>

          {/* Due Date */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="task-due-date">Due Date</Label>
              <span className="text-[11px] text-muted-foreground">optional</span>
            </div>
            <Input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? "Adding…" : "Add Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
