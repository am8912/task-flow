import { createContext, useContext } from "react"

export interface SidebarContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const SidebarContext = createContext<SidebarContextValue | undefined>(
  undefined
)

/** Access the mobile sidebar's open state. Must be inside <SidebarProvider>. */
export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider")
  return ctx
}
