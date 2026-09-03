import axios from "axios"
import { mockAdapter } from "@/services/mockAdapter"

/**
 * Shared Axios instance. Requests to `/tasks`, `/categories`, etc. are
 * served by `mockAdapter` — an in-memory/localStorage store seeded from
 * `mockTasks.ts` — instead of hitting a real backend. See `mockAdapter.ts`.
 */
const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  adapter: mockAdapter,
})

export default api
