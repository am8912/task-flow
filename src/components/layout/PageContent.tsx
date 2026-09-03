import type { ReactNode } from "react"

/** Scrollable content column shared by every page. */
export function PageContent({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
      {children}
    </div>
  )
}
