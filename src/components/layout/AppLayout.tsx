import { Outlet } from "react-router-dom"
import { SidebarProvider } from "@/context/SidebarProvider"
import { Sidebar } from "./Sidebar"

/** App shell: sidebar (off-canvas below `md`) + routed main column. */
export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  )
}
