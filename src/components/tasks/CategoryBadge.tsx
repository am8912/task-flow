import { cn } from "@/lib/utils"
import { formatCategoryLabel } from "@/data/mockTasks"

/** Fixed accent colours per category, matching the mockup's .tag styles.
 *  These stay constant across light/dark, as in the original design. */
const STYLES: Record<string, string> = {
  learning: "bg-[#EEEDFE] text-[#534AB7]",
  work: "bg-[#E1F5EE] text-[#0F6E56]",
  personal: "bg-[#FAEEDA] text-[#854F0B]",
  reading: "bg-[#EAF2FF] text-[#245E9C]",
  health: "bg-[#EAF7E7] text-[#426E22]",
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
        STYLES[category] ?? "bg-secondary text-content-2"
      )}
    >
      {formatCategoryLabel(category)}
    </span>
  )
}
