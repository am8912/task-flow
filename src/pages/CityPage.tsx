import { useEffect, useMemo, useRef, useState } from "react"
import { BlockCity } from "@/components/city/BlockCity"
import { useTasks } from "@/context/tasks-context"
import {
  CITY_STAT_MAX,
  deriveCityStatMax,
  deriveCityStats,
  MOCK_CITY_STATS,
} from "@/lib/cityStats"
import type { CityStats } from "@/components/city/cityEngine"

/**
 * Full-bleed "Block City" page. Seeds the four metrics from the live task list
 * once it loads (falling back to mock data), then lets the sliders drive the
 * city interactively.
 */
export default function CityPage() {
  const { tasks } = useTasks()
  const [stats, setStats] = useState<CityStats>(MOCK_CITY_STATS)
  const seeded = useRef(false)

  useEffect(() => {
    if (!seeded.current && tasks.length) {
      setStats(deriveCityStats(tasks))
      seeded.current = true
    }
  }, [tasks])

  // Bounds track the task list: completed's max = today's total workload,
  // so the city's growth ratio reflects today's completion rate.
  const maxes = useMemo(
    () => (tasks.length ? deriveCityStatMax(tasks) : CITY_STAT_MAX),
    [tasks]
  )

  // Faithful, read-only values for the top-right cards. Tracks the real task
  // list and is unaffected by the playground sliders.
  const cardStats = useMemo(
    () => (tasks.length ? deriveCityStats(tasks) : MOCK_CITY_STATS),
    [tasks]
  )

  return (
    <BlockCity
      stats={stats}
      cardStats={cardStats}
      maxes={maxes}
      onStatsChange={setStats}
    />
  )
}
