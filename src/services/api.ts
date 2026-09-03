import axios from "axios"
import { mockAdapter } from "@/services/mockAdapter"

/**
 * Shared Axios instance. Requests hit `/api/*`, which Vite's dev server
 * proxies to the Spring Boot backend (see `server.proxy` in vite.config.ts).
 * In production the bundle is served by Spring Boot itself, so the same
 * relative paths resolve against the backend origin.
 *
 * When built with `VITE_DATA_SOURCE=mock` (the GitHub Pages build, which has
 * no backend to talk to), requests are routed to an in-memory/localStorage
 * mock instead — see `mockAdapter.ts`.
 */
const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  adapter: import.meta.env.VITE_DATA_SOURCE === "mock" ? mockAdapter : undefined,
})

export default api
