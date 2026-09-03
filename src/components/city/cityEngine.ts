/* eslint-disable @typescript-eslint/no-explicit-any --
 * Faithful port of an imperative canvas component. The renderer juggles many
 * ad-hoc geometry/colour records and a 2D context; `any` keeps the ported math
 * readable. The typed surface React relies on (CityStats, start/stop/setStats)
 * is declared explicitly. */
/**
 * Block City — isometric task-metrics visualisation.
 *
 * Ported from the `Block City.dc.html` Claude Design component into a plain,
 * framework-free controller so React can own its lifecycle. The four task
 * metrics drive the city: completed → growth/greenery, pending → foot traffic,
 * overdue → warning markers, new → construction sites.
 *
 * The drawing routines are a faithful port of the original canvas code; only
 * the React-specific scaffolding (refs, state, lifecycle) was replaced with the
 * `start` / `stop` / `setStats` surface used by {@link BlockCity}.
 */

/** The four metrics the city renders. Mirrors the design component props. */
export interface CityStats {
  completedTasksToday: number
  pendingTasks: number
  overdueTasks: number
  newTasksToday: number
}

export class CityEngine {
  // The original imperative blob hangs a lot of ad-hoc state off `this`; an
  // index signature keeps the faithful port readable without declaring dozens
  // of loosely-typed fields.
  [key: string]: any

  constructor(
    canvas: HTMLCanvasElement,
    wrap: HTMLElement,
    stats: CityStats,
    onPeople?: (count: number) => void,
    maxes?: Partial<CityStats>
  ) {
    this.canvas = canvas
    this.wrap = wrap
    this.onPeople = onPeople
    const g = (k: keyof CityStats, d: number) => Math.max(0, stats[k] ?? d)
    this.MAX = this.maxFrom(maxes)
    this.completed = g("completedTasksToday", 12)
    this.pending = g("pendingTasks", 16)
    this.overdue = g("overdueTasks", 3)
    this.newt = g("newTasksToday", 5)
    this.nComp = this.completed / this.MAX.completed
    this.nPend = this.pending / this.MAX.pending
    this.nOver = this.overdue / this.MAX.overdue
    this.nNew = this.newt / this.MAX.newt
    this.t = 0
    this.N = 15
    this.walkers = []
    this.gatherers = []
  }

  /** Update the live targets; the loop eases the city toward them. */
  setStats(stats: CityStats) {
    this.completed = Math.max(0, stats.completedTasksToday)
    this.pending = Math.max(0, stats.pendingTasks)
    this.overdue = Math.max(0, stats.overdueTasks)
    this.newt = Math.max(0, stats.newTasksToday)
  }

  /** Map the public per-metric maxes onto the engine's short keys (min 1). */
  maxFrom(maxes?: Partial<CityStats>) {
    return {
      completed: Math.max(1, maxes?.completedTasksToday ?? 40),
      pending: Math.max(1, maxes?.pendingTasks ?? 40),
      overdue: Math.max(1, maxes?.overdueTasks ?? 16),
      newt: Math.max(1, maxes?.newTasksToday ?? 16),
    }
  }

  /**
   * Update the normalisation denominators live. With `completedTasksToday` set
   * to today's total workload, `nComp` becomes today's completion rate.
   */
  setMax(maxes: Partial<CityStats>) {
    this.MAX = this.maxFrom(maxes)
  }

