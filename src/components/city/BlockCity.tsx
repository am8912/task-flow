import { useEffect, useRef, useState } from "react"
import { IconMenu2 } from "@tabler/icons-react"
import { CityEngine, type CityStats } from "@/components/city/cityEngine"
import type { CityStatMax } from "@/lib/cityStats"
import { useSidebar } from "@/context/sidebar-context"

interface BlockCityProps {
  /** Playground values driven by the sliders; feeds the city simulation. */
  stats: CityStats
  /** Faithful, read-only values shown on the top-right cards. */
  cardStats: CityStats
  /** Per-metric slider/normalisation bounds (completed's max is dynamic). */
  maxes: CityStatMax
  onStatsChange: (stats: CityStats) => void
}

interface MetricDef {
  key: keyof CityStats
  color: string
  /** Stat-card caption. */
  cardLabel: string
  /** Slider caption (mono uppercase + Chinese theme word). */
  sliderLabel: string
}

const METRICS: MetricDef[] = [
  { key: "completedTasksToday", color: "#5b9e6a", cardLabel: "COMPLETED", sliderLabel: "COMPLETED · 成長" },
  { key: "pendingTasks", color: "#5a86c4", cardLabel: "PENDING", sliderLabel: "PENDING · 人潮" },
  { key: "overdueTasks", color: "#d97a55", cardLabel: "OVERDUE", sliderLabel: "OVERDUE · 警示" },
  { key: "newTasksToday", color: "#8a7fcc", cardLabel: "NEW TODAY", sliderLabel: "NEW · 建設" },
]

const mono = "'JetBrains Mono', monospace"

const BLOCK_CITY_CSS = `
.block-city input[type=range]{-webkit-appearance:none;appearance:none;background:transparent;cursor:pointer}
.block-city input[type=range]::-webkit-slider-runnable-track{height:6px;border-radius:6px;background:#e3e8ef}
.block-city input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:#fff;border:3px solid currentColor;margin-top:-5px;box-shadow:0 1px 3px rgba(60,80,110,.3)}
.block-city input[type=range]::-moz-range-track{height:6px;border-radius:6px;background:#e3e8ef}
.block-city input[type=range]::-moz-range-thumb{width:16px;height:16px;border:3px solid currentColor;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(60,80,110,.3)}

/* Below md, the header and stat cards collide (both are absolutely
 * positioned for a desktop-width canvas) — stack the stats under the
 * header instead, and let the sliders wrap 2-per-row so they stay usable.
 * The header is also shifted right to clear the hamburger button (below),
 * which only exists at this same breakpoint. */
@media (max-width: 768px) {
  .block-city .city-header { top: 20px !important; left: 60px !important; }
  .block-city .city-title { font-size: 20px !important; }
  .block-city .city-stats { top: 76px !important; right: 14px !important; left: 14px; flex-wrap: wrap; justify-content: flex-end; }
  .block-city .city-stat-card { min-width: 64px !important; padding: 7px 10px !important; }
  .block-city .city-stat-value { font-size: 22px !important; }
  .block-city .city-sliders { flex-wrap: wrap; gap: 14px 20px !important; padding: 12px 16px !important; }
  .block-city .city-slider { flex: 1 1 calc(50% - 10px) !important; }
}

/* display:flex has to come from a stylesheet rule (not the button's own
 * inline style) so this media query can win over it — an inline display
 * value would out-specificity md:hidden and the button would never hide. */
.block-city .city-menu-btn { display: flex; }
@media (min-width: 768px) {
  .block-city .city-menu-btn { display: none; }
}
`

