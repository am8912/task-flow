import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"

/** App shell: persistent sidebar + routed main column. */
export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
