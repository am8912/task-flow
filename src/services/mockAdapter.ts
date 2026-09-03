import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios"
import { AxiosHeaders } from "axios"
import { CATEGORIES, mockTasks } from "@/data/mockTasks"
import type { Task } from "@/types"
import { isDone } from "@/types"

interface CategoryResp {
  categoryId: number
  categoryName: string
}

const TASKS_STORAGE_KEY = "task-flow:mock:tasks"
const CATEGORIES_STORAGE_KEY = "task-flow:mock:categories"

function seedCategories(): CategoryResp[] {
  return CATEGORIES.map((c, i) => ({ categoryId: i + 1, categoryName: c.label }))
}

function readStore<T>(key: string, seed: () => T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch {
    // malformed storage, fall back to seed data
  }
  return seed()
}

function writeStore<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

let tasks: Task[] = readStore(TASKS_STORAGE_KEY, () => mockTasks)
let categories: CategoryResp[] = readStore(CATEGORIES_STORAGE_KEY, seedCategories)

function persistTasks() {
  writeStore(TASKS_STORAGE_KEY, tasks)
}

function persistCategories() {
  writeStore(CATEGORIES_STORAGE_KEY, categories)
}

function parseBody<T>(config: InternalAxiosRequestConfig): T {
  return typeof config.data === "string" ? JSON.parse(config.data) : (config.data as T)
}

function respond<T>(
  config: InternalAxiosRequestConfig,
  data: T,
  status = 200
): AxiosResponse<{ data: T }> {
  return {
    data: { data },
    status,
    statusText: "OK",
    headers: new AxiosHeaders(),
    config,
  }
}

/**
 * Stands in for a backend. Routes the same `/tasks` and `/categories` calls
 * the app already makes through `api.ts`, backed by an in-memory store
 * seeded from `mockTasks.ts` and persisted to localStorage so a refresh
 * keeps whatever was added/toggled/deleted.
 */
export const mockAdapter: AxiosAdapter = async (config) => {
  const method = (config.method ?? "get").toLowerCase()
  const path = (config.url ?? "").replace(/^\/api/, "")

  let match: RegExpMatchArray | null

  if (method === "get" && path === "/tasks") {
    return respond(config, tasks)
  }

  if (method === "get" && path === "/categories") {
    return respond(config, categories)
  }

  if (method === "post" && path === "/categories") {
    const body = parseBody<{ categoryName: string }>(config)
    const nextId = categories.reduce((max, c) => Math.max(max, c.categoryId), 0) + 1
    const created: CategoryResp = { categoryId: nextId, categoryName: body.categoryName }
    categories = [...categories, created]
    persistCategories()
    return respond(config, created, 201)
  }

  if (method === "post" && path === "/tasks") {
    const body = parseBody<{
      taskTitle: string
      categoryId: number
      category: string
      dueDate: string | null
    }>(config)
    const nextId = tasks.reduce((max, t) => Math.max(max, t.taskId), 0) + 1
    const created: Task = {
      taskId: nextId,
      planId: null,
      categoryId: body.categoryId,
      category: body.category,
      statusCode: "TODO",
      taskTitle: body.taskTitle,
      description: null,
      priorityId: 0,
      plannedDate: null,
      dueDate: body.dueDate,
      completedAt: null,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    tasks = [created, ...tasks]
    persistTasks()
    return respond(config, created, 201)
  }

  if (method === "patch" && (match = path.match(/^\/tasks\/(\d+)\/toggle$/))) {
    const id = Number(match[1])
    let updated: Task | undefined
    tasks = tasks.map((t) => {
      if (t.taskId !== id) return t
      updated = {
        ...t,
        statusCode: isDone(t) ? "TODO" : "DONE",
        completedAt: isDone(t) ? null : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return updated
    })
    persistTasks()
    return respond(config, updated)
  }

  if (method === "patch" && (match = path.match(/^\/tasks\/(\d+)\/category$/))) {
    const id = Number(match[1])
    const { categoryId } = parseBody<{ categoryId: number }>(config)
    const categoryName = categories.find((c) => c.categoryId === categoryId)?.categoryName
    let updated: Task | undefined
    tasks = tasks.map((t) => {
      if (t.taskId !== id) return t
      updated = {
        ...t,
        categoryId,
        category: categoryName ?? t.category,
        updatedAt: new Date().toISOString(),
      }
      return updated
    })
    persistTasks()
    return respond(config, updated)
  }

  if (method === "patch" && (match = path.match(/^\/tasks\/(\d+)\/note$/))) {
    const id = Number(match[1])
    const { description } = parseBody<{ description: string | null }>(config)
    let updated: Task | undefined
    tasks = tasks.map((t) => {
      if (t.taskId !== id) return t
      updated = { ...t, description, updatedAt: new Date().toISOString() }
      return updated
    })
    persistTasks()
    return respond(config, updated)
  }

  if (method === "patch" && (match = path.match(/^\/tasks\/(\d+)$/))) {
    const id = Number(match[1])
    const patch = parseBody<Partial<Task>>(config)
    let updated: Task | undefined
    tasks = tasks.map((t) => {
      if (t.taskId !== id) return t
      updated = { ...t, ...patch, updatedAt: new Date().toISOString() }
      return updated
    })
    persistTasks()
    return respond(config, updated)
  }

  if (method === "delete" && (match = path.match(/^\/tasks\/(\d+)$/))) {
    const id = Number(match[1])
    tasks = tasks.filter((t) => t.taskId !== id)
    persistTasks()
    return respond(config, null)
  }

  throw new Error(`mockAdapter: no route for ${method.toUpperCase()} ${path}`)
}