export function BlockCity({ stats, cardStats, maxes, onStatsChange }: BlockCityProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<CityEngine | null>(null)
  const [people, setPeople] = useState(0)
  const { isOpen: sidebarOpen, open: openSidebar } = useSidebar()

  // Create the engine once; React owns its lifecycle.
  useEffect(() => {
    if (!canvasRef.current || !wrapRef.current) return
    const engine = new CityEngine(canvasRef.current, wrapRef.current, stats, setPeople, maxes)
    engineRef.current = engine
    engine.start()
    return () => {
      engine.stop()
      engineRef.current = null
    }
    // Intentionally run once — live updates flow through the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Feed new metric values into the running simulation.
  useEffect(() => {
    engineRef.current?.setStats(stats)
  }, [stats])

  // Keep the normalisation bounds (e.g. today's completion-rate denominator) live.
  useEffect(() => {
    engineRef.current?.setMax(maxes)
  }, [maxes])

  const setMetric = (key: keyof CityStats) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onStatsChange({ ...stats, [key]: parseInt(e.target.value, 10) })

  const card = (m: MetricDef) => (
    <div
      key={m.key}
      className="city-stat-card"
      style={{
        background: "#fff",
        border: "1px solid #e3e8ef",
        borderRadius: 14,
        padding: "11px 15px",
        textAlign: "center",
        minWidth: 84,
        boxShadow: "0 6px 16px rgba(80,110,150,0.14)",
      }}
    >
      <div className="city-stat-value" style={{ fontSize: 34, fontWeight: 900, lineHeight: 1, color: m.color }}>{cardStats[m.key]}</div>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: "#9aa3b2", marginTop: 5, fontFamily: mono }}>
        {m.cardLabel}
      </div>
    </div>
  )

  return (
    <div
      className="block-city"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#cfe7f3",
        fontFamily: "Nunito, sans-serif",
        color: "#2a3140",
        overflow: "hidden",
      }}
    >
      <style>{BLOCK_CITY_CSS}</style>

      <div ref={wrapRef} style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />

        {!sidebarOpen && (
          <button
            type="button"
            onClick={openSidebar}
            aria-label="Open menu"
            className="city-menu-btn"
            style={{
              position: "absolute",
              top: 18,
              left: 14,
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "#fff",
              border: "1px solid #e3e8ef",
              boxShadow: "0 6px 16px rgba(80,110,150,0.14)",
              color: "#2a3140",
              cursor: "pointer",
            }}
          >
            <IconMenu2 size={18} />
          </button>
        )}

        <div className="city-header" style={{ position: "absolute", top: 24, left: 28, pointerEvents: "none" }}>
          <div style={{ fontSize: 12, letterSpacing: 4, fontWeight: 800, color: "#d97a55", fontFamily: mono }}>TASK·FLOW</div>
          <div className="city-title" style={{ fontSize: 30, fontWeight: 900, color: "#2a3140", marginTop: 2, letterSpacing: 0.5 }}>
            任務之城 <span style={{ fontSize: 18, color: "#5a86c4" }}>WORKCITY</span>
          </div>
        </div>

        <div className="city-stats" style={{ position: "absolute", top: 22, right: 28, display: "flex", gap: 10, pointerEvents: "none" }}>
          {METRICS.map(card)}
        </div>

        <div style={{ position: "absolute", left: 28, bottom: 24, pointerEvents: "none" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "#fff",
              border: "1px solid #e3e8ef",
              borderRadius: 12,
              padding: "8px 14px",
              boxShadow: "0 6px 16px rgba(80,110,150,0.14)",
            }}
          >
            <span style={{ fontSize: 11, fontFamily: mono, color: "#9aa3b2" }}>{people} 市民</span>
          </div>
        </div>
      </div>

      <div
        className="city-sliders"
        style={{
          flex: "none",
          background: "#fff",
          borderTop: "1px solid #e3e8ef",
          padding: "14px 30px",
          display: "flex",
          alignItems: "stretch",
          gap: 26,
        }}
      >
        {METRICS.map((m) => (
          <div key={m.key} className="city-slider" style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, color: m.color }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, fontFamily: mono }}>{m.sliderLabel}</span>
              <span style={{ fontSize: 12, fontWeight: 900, fontFamily: mono }}>{stats[m.key]}</span>
            </div>
            <input
              type="range"
              min={0}
              max={maxes[m.key]}
              step={1}
              value={stats[m.key]}
              onChange={setMetric(m.key)}
              style={{ width: "100%", height: 16, color: m.color }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