  // ===== math / color =====
  iso(gx: number, gy: number, z?: number) { return [(gx - gy) * 30, (gx + gy) * 15 - (z || 0)] }
  rng(seed: number) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
  shade(c: number[], f: number) { return 'rgb(' + (Math.min(255, c[0] * f) | 0) + ',' + (Math.min(255, c[1] * f) | 0) + ',' + (Math.min(255, c[2] * f) | 0) + ')' }
  mul(c: number[], f: number) { return [c[0] * f, c[1] * f, c[2] * f] }
  rgba(c: number[], a: number) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')' }

  isRoad(i: number) { return i === 3 || i === 7 || i === 11 }
  cellType(x: number, y: number) { if (this.isRoad(x) || this.isRoad(y)) return 'road'; return 'grass' }

  // ===== city setup =====
  setup() {
    const P = this.PAL = {
      red: [211, 124, 108], orange: [219, 158, 108], yellow: [224, 196, 132], green: [150, 180, 140], teal: [122, 172, 166],
      blue: [120, 150, 184], navy: [78, 98, 128], purple: [160, 150, 188], gray: [196, 200, 208], white: [238, 239, 242], sand: [224, 210, 184],
      glass: [176, 202, 212]
    }
    this.buildings = []; this.trees = []; this.ponds = []; this.conveyors = []; this.lights = []; this.plazas = []
    const T = [
      'office', 'resi', 'park', 'resi',
      'resi', 'plaza', 'office', 'build',
      'industry', 'office', 'build', 'resi',
      'station', 'park', 'resi', 'service']
    const starts = [0, 4, 8, 12]
    for (let dj = 0; dj < 4; dj++) for (let di = 0; di < 4; di++) {
      const ox = starts[di], oy = starts[dj], type = T[dj * 4 + di], seed = (di * 53 + dj * 97 + 7) | 0
      this.genDistrict(ox, oy, type, seed)
    }
    const occ = new Set(); for (const b of this.buildings) for (let i = 0; i < b.w; i++) for (let j = 0; j < b.d; j++) occ.add((b.x + i) + ',' + (b.y + j))
    this.occ = occ
    for (const b of this.buildings) b.baseFloors = b.floors
    // traffic lights at intersections
    for (const c of [3, 7, 11]) for (const r of [3, 7, 11]) this.lights.push({ x: c, y: r, ph: ((c * 7 + r) % 3) })
    // street lamps (appear as the city grows)
    this.lamps = []; for (const c of [3, 7, 11]) for (const r of [3, 7, 11]) this.lamps.push({ x: c + 0.12, y: r + 0.12 })
    // extra decorative trees (appear as the city grows)
    this.extraTrees = []
    for (const xy of [[1, 1], [13, 2], [2, 13], [13, 13], [9, 1], [1, 9], [6, 6], [8, 9], [5, 13], [13, 5]]) {
      const x = xy[0], y = xy[1]; if (this.cellType(x, y) === 'grass' && !occ.has(x + ',' + y)) this.extraTrees.push({ x: x + 0.5, y: y + 0.5, s: 0.8, c: P.green })
    }
    // gather points: plaza centres + selected building fronts
    this.gatherPts = []
    for (const pz of this.plazas) this.gatherPts.push({ x: pz.x + pz.w / 2, y: pz.y + pz.d / 2 })
    const gr = this.rng(99)
    for (const b of this.buildings) { if ((b.kind === 'build' || b.kind === 'station' || b.kind === 'office') && gr() < 0.5) this.gatherPts.push({ x: b.x + b.w / 2, y: b.y + b.d + 0.4 }) }
    if (!this.gatherPts.length) this.gatherPts.push({ x: 7.5, y: 7.5 })
    // construction + warning candidates (disjoint, deterministic spread)
    const pool = this.buildings.filter((b: any) => !b.central)
    const rr = this.rng(4321); const shuffled = pool.map((b: any) => [rr(), b]).sort((a: any, b: any) => a[0] - b[0]).map((p: any) => p[1])
    this.siteCandidates = shuffled.slice(0, 6)
    this.warnCandidates = shuffled.slice(6, 12)
    // small task objects: cargo crates + ground signboards
    this.crates = []; this.signs = []; const cr = this.rng(77)
    for (const b of this.buildings) {
      if ((b.kind === 'station' || b.kind === 'service' || b.kind === 'utility') && cr() < 0.6) this.crates.push({ x: b.x + b.w + 0.12, y: b.y + 0.2 })
      if ((b.kind === 'office') && cr() < 0.22) this.signs.push({ x: b.x - 0.18, y: b.y + b.d * 0.5, col: b.accent })
    }
    for (const pz of this.plazas) this.crates.push({ x: pz.x + 0.35, y: pz.y + 2.35 })
  }
  pushBuilding(b: any) { const P = this.PAL; b.cap = b.cap || P.white; this.buildings.push(b) }
  genDistrict(ox: number, oy: number, type: string, seed: number) {
    const P = this.PAL, r = this.rng(seed + 1)
    const C = (...a: any[]) => a[(r() * a.length) | 0]
    if (type === 'park') {
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { if (r() < 0.5) this.trees.push({ x: ox + i + 0.5, y: oy + j + 0.5, s: 0.8 + r() * 0.5, c: C(P.green, P.green, P.teal) }) }
      this.ponds.push({ x: ox + 0.4, y: oy + 1.4, w: 1.6, d: 1.2 }); return
    }
    if (type === 'plaza') {
      this.plazas.push({ x: ox, y: oy, w: 3, d: 3 })
      // central growth tower (glass office)
      this.pushBuilding({ x: ox + 1, y: oy + 1, w: 1, d: 1, floors: 4, col: P.teal, cap: P.white, kind: 'office', accent: P.teal, central: true })
      this.trees.push({ x: ox + 0.5, y: oy + 0.5, s: 0.8, c: P.green }); this.trees.push({ x: ox + 2.5, y: oy + 2.5, s: 0.8, c: P.green }); return
    }
    if (type === 'build') {
      const x = ox + (r() < 0.5 ? 0 : 1), y = oy + (r() < 0.5 ? 0 : 1)
      this.pushBuilding({ x, y, w: 2, d: 2, floors: 4 + (r() * 3 | 0), col: C(P.blue, P.teal, P.purple), cap: P.white, kind: 'office', accent: P.blue })
      this.pushBuilding({ x: ox + 2, y: oy + 2, w: 1, d: 1, floors: 2, col: P.sand, cap: P.orange, kind: 'service', accent: P.orange }); return
    }
    if (type === 'industry') {
      this.pushBuilding({ x: ox, y: oy, w: 1, d: 3, floors: 2, col: P.gray, cap: P.red, kind: 'utility', accent: P.red })
      this.pushBuilding({ x: ox + 2, y: oy, w: 1, d: 3, floors: 2, col: P.gray, cap: P.teal, kind: 'utility', accent: P.teal })
      this.conveyors.push({ x0: ox + 0.5, y0: oy + 0.5, x1: ox + 2.5, y1: oy + 2.5, col: P.orange }); return
    }
    if (type === 'station') {
      this.pushBuilding({ x: ox, y: oy, w: 3, d: 1, floors: 2, col: P.navy, cap: P.yellow, kind: 'station', accent: P.yellow })
      this.conveyors.push({ x0: ox + 0.5, y0: oy + 1.6, x1: ox + 2.5, y1: oy + 1.6, col: P.blue, rail: true })
      this.pushBuilding({ x: ox + 1, y: oy + 2, w: 1, d: 1, floors: 1, col: P.sand, cap: P.red, kind: 'service', accent: P.red }); return
    }
    if (type === 'office') {
      this.pushBuilding({ x: ox, y: oy, w: 1, d: 1, floors: 5 + (r() * 7 | 0), col: C(P.blue, P.navy, P.teal, P.purple), cap: C(P.white, P.white, P.teal), kind: 'office', accent: P.blue })
      this.pushBuilding({ x: ox + 2, y: oy, w: 1, d: 2, floors: 4 + (r() * 5 | 0), col: C(P.blue, P.teal, P.navy), cap: P.white, kind: 'office', accent: P.teal })
      this.pushBuilding({ x: ox, y: oy + 2, w: 2, d: 1, floors: 3 + (r() * 4 | 0), col: C(P.navy, P.blue, P.gray), cap: C(P.yellow, P.white), kind: 'office', accent: P.yellow }); return
    }
    if (type === 'service') {
      this.pushBuilding({ x: ox, y: oy, w: 2, d: 1, floors: 2, col: C(P.orange, P.sand), cap: P.red, kind: 'service', accent: P.red })
      this.pushBuilding({ x: ox + 1, y: oy + 1, w: 1, d: 2, floors: 3, col: C(P.purple, P.teal), cap: P.white, kind: 'service', accent: P.purple })
      this.trees.push({ x: ox + 0.5, y: oy + 2.5, s: 0.8, c: P.green }); return
    }
    // resi
    const cols = [P.red, P.orange, P.yellow, P.green, P.teal, P.purple, P.sand]
    this.pushBuilding({ x: ox, y: oy, w: 1, d: 1, floors: 2 + (r() * 5 | 0), col: C(...cols), cap: C(P.white, P.sand), kind: 'resi', accent: C(...cols) })
    this.pushBuilding({ x: ox + 2, y: oy + 1, w: 1, d: 1, floors: 3 + (r() * 5 | 0), col: C(...cols), cap: P.white, kind: 'resi', accent: C(...cols) })
    this.pushBuilding({ x: ox + 1, y: oy + 2, w: 2, d: 1, floors: 2 + (r() * 4 | 0), col: C(...cols), cap: C(P.white, P.sand), kind: 'resi', accent: C(...cols) })
    this.trees.push({ x: ox + 0.5, y: oy + 1.5, s: 0.75, c: P.green })
  }

  // ===== people =====
  citizenCol() { const P = this.PAL, c = [P.red, P.blue, P.purple, P.teal, P.orange, P.navy]; return c[(Math.random() * c.length) | 0] }
  newWalker() {
    const lanes = [3, 7, 11], r = Math.random, horiz = r() < 0.5, road = lanes[(r() * 3) | 0], dir = r() < 0.5 ? 1 : -1
    return { horiz, road, dir, off: dir > 0 ? 0.34 : 0.66, t: r() * this.N, sp: 0.5 + r() * 0.5, col: this.citizenCol(), carry: r() < 0.3, ph: r() * 6.28 }
  }
  newGatherer() {
    const pt = this.gatherPts[(Math.random() * this.gatherPts.length) | 0] || { x: 7.5, y: 7.5 }, r = Math.random
    return { cx: pt.x, cy: pt.y, r: 0.3 + r() * 0.85, ang: r() * 6.28, sp: 0.4 + r() * 0.6, col: this.citizenCol(), carry: r() < 0.25, ph: r() * 6.28 }
  }
  walkerPos(w: any) { return w.horiz ? [w.t, w.road + w.off] : [w.road + w.off, w.t] }

  updateSim(dt: number) {
    const pendN = this.nPend
    const wT = Math.round(12 + pendN * 104)
    while (this.walkers.length < wT) this.walkers.push(this.newWalker())
    while (this.walkers.length > wT) this.walkers.pop()
    for (const w of this.walkers) { w.t += w.sp * (0.5 + pendN * 1.2) * dt * w.dir; if (w.t > this.N) w.t -= this.N; if (w.t < 0) w.t += this.N; w.ph += dt * 7 }
    const gT = Math.round(pendN * 92)
    while (this.gatherers.length < gT) this.gatherers.push(this.newGatherer())
    while (this.gatherers.length > gT) this.gatherers.pop()
    for (const g of this.gatherers) { g.ang += g.sp * (0.4 + pendN) * dt; g.ph += dt * 8 * (0.4 + pendN) }
    // construction sites scale with new tasks
    const ks = Math.round(this.nNew * this.siteCandidates.length)
    this.siteCandidates.forEach((b: any, i: number) => b.active = i < ks)
    // warnings scale with overdue
    const kw = Math.round(this.nOver * this.warnCandidates.length)
    this.warnCandidates.forEach((b: any, i: number) => b.warn = i < kw)
  }

  // ===== brick primitives (refined model) =====
  topFace(ctx: any, x: number, y: number, w: number, d: number, z: number, col: number[]) {
    const a = this.iso(x, y, z), b = this.iso(x + w, y, z), c = this.iso(x + w, y + d, z), e = this.iso(x, y + d, z)
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(e[0], e[1]); ctx.closePath(); ctx.fillStyle = this.shade(col, 1.0); ctx.fill()
  }
  quad(ctx: any, bl: number[], ex: number[], ey: number[], u0: number, v0: number, u1: number, v1: number, fill: string) {
    const P = (u: number, v: number) => [bl[0] + ex[0] * u + ey[0] * v, bl[1] + ex[1] * u + ey[1] * v]
    const a = P(u0, v0), b = P(u1, v0), c = P(u1, v1), e = P(u0, v1)
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(e[0], e[1]); ctx.closePath(); ctx.fillStyle = fill; ctx.fill()
  }
  face(ctx: any, p1: number[], p2: number[], zb: number, zt: number, col: number[], sh: number, opts?: any) {
    const bl = this.iso(p1[0], p1[1], zb), br = this.iso(p2[0], p2[1], zb), tr = this.iso(p2[0], p2[1], zt), tl = this.iso(p1[0], p1[1], zt)
    ctx.beginPath(); ctx.moveTo(bl[0], bl[1]); ctx.lineTo(br[0], br[1]); ctx.lineTo(tr[0], tr[1]); ctx.lineTo(tl[0], tl[1]); ctx.closePath()
    ctx.fillStyle = this.shade(col, sh); ctx.fill()
    const ex = [br[0] - bl[0], br[1] - bl[1]], ey = [tl[0] - bl[0], tl[1] - bl[1]]
    const PT = (u: number, v: number) => [bl[0] + ex[0] * u + ey[0] * v, bl[1] + ex[1] * u + ey[1] * v]
    const floors = Math.max(1, Math.round((zt - zb) / 16))
    this.quad(ctx, bl, ex, ey, 0, 0, 1, Math.min(0.16, 0.9 / floors), this.shade(col, sh * 0.9))
    if (opts && opts.win) {
      const glass = opts.glass || this.PAL.glass, cols = Math.max(2, Math.round((opts.len || 1) / 0.34))
      const inset = 0.10, gap = 0.26, cw = (1 - inset * 2) / cols, lit = [255, 238, 196]
      for (let f = 0; f < floors; f++) {
        const v0 = (f + 0.30) / floors, v1 = (f + 0.86) / floors
        for (let i = 0; i < cols; i++) {
          const u0 = inset + i * cw + cw * gap * 0.5, u1 = inset + (i + 1) * cw - cw * gap * 0.5
          const hsh = ((i * 37 + f * 61 + opts.seed) % 100) / 100; let on = hsh < (0.22 + this.nPend * 0.4); if (hsh > 0.86 && Math.sin(this.t * 2.5 + i + f) > 0.45) on = !on
          const fill = on ? this.rgba(lit, 0.92) : this.shade(glass, sh * (0.86 + (i + f) % 2 * 0.1))
          this.quad(ctx, bl, ex, ey, u0, v0, u1, v1, fill)
        }
      }
    } else if (floors > 2) {
      ctx.strokeStyle = this.rgba((this.shade(col, sh * 0.86).match(/\d+/g) || []).map(Number), 0.5); ctx.lineWidth = 0.8
      for (let f = 1; f < floors; f++) { if (f % 2) continue; const v = f / floors; const a = PT(0.04, v), b = PT(0.96, v); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke() }
    }
  }
  drawBox(ctx: any, x: number, y: number, w: number, d: number, zb: number, zt: number, col: number[], opts?: any) {
    opts = opts || {}
    this.face(ctx, [x + w, y], [x + w, y + d], zb, zt, col, 0.86, opts.win ? { win: 1, len: d, seed: (opts.seed || 3), glass: opts.glass } : null)
    this.face(ctx, [x + w, y + d], [x, y + d], zb, zt, col, 0.7, opts.win ? { win: 1, len: w, seed: (opts.seed || 9) + 5, glass: opts.glass } : null)
    this.topFace(ctx, x, y, w, d, zt, opts.cap || col)
    return this.iso(x + w / 2, y + d / 2, zt)
  }
  roofKind(b: any) {
    const h = ((b.x * 29 + b.y * 53 + b.w * 7) % 100) / 100
    if (b.kind === 'office' || b.kind === 'station') { if (h < 0.30) return 'penthouse'; if (h < 0.52) return 'mech'; if (h < 0.74) return 'water'; return 'sign' }
    if (b.kind === 'resi') return h < 0.5 ? 'garden' : 'terrace'
    if (b.kind === 'utility') return 'water'
    return 'mech'
  }
  drawRoof(ctx: any, b: any, H: number) {
    const P = this.PAL, x = b.x, y = b.y, w = b.w, d = b.d, cap = b.cap || P.white, kind = this.roofKind(b)
    this.topFace(ctx, x + 0.12, y + 0.12, w - 0.24, d - 0.24, H + 0.6, this.mul(cap, 0.9))
    if (kind === 'penthouse') {
      const pw = Math.max(0.5, w * 0.5), pd = Math.max(0.5, d * 0.5)
      this.drawBox(ctx, x + (w - pw) / 2, y + (d - pd) / 2, pw, pd, H + 0.6, H + 15, this.mul(cap, 1.0), { win: 1, len: pw, glass: P.glass, seed: (b.x * 5 + b.y * 3), cap: this.mul(cap, 1.04) })
    } else if (kind === 'garden') {
      this.topFace(ctx, x + 0.22, y + 0.22, w - 0.44, d - 0.44, H + 1.2, P.green)
      this.drawBox(ctx, x + 0.3, y + 0.3, 0.28, 0.28, H + 1.2, H + 9, P.green, { cap: this.mul(P.green, 1.1) })
      this.drawBox(ctx, x + w - 0.58, y + d - 0.58, 0.28, 0.28, H + 1.2, H + 8, P.teal, { cap: this.mul(P.teal, 1.1) })
    } else if (kind === 'terrace') {
      const pw = Math.max(0.5, w * 0.6), pd = Math.max(0.5, d * 0.6)
      this.drawBox(ctx, x + 0.1, y + 0.1, pw, pd, H + 0.6, H + 11, this.mul(cap, 1.0), { cap: this.mul(cap, 1.04) })
      this.topFace(ctx, x + pw + 0.15, y + 0.15, Math.max(0.2, w - pw - 0.25), d - 0.3, H + 1.0, this.mul(P.green, 0.96))
    } else if (kind === 'water') {
      const c = this.iso(x + w / 2, y + d / 2, H + 0.6)
      ctx.strokeStyle = this.shade(P.gray, 0.66); ctx.lineWidth = 1.6
      ctx.beginPath(); ctx.moveTo(c[0] - 6, c[1]); ctx.lineTo(c[0] - 6, c[1] - 5); ctx.moveTo(c[0] + 6, c[1]); ctx.lineTo(c[0] + 6, c[1] - 5); ctx.stroke()
      ctx.fillStyle = this.shade(P.gray, 0.78); ctx.fillRect(c[0] - 7, c[1] - 21, 14, 16)
      ctx.fillStyle = this.shade(P.gray, 1.14); ctx.beginPath(); ctx.ellipse(c[0], c[1] - 21, 7, 3.2, 0, 0, 6.28); ctx.fill()
      ctx.fillStyle = this.shade(P.gray, 0.66); ctx.beginPath(); ctx.ellipse(c[0], c[1] - 5, 7, 3.2, 0, 0, 6.28); ctx.fill()
    } else if (kind === 'sign') {
      const c = this.iso(x + w / 2, y + d / 2, H + 0.6)
      ctx.strokeStyle = this.shade(P.gray, 0.62); ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(c[0] - 10, c[1]); ctx.lineTo(c[0] - 10, c[1] - 18); ctx.moveTo(c[0] + 10, c[1]); ctx.lineTo(c[0] + 10, c[1] - 18); ctx.stroke()
      ctx.fillStyle = this.shade(b.accent, 1.0); ctx.fillRect(c[0] - 13, c[1] - 30, 26, 13)
      ctx.fillStyle = this.shade(b.accent, 1.16); ctx.fillRect(c[0] - 13, c[1] - 30, 26, 2.5)
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(c[0] - 9, c[1] - 26, 9, 3); ctx.fillRect(c[0] - 9, c[1] - 22, 16, 3)
    } else {
      this.drawBox(ctx, x + w * 0.5 - 0.12, y + d * 0.4 - 0.12, 0.34, 0.24, H + 0.6, H + 7, this.mul(cap, 0.94), { cap: this.mul(cap, 1.0) })
      const v = this.iso(x + w * 0.35, y + d * 0.65, H + 0.6); ctx.fillStyle = this.shade(cap, 0.86); ctx.fillRect(v[0] - 3, v[1] - 6, 6, 6)
    }
  }
  drawBuilding(ctx: any, b: any) {
    const P = this.PAL, fh = 16
    let floors = b.active ? Math.max(1, Math.round(b.baseFloors * 0.5))
      : b.baseFloors + (b.central ? Math.round(this.nComp * 14) : Math.round(this.nComp * 2.2))
    floors = Math.max(1, floors); const H = floors * fh
    const top = this.drawBox(ctx, b.x, b.y, b.w, b.d, 0, H, b.col, { win: (b.kind === 'office' || b.kind === 'resi' || b.kind === 'station'), cap: b.cap, glass: P.glass, seed: (b.x * 13 + b.y * 7) })
    if (b.active) { this.drawMaterials(ctx, b); this.drawScaffold(ctx, b, H); this.drawCrane(ctx, b, H) }
    else {
      this.drawRoof(ctx, b, H)
      if (b.kind === 'resi' && (b.x * 7 + b.y) % 2 === 0) this.drawBalconies(ctx, b, floors)
      if (b.kind === 'office' || b.kind === 'station' || b.kind === 'service') this.drawEntrance(ctx, b)
      if (b.kind === 'utility') {
        const c = this.iso(b.x + b.w / 2, b.y + b.d * 0.5, H); ctx.fillStyle = this.shade(b.accent, 0.9); ctx.fillRect(c[0] - 7, c[1] - 18, 14, 18)
        ctx.fillStyle = this.shade(b.accent, 1.1); ctx.beginPath(); ctx.ellipse(c[0], c[1] - 18, 7, 3.4, 0, 0, 6.28); ctx.fill()
      }
    }
    b._top = top; return top
  }
  drawBalconies(ctx: any, b: any, floors: number) {
    const cap = b.cap
    for (let f = 1; f < floors; f++) { if ((f + b.x) % 2) continue; this.drawBox(ctx, b.x + 0.12, b.y + b.d, b.w - 0.24, 0.12, f * 16 - 7, f * 16 - 3, this.mul(cap, 0.9), { cap: this.mul(cap, 1.02) }) }
  }
  drawEntrance(ctx: any, b: any) {
    const ax = b.x + b.w * 0.32, aw = b.w * 0.36
    this.drawBox(ctx, ax, b.y + b.d, aw, 0.16, 9, 12, this.mul(b.accent, 1.0), { cap: this.mul(b.accent, 1.14) })
  }
  drawCrate(ctx: any, o: any) {
    const P = this.PAL, c = [P.orange, P.teal, P.sand]
    this.drawBox(ctx, o.x, o.y, 0.3, 0.3, 0, 7, c[0], { cap: this.mul(c[0], 1.1) })
    this.drawBox(ctx, o.x + 0.34, o.y + 0.05, 0.26, 0.26, 0, 6, c[1], { cap: this.mul(c[1], 1.1) })
    this.drawBox(ctx, o.x + 0.06, o.y + 0.04, 0.24, 0.24, 7, 13, c[2], { cap: this.mul(c[2], 1.1) })
  }
  drawSign(ctx: any, o: any) {
    const b = this.iso(o.x, o.y, 0)
    ctx.fillStyle = '#9097a2'; ctx.fillRect(b[0] - 1, b[1] - 13, 2, 13)
    ctx.fillStyle = this.shade(o.col, 1.0); ctx.fillRect(b[0] - 9, b[1] - 23, 18, 11)
    ctx.fillStyle = this.shade(o.col, 1.16); ctx.fillRect(b[0] - 9, b[1] - 23, 18, 2.2)
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(b[0] - 6, b[1] - 19, 12, 2); ctx.fillRect(b[0] - 6, b[1] - 15, 8, 2)
  }
  drawScaffold(ctx: any, b: any, H: number) {
    const cs = [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.d], [b.x, b.y + b.d]]
    ctx.strokeStyle = 'rgba(150,154,164,0.85)'; ctx.lineWidth = 1.4
    for (const c of cs) { const a = this.iso(c[0], c[1], 0), t = this.iso(c[0], c[1], H + 10); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(t[0], t[1]); ctx.stroke() }
    for (const z of [H * 0.45, H * 0.85]) { const p1 = this.iso(b.x + b.w, b.y, z), p2 = this.iso(b.x + b.w, b.y + b.d, z), p3 = this.iso(b.x, b.y + b.d, z); ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.stroke() }
  }
  drawMaterials(ctx: any, b: any) {
    const P = this.PAL, cols = [P.orange, P.teal, P.yellow]
    const bx = b.x - 0.02, by = b.y + b.d + 0.12
    this.drawBox(ctx, bx, by, 0.3, 0.3, 0, 9, cols[0], { cap: this.mul(cols[0], 1.1) })
    this.drawBox(ctx, bx + 0.34, by, 0.3, 0.3, 0, 9, cols[1], { cap: this.mul(cols[1], 1.1) })
    this.drawBox(ctx, bx + 0.17, by, 0.3, 0.3, 9, 18, cols[2], { cap: this.mul(cols[2], 1.1) })
  }
  drawCrane(ctx: any, b: any, H: number) {
    const P = this.PAL, baseX = b.x + b.w - 0.2, baseY = b.y + 0.2, towerH = H + 70
    this.drawBox(ctx, baseX - 0.12, baseY - 0.12, 0.24, 0.24, 0, towerH, P.yellow, { cap: P.yellow })
    const topc = this.iso(baseX, baseY, towerH)
    const ang = Math.sin(this.t * 0.5) * 0.5 + 0.3, jl = 120, ex = Math.cos(ang), ey = Math.sin(ang) * 0.5
    const jx = topc[0] + ex * jl, jy = topc[1] + ey * jl, cbx = topc[0] - ex * jl * 0.4, cby = topc[1] - ey * jl * 0.4
    ctx.strokeStyle = this.shade(P.yellow, 0.95); ctx.lineWidth = 5; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(cbx, cby); ctx.lineTo(jx, jy); ctx.stroke()
    ctx.fillStyle = this.shade(P.navy, 1.0); ctx.fillRect(cbx - 6, cby - 6, 12, 12)
    const drop = 40 + Math.abs(Math.sin(this.t * 0.9)) * 46
    ctx.strokeStyle = 'rgba(60,70,90,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(jx, jy); ctx.lineTo(jx, jy + drop); ctx.stroke()
    ctx.fillStyle = this.shade(P.red, 1.0); ctx.fillRect(jx - 7, jy + drop, 14, 9)
    ctx.fillStyle = this.shade(P.yellow, 0.85); ctx.fillRect(topc[0] - 5, topc[1] - 2, 10, 10)
  }
  drawTree(ctx: any, tr: any) {
    const b = this.iso(tr.x, tr.y, 0), s = tr.s
    ctx.fillStyle = 'rgba(60,80,60,0.16)'; ctx.beginPath(); ctx.ellipse(b[0], b[1], 11 * s, 5 * s, 0, 0, 6.28); ctx.fill()
    ctx.fillStyle = this.shade([150, 120, 92], 1); ctx.fillRect(b[0] - 1.6, b[1] - 14 * s, 3.2, 14 * s)
    const cy = b[1] - 24 * s
    ctx.fillStyle = this.shade(tr.c, 0.82); ctx.beginPath(); ctx.ellipse(b[0], cy + 4 * s, 11 * s, 9 * s, 0, 0, 6.28); ctx.fill()
    ctx.fillStyle = this.shade(tr.c, 1.0); ctx.beginPath(); ctx.ellipse(b[0] - 1 * s, cy, 10 * s, 8 * s, 0, 0, 6.28); ctx.fill()
    ctx.fillStyle = this.shade(tr.c, 1.14); ctx.beginPath(); ctx.ellipse(b[0] - 3 * s, cy - 3 * s, 5.5 * s, 4.5 * s, 0, 0, 6.28); ctx.fill()
  }
  drawPond(ctx: any, p: any) {
    const a = this.iso(p.x, p.y, 0), b = this.iso(p.x + p.w, p.y, 0), c = this.iso(p.x + p.w, p.y + p.d, 0), e = this.iso(p.x, p.y + p.d, 0)
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(e[0], e[1]); ctx.closePath()
    ctx.fillStyle = '#7fc0dd'; ctx.fill(); const pulse = 0.5 + 0.5 * Math.sin(this.t * 1.5)
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.3 + 0.3 * pulse) + ')'; ctx.lineWidth = 1.5
    const m = this.iso(p.x + p.w / 2, p.y + p.d / 2, 0); ctx.beginPath(); ctx.ellipse(m[0], m[1], 10, 5, 0, 0, 6.28); ctx.stroke()
  }
  drawPerson(ctx: any, wx: number, wy: number, p: any) {
    const b = this.iso(wx, wy, 0), bob = Math.abs(Math.sin(this.t * 8 + (p.ph || 0))) * 1.4
    ctx.fillStyle = 'rgba(40,50,70,0.22)'; ctx.beginPath(); ctx.ellipse(b[0], b[1], 3.4, 1.7, 0, 0, 6.28); ctx.fill()
    ctx.fillStyle = this.shade(p.col, 1.0); ctx.fillRect(b[0] - 2.6, b[1] - 11 - bob, 5.2, 8.2)
    ctx.fillStyle = '#f0cba0'; ctx.beginPath(); ctx.arc(b[0], b[1] - 13 - bob, 2.4, 0, 6.28); ctx.fill()
    if (p.hat) { ctx.fillStyle = this.shade(this.PAL.yellow, 1.05); ctx.fillRect(b[0] - 2.8, b[1] - 15.2 - bob, 5.6, 2.2) }
    if (p.carry) { ctx.fillStyle = this.shade(this.PAL.orange, 1.0); ctx.fillRect(b[0] - 3.4, b[1] - 17.2 - bob, 6.8, 4.4); ctx.fillStyle = this.shade(this.PAL.orange, 1.15); ctx.fillRect(b[0] - 3.4, b[1] - 17.2 - bob, 6.8, 1.4) }
  }
  drawLamp(ctx: any, l: any) {
    const b = this.iso(l.x, l.y, 0), pulse = 0.5 + 0.5 * Math.sin(this.t * 1.2 + l.x)
    ctx.fillStyle = '#9097a2'; ctx.fillRect(b[0] - 1, b[1] - 15, 2, 15)
    ctx.fillStyle = this.rgba([255, 224, 150], 0.55 + 0.3 * pulse); ctx.beginPath(); ctx.arc(b[0], b[1] - 16, 3 + pulse * 0.8, 0, 6.28); ctx.fill()
  }
  drawGround(ctx: any) {
    const N = this.N
    const grass = [178, 198, 158], grass2 = [168, 190, 148], road = [180, 184, 192], dash = [226, 200, 140], plaza = [222, 216, 204]
    const D = 22; const rA = this.iso(N, 0), rB = this.iso(N, N), fC = this.iso(0, N)
    ctx.fillStyle = '#c4b9a0'; ctx.beginPath(); ctx.moveTo(rA[0], rA[1]); ctx.lineTo(rB[0], rB[1]); ctx.lineTo(rB[0], rB[1] + D); ctx.lineTo(rA[0], rA[1] + D); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#b3a88e'; ctx.beginPath(); ctx.moveTo(rB[0], rB[1]); ctx.lineTo(fC[0], fC[1]); ctx.lineTo(fC[0], fC[1] + D); ctx.lineTo(rB[0], rB[1] + D); ctx.closePath(); ctx.fill()
    const plazaSet = new Set(); for (const pz of this.plazas) for (let i = 0; i < pz.w; i++) for (let j = 0; j < pz.d; j++) plazaSet.add((pz.x + i) + ',' + (pz.y + j))
    for (let q = 0; q <= 2 * N; q++) for (let x = 0; x < N; x++) {
      const y = q - x; if (y < 0 || y >= N) continue
      const t = this.cellType(x, y), isPlaza = plazaSet.has(x + ',' + y)
      const a = this.iso(x, y), b = this.iso(x + 1, y), c = this.iso(x + 1, y + 1), e = this.iso(x, y + 1)
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(e[0], e[1]); ctx.closePath()
      const col = t === 'road' ? road : (isPlaza ? plaza : ((x + y) % 2 ? grass : grass2))
      ctx.fillStyle = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')'; ctx.fill()
    }
    ctx.lineWidth = 2; for (const c of [3, 7, 11]) {
      for (let s = 0; s < N; s += 0.6) {
        const a = this.iso(c + 0.5, s, 1), b = this.iso(c + 0.5, Math.min(N, s + 0.32), 1); ctx.strokeStyle = this.rgba(dash, 0.8); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke()
        const a2 = this.iso(s, c + 0.5, 1), b2 = this.iso(Math.min(N, s + 0.32), c + 0.5, 1); ctx.beginPath(); ctx.moveTo(a2[0], a2[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke()
      }
    }
  }
  drawConveyor(ctx: any, cv: any) {
    const steps = 10
    for (let i = 0; i < steps; i++) { const tt = ((i / steps) + (this.t * 0.25) % 1) % 1, x = cv.x0 + (cv.x1 - cv.x0) * tt, y = cv.y0 + (cv.y1 - cv.y0) * tt, p = this.iso(x, y, 2); ctx.fillStyle = this.shade(cv.col, 1.0); ctx.fillRect(p[0] - 4, p[1] - 7, 8, 6); ctx.fillStyle = this.shade(cv.col, 1.15); ctx.fillRect(p[0] - 4, p[1] - 8, 8, 2) }
    const a = this.iso(cv.x0, cv.y0, 0), b = this.iso(cv.x1, cv.y1, 0)
    ctx.strokeStyle = 'rgba(70,80,100,0.4)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke()
  }
  drawLight(ctx: any, l: any) {
    const b = this.iso(l.x + 0.5, l.y + 0.5, 0), phase = Math.floor(this.t * 0.6 + l.ph) % 3
    ctx.fillStyle = '#3a4150'; ctx.fillRect(b[0] - 1.5, b[1] - 18, 3, 18)
    const cols = ['#5b9e6a', '#e0c484', '#d97a55']; for (let i = 0; i < 3; i++) { ctx.fillStyle = i === phase ? cols[i] : this.shade([90, 96, 110], 1); ctx.beginPath(); ctx.arc(b[0], b[1] - 14 + i * 4.5, 2, 0, 6.28); ctx.fill() }
  }
  drawLabel(ctx: any, b: any, top: number[]) {
    const x = top[0], y = top[1] - 40 - Math.sin(this.t * 1.5 + b.x) * 4, w = 46, h = 20
    ctx.fillStyle = 'rgba(42,49,64,0.92)'; if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 6); ctx.fill() } else ctx.fillRect(x - w / 2, y - h / 2, w, h)
    ctx.fillStyle = this.shade([91, 158, 106], 1.1); ctx.beginPath(); ctx.arc(x - w / 2 + 11, y, 5, 0, 6.28); ctx.fill()
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - w / 2 + 8.5, y); ctx.lineTo(x - w / 2 + 10.5, y + 2.2); ctx.lineTo(x - w / 2 + 14, y - 2.6); ctx.stroke()
    const pv = this.nComp; ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x - 6, y - 3, 24, 6)
    ctx.fillStyle = this.shade([91, 158, 106], 1.1); ctx.fillRect(x - 6, y - 3, 24 * pv, 6)
    ctx.fillStyle = 'rgba(42,49,64,0.92)'; ctx.beginPath(); ctx.moveTo(x - 4, y + h / 2 - 1); ctx.lineTo(x + 4, y + h / 2 - 1); ctx.lineTo(x, y + h / 2 + 5); ctx.closePath(); ctx.fill()
  }
  drawWarn(ctx: any, top: number[]) {
    const pulse = 0.5 + 0.5 * Math.sin(this.t * 4), x = top[0], y = top[1] - 24 - Math.sin(this.t * 2) * 2, s = 11
    ctx.fillStyle = this.rgba([217, 122, 85], 0.25 + 0.2 * pulse); ctx.beginPath(); ctx.arc(x, y, s + 5, 0, 6.28); ctx.fill()
    ctx.fillStyle = '#d97a55'; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.92, y + s * 0.7); ctx.lineTo(x - s * 0.92, y + s * 0.7); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 1.4, y - 5, 2.8, 7); ctx.beginPath(); ctx.arc(x, y + 5, 1.5, 0, 6.28); ctx.fill()
  }

  render() {
    const cv = this.canvas; if (!cv || !this.wrap) return
    const ctx = cv.getContext('2d'), dpr = window.devicePixelRatio || 1
    const w = this.wrap.clientWidth, h = this.wrap.clientHeight
    if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#d4ecf6'); sky.addColorStop(1, '#eaf4ea')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h)
    const g = ctx.createRadialGradient(w * 0.5, h * 0.18, 20, w * 0.5, h * 0.18, h * 0.7); g.addColorStop(0, 'rgba(255,250,220,0.6)'); g.addColorStop(1, 'rgba(255,250,220,0)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
    const worldW = 900, worldH = 560, pad = 40
    const s = Math.min((w - pad * 2) / worldW, (h - 150) / worldH)
    ctx.save(); ctx.translate(w / 2, pad + 90); ctx.scale(s, s); ctx.translate(0, 40)

    this.drawGround(ctx)
    for (const cvn of this.conveyors) this.drawConveyor(ctx, cvn)

    const items: any[] = []
    for (const b of this.buildings) items.push({ d: (b.x + b.w) + (b.y + b.d), z: 1, f: () => this.drawBuilding(ctx, b) })
    for (const t of this.trees) items.push({ d: t.x + t.y + 0.3, z: 0, f: () => this.drawTree(ctx, t) })
    const etv = Math.round(this.nComp * this.extraTrees.length)
    for (let i = 0; i < etv; i++) { const t = this.extraTrees[i]; items.push({ d: t.x + t.y + 0.3, z: 0, f: () => this.drawTree(ctx, t) }) }
    for (const p of this.ponds) items.push({ d: p.x + p.y, z: -1, f: () => this.drawPond(ctx, p) })
    for (const o of this.crates) items.push({ d: o.x + o.y + 0.2, z: 0, f: () => this.drawCrate(ctx, o) })
    for (const o of this.signs) items.push({ d: o.x + o.y + 0.1, z: 0, f: () => this.drawSign(ctx, o) })
    for (const l of this.lights) items.push({ d: l.x + l.y + 0.5, z: 0, f: () => this.drawLight(ctx, l) })
    const lv = Math.round(this.nComp * this.lamps.length)
    for (let i = 0; i < lv; i++) { const l = this.lamps[i]; items.push({ d: l.x + l.y + 0.4, z: 0, f: () => this.drawLamp(ctx, l) }) }
    for (const w of this.walkers) { const p = this.walkerPos(w); items.push({ d: p[0] + p[1], z: 0, f: () => this.drawPerson(ctx, p[0], p[1], w) }) }
    for (const gg of this.gatherers) { const x = gg.cx + Math.cos(gg.ang) * gg.r, y = gg.cy + Math.sin(gg.ang) * gg.r; items.push({ d: x + y, z: 0, f: () => this.drawPerson(ctx, x, y, gg) }) }
    // construction carriers around active sites
    for (const b of this.siteCandidates) {
      if (!b.active) continue
      for (let i = 0; i < 2; i++) {
        const a = this.t * 1.4 + i * 3.14 + b.x
        const x = b.x + b.w / 2 + Math.cos(a) * (b.w / 2 + 0.5), y = b.y + b.d + 0.4 + Math.sin(a) * 0.35
        items.push({ d: x + y, z: 0, f: () => this.drawPerson(ctx, x, y, { col: this.PAL.navy, hat: true, carry: true, ph: b.x + i }) })
      }
    }
    items.sort((a, b) => (a.d - b.d) || (a.z - b.z))
    for (const it of items) it.f()
    // overlays
    for (const b of this.buildings) { if (b.central && b._top) this.drawLabel(ctx, b, b._top) }
    for (const b of this.warnCandidates) { if (b.warn && b._top) this.drawWarn(ctx, b._top) }
    ctx.restore()
  }

  loop = (ts: number) => {
    if (!this._last) this._last = ts; let dt = (ts - this._last) / 1000; this._last = ts; if (dt > 0.05) dt = 0.05; this.t += dt
    const ease = (cur: number, tgt: number) => cur + (tgt - cur) * Math.min(1, dt * 3)
    this.nComp = ease(this.nComp, this.completed / this.MAX.completed)
    // pending scales linearly with no ceiling — more pending always means more
    // citizens (very large values will tax the canvas).
    this.nPend = ease(this.nPend, this.pending / this.MAX.pending)
    this.nOver = ease(this.nOver, this.overdue / this.MAX.overdue)
    this.nNew = ease(this.nNew, this.newt / this.MAX.newt)
    this.updateSim(dt); this.render()
    this._pc = (this._pc || 0) + dt; if (this._pc > 0.4) { this._pc = 0; const n = this.walkers.length + this.gatherers.length; if (n !== this._people) { this._people = n; if (this.onPeople) this.onPeople(n) } }
    this._raf = requestAnimationFrame(this.loop)
  }

  /** Build the city, warm up the simulation, and begin the render loop. */
  start() {
    this.setup(); for (let i = 0; i < 60; i++) this.updateSim(0.05); this.render(); this._raf = requestAnimationFrame(this.loop)
    this._ro = new ResizeObserver(() => this.render()); if (this.wrap) this._ro.observe(this.wrap)
  }

  /** Stop the render loop and detach observers. */
  stop() { if (this._raf) cancelAnimationFrame(this._raf); if (this._ro) this._ro.disconnect() }
}
