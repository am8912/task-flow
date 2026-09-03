import type { ComponentType } from "react"
import { NavLink } from "react-router-dom"
import {
  IconBriefcase,
  IconBuildingCommunity,
  IconCalendarDue,
  IconCheck,
  IconInbox,
  IconLayoutKanban,
  IconMoon,
  IconSchool,
  IconSun,
  IconUser,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { useTasks } from "@/context/tasks-context"
import { useTheme } from "@/context/theme-context"
import { computeCounts } from "@/lib/tasks"

type IconComponent = ComponentType<{
  size?: number | string
  className?: string
  stroke?: number
}>

interface NavItemDef {
  to: string
  label: string
  icon: IconComponent
  count?: number
  end?: boolean
}

function NavRow({ item }: { item: NavItemDef }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 rounded-md px-2 py-[7px] text-[13px] transition-colors",
          isActive
            ? "bg-accent font-medium text-accent-foreground"
            : "text-content-2 hover:bg-secondary"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={16} />
          <span className="flex-1">{item.label}</span>
          {item.count !== undefined && (
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px]",
                isActive
                  ? "bg-brand-mid text-brand-dark"
                  : "bg-secondary text-content-3"
              )}
            >
              {item.count}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const { tasks } = useTasks()
  const { theme, toggleTheme } = useTheme()
  const counts = computeCounts(tasks)

  const overview: NavItemDef[] = [
    { to: "/", label: "Today", icon: IconCalendarDue, count: counts.today, end: true },
    { to: "/all", label: "All tasks", icon: IconInbox, count: counts.all },
    { to: "/completed", label: "Completed", icon: IconCheck },
    { to: "/city", label: "Task City", icon: IconBuildingCommunity },
  ]

  const categories: NavItemDef[] = [
    { to: "/category/learning", label: "Learning", icon: IconSchool, count: counts.byCategory.learning },
    { to: "/category/work", label: "Work", icon: IconBriefcase, count: counts.byCategory.work },
    { to: "/category/personal", label: "Personal", icon: IconUser, count: counts.byCategory.personal },
  ]

  return (
    <aside className="flex w-[220px] shrink-0 flex-col gap-0.5 border-r border-border bg-surface px-3 py-4">
      <div className="flex items-center gap-2 px-2 pb-4 pt-1 text-[15px] font-medium text-foreground">
        <IconLayoutKanban size={18} className="text-brand" />
        Task Flow
      </div>

      <p className="px-2 pb-1 pt-2 text-[11px] uppercase tracking-wider text-content-3">
        Overview
      </p>
      {overview.map((item) => (
        <NavRow key={item.to} item={item} />
      ))}

      <p className="px-2 pb-1 pt-4 text-[11px] uppercase tracking-wider text-content-3">
        Categories
      </p>
      {categories.map((item) => (
        <NavRow key={item.to} item={item} />
      ))}

      <div className="mt-auto flex items-center gap-2 border-t border-border pl-2 pt-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-medium text-accent-foreground">
          YV
        </span>
        <span className="text-[13px] text-content-2">Yves</span>
        <button
          type="button"
          onClick={toggleTheme}
          title="Toggle dark mode"
          aria-label="Toggle dark mode"
          className="ml-auto cursor-pointer rounded-md p-1 text-content-3 hover:bg-secondary"
        >
          {theme === "dark" ? <IconMoon size={18} /> : <IconSun size={18} />}
        </button>
      </div>
    </aside>
  )
}
