import { useCallback, useEffect, useState, type ComponentProps } from "react"
import {
  IconCategory,
  IconDots,
  IconEdit,
  IconNote,
  IconTrash,
} from "@tabler/icons-react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTasks } from "@/context/tasks-context"
import { formatCategoryLabel } from "@/data/mockTasks"
import { cn } from "@/lib/utils"
import api from "@/services/api"
import type { Task } from "@/types"

interface CategoryResp {
  categoryId: number
  categoryName: string
}

interface TaskActionsMenuProps {
  task: Task
}

function dateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : ""
}

function taskDateValue(value: string): string {
  return value
}

const fallbackCategories: CategoryResp[] = [
  { categoryId: 1, categoryName: "Learning" },
  { categoryId: 2, categoryName: "Work" },
  { categoryId: 3, categoryName: "Personal" },
]

function MenuItem({
  children,
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-[13px] text-content-2 outline-none transition-colors focus:bg-accent focus:text-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  )
}

export function TaskActionsMenu({ task }: TaskActionsMenuProps) {
  const { updateTask, updateTaskCategory, updateTaskNote, deleteTask } =
    useTasks()

  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [title, setTitle] = useState(task.taskTitle)
  const [dueDate, setDueDate] = useState(dateInputValue(task.dueDate))
  const [note, setNote] = useState(task.description ?? "")
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    String(task.categoryId)
  )
  const [categories, setCategories] = useState<CategoryResp[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editOpen) {
      setTitle(task.taskTitle)
      setDueDate(dateInputValue(task.dueDate))
    }
  }, [editOpen, task.dueDate, task.taskTitle])

  useEffect(() => {
    if (noteOpen) setNote(task.description ?? "")
  }, [noteOpen, task.description])

  useEffect(() => {
    if (categoryOpen) setSelectedCategoryId(String(task.categoryId))
  }, [categoryOpen, task.categoryId])

  const loadCategories = useCallback(async () => {
    if (categories.length > 0 || loadingCategories) return
    setLoadingCategories(true)
    try {
      const res = await api.get("/categories")
      setCategories(res.data.data)
    } catch {
      setCategories(fallbackCategories)
    } finally {
      setLoadingCategories(false)
    }
  }, [categories.length, loadingCategories])

  useEffect(() => {
    if (categoryOpen) loadCategories()
  }, [categoryOpen, loadCategories])

  async function saveEdit() {
    const nextTitle = title.trim()
    if (!nextTitle) return
    setSaving(true)
    try {
      await updateTask(task.taskId, {
        taskTitle: nextTitle,
        dueDate: taskDateValue(dueDate),
      })
      setEditOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function saveCategory() {
    const category = categories.find(
      (item) => String(item.categoryId) === selectedCategoryId
    )
    if (!category) return
    setSaving(true)
    try {
      await updateTaskCategory(task.taskId, category.categoryId)
      setCategoryOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function saveNote() {
    setSaving(true)
    try {
      await updateTaskNote(task.taskId, note.trim() || null)
      setNoteOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    setSaving(true)
    try {
      await deleteTask(task.taskId)
      setDeleteOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DropdownMenuPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuPrimitive.Trigger asChild>
          <button
            type="button"
            aria-label="Task options"
            className="cursor-pointer rounded p-0.5 text-content-3 opacity-0 transition-opacity hover:bg-secondary focus:opacity-100 group-hover:opacity-100"
          >
            <IconDots className="size-4" />
          </button>
        </DropdownMenuPrimitive.Trigger>
        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            align="end"
            sideOffset={6}
            className="z-50 min-w-44 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          >
            <MenuItem
              onSelect={(event) => {
                event.preventDefault()
                setEditOpen(true)
              }}
            >
              <IconEdit className="size-4" />
              Edit
            </MenuItem>
            <MenuItem
              onSelect={(event) => {
                event.preventDefault()
                setCategoryOpen(true)
              }}
            >
              <IconCategory className="size-4" />
              Change category
            </MenuItem>
            <MenuItem
              onSelect={(event) => {
                event.preventDefault()
                setNoteOpen(true)
              }}
            >
              <IconNote className="size-4" />
              Add note
            </MenuItem>
            <DropdownMenuPrimitive.Separator className="-mx-1 my-1 h-px bg-border" />
            <MenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onSelect={(event) => {
                event.preventDefault()
                setDeleteOpen(true)
              }}
            >
              <IconTrash className="size-4" />
              Delete
            </MenuItem>
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>
              Update the title and due date for this task.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`task-title-${task.taskId}`}>Title</Label>
              <Input
                id={`task-title-${task.taskId}`}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") saveEdit()
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`task-due-${task.taskId}`}>Due date</Label>
              <Input
                id={`task-due-${task.taskId}`}
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={!title.trim() || saving}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent className="bg-card sm:max-w-[390px]">
          <DialogHeader>
            <DialogTitle>Change category</DialogTitle>
            <DialogDescription>
              Move this task into another task group.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <Select
              value={selectedCategoryId}
              onValueChange={setSelectedCategoryId}
              disabled={loadingCategories}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    loadingCategories ? "Loading categories..." : "Select category"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem
                    key={category.categoryId}
                    value={String(category.categoryId)}
                  >
                    {formatCategoryLabel(category.categoryName)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveCategory}
              disabled={!selectedCategoryId || loadingCategories || saving}
            >
              Save category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="bg-card sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Add note</DialogTitle>
            <DialogDescription>
              Store extra context in the task description field.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`task-note-${task.taskId}`}>Note</Label>
            <textarea
              id={`task-note-${task.taskId}`}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={5}
              className="min-h-28 w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="Add details, links, or the next tiny step."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNote} disabled={saving}>
              Save note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-card sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Delete task</DialogTitle>
            <DialogDescription>
              This removes "{task.taskTitle}" from your task list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-destructive text-white hover:opacity-90"
              onClick={confirmDelete}
              disabled={saving}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
