/**
 * Range-marker overlay for the chat flow.
 *
 * Two handles mark "从这里开始" / "到这里结束". Dragging a handle follows the
 * cursor 1:1 inside the viewport; when the pointer enters the top/bottom edge
 * zone the page auto-scrolls. When the line comes near a snap target edge
 * (row/block/line) it magnetically latches onto it, and drags beyond the
 * release distance unlatch it back to the free state. Releasing while latched
 * anchors the handle to that edge (it rides the content on scroll); releasing
 * while free leaves it floating at that screen position. The two handles can
 * never cross.
 */
import { findComposerSeat } from './dom.ts'
import { chromeFontStack, gripIconSVG, themeColors } from './icons.ts'
import { SnapTargets, type SnapTarget } from './snap-targets.ts'

/** The captured range: boundary elements plus their exact flow-relative edges. */
export interface MarkerRange {
  readonly startEl: HTMLElement
  /** Flow-relative y of the start boundary (the start marker's line). */
  readonly startEdge: number
  readonly endEl: HTMLElement
  /** Flow-relative y of the end boundary (the end marker's line). */
  readonly endEdge: number
}

interface Handle {
  readonly kind: 'start' | 'end'
  state: 'free' | 'snapped'
  /** Overlay-local y when free. */
  freeY: number
  snappedTarget: SnapTarget | null
  /** Content-relative y of the snapped line (inside the scroll content overlay). */
  flowOffset: number
  readonly pill: HTMLButtonElement
  readonly line: HTMLDivElement
}

interface DragState {
  handle: Handle
  pointerId: number
  lastPointerY: number
  /** Pointer-to-line offset at grab, so the line never jumps on pointerdown. */
  grabOffsetY: number
  /** Total pointer travel since grab (gates edge auto-scroll on real drags). */
  movedDistance: number
  attached: SnapTarget | null
  moved: boolean
}

/** Magnet engages when the line is within this distance of an element edge. */
const SNAP_IN = 20
/** Magnet releases when dragged further than this from the element edge. */
const SNAP_OUT = 32
const EDGE_MARGIN = 8
const Z_INDEX = 6
/** Gap between the pill's right edge and the flow content's left edge. */
const GUTTER_GAP = 8
/** Pointer bands at the overlay top/bottom that drive page auto-scroll. */
const EDGE_ZONE = 64
/** Auto-scroll base speed (px per 60fps frame). */
const EDGE_SCROLL_BASE = 4
/** Auto-scroll speed ramp as the pointer sinks deeper into the edge zone. */
const EDGE_SCROLL_RAMP = 10
/** Minimum pointer travel before edge auto-scroll engages (click != drag). */
const MIN_DRAG_FOR_EDGE_SCROLL = 8
/** Highlight-registry name and style id for the text dim (CSS Custom Highlight API). */
const DIM_HIGHLIGHT_NAME = 'dsh-share-dim'
const DIM_STYLE_ID = 'dsh-share-dim-style'
/** Arrow-key nudge step, overlay px. */
const NUDGE_PX = 8
/** Minimum interval between snap-target rebuilds while the session streams. */
const STREAM_REBUILD_MIN_MS = 1000

/** Minimal surface of the browser's `Highlight` class (avoids lib.dom coupling). */
interface DimHighlight { add(...ranges: Range[]): void }

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

export class MarkerOverlay {
  private root: HTMLDivElement | null = null
  private scrollport: HTMLElement | null = null
  private flowList: HTMLElement | null = null
  private readonly targets = new SnapTargets()
  private readonly handles: Handle[] = []
  private drag: DragState | null = null
  private readonly onDetach: () => void
  private disposed = false
  private syncPending = false
  private rebuildPending = false
  private readonly listeners: Array<() => void> = []
  private flowObserver: MutationObserver | null = null
  private detachObserver: MutationObserver | null = null
  private rect = { left: 0, top: 0, width: 0, height: 0 }
  private outlined: { el: HTMLElement; boxShadow: string; borderRadius: string } | null = null
  /** Last pointer y (viewport) for the edge auto-scroll loop. */
  private lastPointerY = 0
  private edgeScrollActive = false
  private lastDimStartEdge = -1
  private lastDimEndEdge = -1
  private lastDimScrollTop = -1
  /** Per-line text Ranges + their flow-relative bounds (highlight API, no DOM mutation). */
  private dimLines: Array<{ range: Range; top: number; bottom: number }> = []
  private ghostStart: HTMLDivElement | null = null
  private ghostEnd: HTMLDivElement | null = null
  /** Overlay mounted inside the flow content so snapped lines scroll natively. */
  private contentRoot: HTMLDivElement | null = null
  private prevFlowListPosition = ''
  private readonly isStreaming: () => boolean
  private rebuildTimer: number | null = null
  private lastRebuildAt = 0

  constructor(options: { onDetach: () => void; isStreaming: () => boolean }) {
    this.onDetach = options.onDetach
    this.isStreaming = options.isStreaming
  }

  activate(scrollport: HTMLElement, flowList: HTMLElement): void {
    if (this.disposed) return
    this.scrollport = scrollport
    this.flowList = flowList
    const vars = themeColors()

    const root = document.createElement('div')
    root.style.cssText = [
      'position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;',
      'pointer-events:none;z-index:' + Z_INDEX + ';',
    ].join('')
    this.root = root
    this.targets.bind(flowList, root, scrollport)

    // A content overlay inside the flow list: snapped handle lines live here at
    // flow coordinates so they scroll with the content in the compositor (no
    // main-thread lag during inertial scrolling). The flow list is temporarily
    // made the containing block; restored on dispose.
    this.prevFlowListPosition = flowList.style.position
    flowList.style.position = 'relative'
    this.contentRoot = document.createElement('div')
    this.contentRoot.style.cssText = [
      'position:absolute;left:0;top:0;width:0;height:0;overflow:visible;',
      'pointer-events:none;z-index:' + Z_INDEX + ';',
    ].join('')
    flowList.append(this.contentRoot)

    // Ghost projections paint behind the handle lines/pills.
    this.ghostStart = this.createGhost(root)
    this.ghostEnd = this.createGhost(root)

    const start = this.createHandle(root, 'start', vars.businessPrimary, vars.borderL2, vars.bgRaise, vars.labelSecondary)
    const end = this.createHandle(root, 'end', vars.businessPrimary, vars.borderL2, vars.bgRaise, vars.labelSecondary)
    this.handles.push(start, end)

    document.body.append(root)

    this.syncGeometry()
    const bottom = this.effectiveBottom()
    start.freeY = EDGE_MARGIN
    end.freeY = Math.max(EDGE_MARGIN, bottom - EDGE_MARGIN)
    this.targets.rebuild()
    this.ensureDimStyle()
    this.collectDimLines()

    // Reposition snapped handles synchronously in the scroll handler (before
    // the next paint) so they don't lag behind compositor-driven scrolling;
    // the rAF sync below still runs the heavier dim/ghost/free-handle pass.
    const onScroll = (): void => {
      this.syncSnappedHandles()
      this.scheduleSync()
    }
    const onResize = (): void => this.scheduleSync()
    scrollport.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    this.listeners.push(() => {
      scrollport.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    })

    // Escape cancels share mode; ArrowUp/Down nudge the focused handle.
    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        this.dispose()
        this.onDetach()
        return
      }
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
      const active = document.activeElement
      let handle: Handle | null = null
      const startH = this.handles[0]
      const endH = this.handles[1]
      if (active === startH?.pill) handle = startH
      else if (active === endH?.pill) handle = endH
      if (handle === null) return
      event.preventDefault()
      this.nudge(handle, event.key === 'ArrowUp' ? -NUDGE_PX : NUDGE_PX)
    }
    window.addEventListener('keydown', onKeydown)
    this.listeners.push(() => window.removeEventListener('keydown', onKeydown))

    // Rebuild targets when the flow mutates (new messages, disclosure toggles).
    const flowObserver = new MutationObserver(() => this.scheduleRebuild())
    this.flowObserver = flowObserver
    flowObserver.observe(flowList, { childList: true, subtree: true })
    // The view ring swaps subtrees when the user leaves the chat view;
    // watch the scrollport for that so share mode exits cleanly.
    const detachObserver = new MutationObserver(() => this.scheduleSync())
    this.detachObserver = detachObserver
    detachObserver.observe(scrollport, { childList: true, subtree: true })

    this.sync()
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.flowObserver?.disconnect()
    this.detachObserver?.disconnect()
    for (const off of this.listeners) off()
    this.listeners.length = 0
    this.clearOutline()
    this.clearDim()
    this.edgeScrollActive = false
    if (this.rebuildTimer !== null) {
      window.clearTimeout(this.rebuildTimer)
      this.rebuildTimer = null
    }
    // Remove the content overlay and restore the flow list's original position.
    this.contentRoot?.remove()
    this.contentRoot = null
    if (this.flowList !== null) this.flowList.style.position = this.prevFlowListPosition
    this.root?.remove()
    this.root = null
    this.ghostStart = null
    this.ghostEnd = null
    this.scrollport = null
    this.flowList = null
    this.handles.length = 0
    this.drag = null
    this.targets.unbind()
  }

  /** Resolve the current range: snapped targets, else nearest under each line. */
  currentRange(): MarkerRange | null {
    const [start, end] = this.handles
    if (start === undefined || end === undefined) return null
    let s = start.state === 'snapped' ? start.snappedTarget : null
    let e = end.state === 'snapped' ? end.snappedTarget : null
    if (s === null) s = this.targets.nearestTop(this.rect.top + this.lineY(start))
    if (e === null) e = this.targets.nearestBottom(this.rect.top + this.lineY(end))
    if (s === null || e === null) return null
    // Range boundaries: the start marker sits on a target TOP, the end marker
    // on a target BOTTOM. Derive both edges from both targets (they may be the
    // same element when the range lies inside one paragraph).
    const startEdge = Math.min(s.top, e.top)
    const endEdge = Math.max(s.bottom, e.bottom)
    // `s` is the earlier target (top <=), so it owns the start element; the
    // later one owns the end element. Both orderings of the handles resolve
    // here (the two markers can never cross, but snap fallbacks may reorder).
    const startEl = s.top <= e.top ? s.el : e.el
    const endEl = s.top <= e.top ? e.el : s.el
    return { startEl, startEdge, endEl, endEdge }
  }

  /** Dashed projection of where a free handle would snap on confirm. */
  private createGhost(root: HTMLDivElement): HTMLDivElement {
    const el = document.createElement('div')
    el.style.cssText = [
      'position:absolute;left:0;top:0;height:0;width:100%;display:none;',
      'border-top:1px dashed var(--dsw-alias-state-business-primary, #3964fe);',
      'opacity:.45;pointer-events:none;',
    ].join('')
    root.append(el)
    return el
  }

  private createHandle(
    root: HTMLDivElement,
    kind: 'start' | 'end',
    primary: string,
    border: string,
    bgRaise: string,
    label: string,
  ): Handle {
    const line = document.createElement('div')
    line.style.cssText = [
      'position:absolute;height:2px;border-radius:1px;pointer-events:none;',
      'background:var(--dsw-alias-state-business-primary, ' + primary + ');',
    ].join('')

    const pill = document.createElement('button')
    pill.type = 'button'
    pill.style.cssText = [
      'position:absolute;display:flex;flex-direction:row;align-items:center;gap:5px;',
      'padding:3px 8px;box-sizing:border-box;white-space:nowrap;',
      'border-radius:999px;border:1px solid var(--dsw-alias-border-l2, ' + border + ');',
      'background:var(--dsw-alias-bg-layer-2, ' + bgRaise + ');',
      'color:var(--dsw-alias-label-secondary, ' + label + ');',
      'cursor:grab;touch-action:none;user-select:none;',
      'pointer-events:auto;transition:transform 90ms ease;',
    ].join('')
    const grip = document.createElement('span')
    grip.style.cssText = 'display:inline-flex;opacity:.65;'
    grip.innerHTML = gripIconSVG()
    const labelSpan = document.createElement('span')
    labelSpan.style.cssText = 'font:500 12px/16px ' + chromeFontStack + ';'
    labelSpan.textContent = kind === 'start' ? '从这里开始' : '到这里结束'
    pill.append(grip, labelSpan)
    root.append(line, pill)

    const handle: Handle = {
      kind, state: 'free', freeY: 0, snappedTarget: null, flowOffset: 0, pill, line,
    }
    pill.addEventListener('pointerdown', (event) => this.onPointerDown(event, handle))
    pill.addEventListener('pointermove', (event) => this.onPointerMove(event))
    pill.addEventListener('pointerup', (event) => this.onPointerUp(event))
    pill.addEventListener('pointercancel', (event) => this.onPointerUp(event))
    return handle
  }

  // ---- geometry ---------------------------------------------------------

  private syncGeometry(): void {
    const scrollport = this.scrollport
    const root = this.root
    if (scrollport === null || root === null) return
    const rect = scrollport.getBoundingClientRect()
    this.rect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
    root.style.left = `${rect.left}px`
    root.style.top = `${rect.top}px`
    root.style.width = `${rect.width}px`
    root.style.height = `${rect.height}px`
  }

  /** Bottom of the interactive handle area (above the sticky composer seat). */
  private effectiveBottom(): number {
    const scrollport = this.scrollport
    if (scrollport === null) return this.rect.height
    const seat = findComposerSeat(scrollport)
    if (seat === null) return this.rect.height
    const seatRect = seat.getBoundingClientRect()
    return clamp(seatRect.top - this.rect.top, 0, this.rect.height)
  }

  /** The flow content box in overlay coordinates. */
  private contentBox(): { left: number; width: number } {
    const flowList = this.flowList
    if (flowList === null) return { left: 12, width: Math.max(0, this.rect.width - 24) }
    const rect = flowList.getBoundingClientRect()
    return { left: rect.left - this.rect.left, width: rect.width }
  }

  private scheduleSync(): void {
    if (this.syncPending) return
    this.syncPending = true
    requestAnimationFrame(() => {
      this.syncPending = false
      if (!this.disposed) this.sync()
    })
  }

  /**
   * Lightweight synchronous reposition of snapped handles (lines + pills) on
   * scroll, so they track the content in the same frame instead of lagging a
   * frame behind the rAF-debounced full sync. Free handles are intentionally
   * skipped here — they stay screen-fixed and are handled by sync().
   */
  private syncSnappedHandles(): void {
    if (this.disposed || this.root === null || this.scrollport === null) return
    if (!this.handles.some(handle => handle.state === 'snapped')) return
    const rect = this.scrollport.getBoundingClientRect()
    this.rect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
    const box = this.contentBox()
    const bottom = this.effectiveBottom()
    for (const handle of this.handles) {
      if (handle.state !== 'snapped') continue
      this.positionHandle(handle, this.lineY(handle), box, bottom)
    }
  }

  private scheduleRebuild(): void {
    if (this.rebuildPending) return
    this.rebuildPending = true
    requestAnimationFrame(() => {
      this.rebuildPending = false
      if (this.disposed) return
      const streaming = this.isStreaming()
      const since = Date.now() - this.lastRebuildAt
      const min = streaming ? STREAM_REBUILD_MIN_MS : 0
      if (since < min) {
        // Throttle while streaming (the flow mutates per token); defer to the
        // end of the window so the final state still gets a full rebuild.
        if (this.rebuildTimer === null) {
          this.rebuildTimer = window.setTimeout(() => {
            this.rebuildTimer = null
            this.scheduleRebuild()
          }, min - since)
        }
        return
      }
      this.lastRebuildAt = Date.now()
      // Flow changed: rebuild snap targets, then rebuild the dim ranges. The
      // Custom Highlight API never mutates the DOM, so the snap collector and
      // the dim ranges read the same structure without stepping on each other.
      this.clearDim()
      this.targets.rebuild(streaming)
      this.collectDimLines()
      this.sync()
    })
  }

  private sync(): void {
    if (this.disposed || this.root === null || this.scrollport === null) return
    const flowList = this.flowList
    if (flowList !== null && !flowList.isConnected) {
      this.dispose()
      this.onDetach()
      return
    }
    // Re-mount the content overlay if a flow re-render dropped it, and re-lock
    // any snapped lines' flow offsets (the layout may have shifted).
    if (this.contentRoot !== null && !this.contentRoot.isConnected && flowList !== null) {
      flowList.append(this.contentRoot)
      for (const handle of this.handles) {
        if (handle.state === 'snapped') this.snapLine(handle)
      }
    }
    this.syncGeometry()
    const bottom = this.effectiveBottom()
    const box = this.contentBox()
    const [start, end] = this.handles
    if (start === undefined || end === undefined) return

    // Order constraint for free handles (snapped positions are element-driven).
    const endY = this.lineY(end)
    if (start.state === 'free') start.freeY = clamp(start.freeY, 0, Math.max(0, endY))
    const startY = this.lineY(start)
    if (end.state === 'free') end.freeY = clamp(end.freeY, Math.max(0, startY), bottom)

    const sy = this.lineY(start)
    const ey = this.lineY(end)
    this.positionHandle(start, sy, box, bottom)
    this.positionHandle(end, ey, box, bottom)
    this.syncDim()
    this.syncGhosts(start, end, box)
  }

  /**
   * Build per-line text Ranges with flow-relative bounds for the whole flow.
   * Uses the CSS Custom Highlight API (zero DOM mutation), so snap collection —
   * which reads block segments straight off the DOM — is never disturbed.
   */
  private collectDimLines(): void {
    const flowList = this.flowList
    if (flowList === null) return
    this.dimLines = []
    const scrollTop = this.scrollport?.scrollTop ?? 0
    const walker = document.createTreeWalker(flowList, NodeFilter.SHOW_TEXT)
    let node: Node | null = walker.nextNode()
    while (node !== null) {
      if (node instanceof Text && (node.textContent ?? '').trim().length > 0) {
        this.dimLines.push(...this.textNodeLineRanges(node, scrollTop))
      }
      node = walker.nextNode()
    }
  }

  /** Per-rendered-line Ranges of one text node, with flow-relative bounds. */
  private textNodeLineRanges(node: Text, scrollTop: number): Array<{ range: Range; top: number; bottom: number }> {
    const text = node.textContent ?? ''
    const probe = document.createRange()
    probe.selectNodeContents(node)
    const rects = Array.from(probe.getClientRects())
    if (rects.length === 0) return []

    if (rects.length === 1) {
      const lineRange = document.createRange()
      lineRange.setStart(node, 0)
      lineRange.setEnd(node, text.length)
      const rect = rects[0]
      return [{ range: lineRange, top: rect.top + scrollTop, bottom: rect.bottom + scrollTop }]
    }

    const bounds = this.lineBreakOffsets(node, text, rects)
    const result: Array<{ range: Range; top: number; bottom: number }> = []
    let prev = 0
    for (let i = 0; i <= bounds.length; i++) {
      const end = i < bounds.length ? bounds[i] : text.length
      if (end <= prev) continue
      const lineRange = document.createRange()
      lineRange.setStart(node, prev)
      lineRange.setEnd(node, end)
      const rect = rects[i]
      if (rect !== undefined) result.push({ range: lineRange, top: rect.top + scrollTop, bottom: rect.bottom + scrollTop })
      prev = end
    }
    return result
  }

  /** Character offsets where each rendered line after the first begins. */
  private lineBreakOffsets(node: Text, text: string, rects: readonly DOMRect[]): number[] {
    const probe = document.createRange()
    const bounds: number[] = []
    for (let i = 1; i < rects.length; i++) {
      const targetTop = rects[i].top
      let lo = 0
      let hi = text.length
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        // Test which line the character at `mid` actually renders on. The old
        // prefix-range bottom test was off by one at trailing spaces, pulling
        // the next line's first character into the previous line's range.
        probe.setStart(node, mid)
        probe.setEnd(node, mid + 1)
        const top = probe.getBoundingClientRect().top
        if (top < targetTop - 0.5) lo = mid + 1
        else hi = mid
      }
      bounds.push(lo)
    }
    return bounds
  }

  /** Ensure the ::highlight(dsh-share-dim) rule exists and uses the theme gray. */
  private ensureDimStyle(): void {
    let style = document.getElementById(DIM_STYLE_ID) as HTMLStyleElement | null
    if (style === null) {
      style = document.createElement('style')
      style.id = DIM_STYLE_ID
      document.head.append(style)
    }
    style.textContent = `::highlight(${DIM_HIGHLIGHT_NAME}) { color: ${themeColors().labelTertiary}; }`
  }

  /** Paint the outside lines gray via the Custom Highlight API (no DOM mutation). */
  private applyDim(startEdge: number, endEdge: number): void {
    const registry = (CSS as unknown as { highlights?: { set: (n: string, h: DimHighlight) => void } }).highlights
    const HighlightCtor = (window as unknown as { Highlight?: new () => DimHighlight }).Highlight
    if (registry === undefined || HighlightCtor === undefined) return
    const highlight = new HighlightCtor()
    for (const line of this.dimLines) {
      if (line.bottom <= startEdge || line.top >= endEdge) highlight.add(line.range)
    }
    registry.set(DIM_HIGHLIGHT_NAME, highlight)
  }

  /** Gray out text lines outside the selected range (line-precise, no overlay). */
  private syncDim(): void {
    const range = this.currentRange()
    if (range === null) {
      this.clearDim()
      return
    }
    const scrollTop = this.scrollport?.scrollTop ?? 0
    if (range.startEdge === this.lastDimStartEdge && range.endEdge === this.lastDimEndEdge && scrollTop === this.lastDimScrollTop) return
    this.lastDimStartEdge = range.startEdge
    this.lastDimEndEdge = range.endEdge
    this.lastDimScrollTop = scrollTop
    this.applyDim(range.startEdge, range.endEdge)
  }

  private clearDim(): void {
    const registry = (CSS as unknown as { highlights?: { delete: (n: string) => void } }).highlights
    registry?.delete(DIM_HIGHLIGHT_NAME)
    this.lastDimStartEdge = -1
    this.lastDimEndEdge = -1
    this.lastDimScrollTop = -1
  }

  /** Project the confirm-time snap edge as a dashed ghost for free handles. */
  private syncGhosts(start: Handle, end: Handle, box: { left: number; width: number }): void {
    const scrollTop = this.scrollport?.scrollTop ?? 0
    this.placeGhost(this.ghostStart, start, box, scrollTop)
    this.placeGhost(this.ghostEnd, end, box, scrollTop)
  }

  private placeGhost(
    ghost: HTMLDivElement | null,
    handle: Handle,
    box: { left: number; width: number },
    scrollTop: number,
  ): void {
    if (ghost === null) return
    if (handle.state === 'snapped') {
      ghost.style.display = 'none'
      return
    }
    const viewY = this.rect.top + this.lineY(handle)
    const target = handle.kind === 'end'
      ? this.targets.nearestBottom(viewY)
      : this.targets.nearestTop(viewY)
    if (target === null) {
      ghost.style.display = 'none'
      return
    }
    const edge = handle.kind === 'end' ? target.bottom : target.top
    const y = Math.round(edge - scrollTop - this.rect.top)
    ghost.style.display = 'block'
    ghost.style.left = `${box.left}px`
    ghost.style.width = `${box.width}px`
    ghost.style.top = `${y}px`
  }

  private lineY(handle: Handle): number {
    if (handle.state === 'snapped' && handle.snappedTarget !== null) {
      const target = handle.snappedTarget
      if (target.line) {
        // Line-level snap: the element's box does not match the snap edge, so
        // ride the stored flow-relative line. Keep sub-pixel precision so the
        // line tracks the text exactly instead of stepping by whole pixels.
        const edge = handle.kind === 'end' ? target.bottom : target.top
        return edge - (this.scrollport?.scrollTop ?? 0) - this.rect.top
      }
      // Block/row snap: anchor to the element's LIVE box so the line rides the
      // real page element exactly (no drift, no wobble while scrolling).
      const rect = target.el.getBoundingClientRect()
      const edge = handle.kind === 'end' ? rect.bottom : rect.top
      return edge - this.rect.top
    }
    return handle.freeY
  }

  /** Content-relative y of a snapped edge, measured against the content overlay. */
  private flowOffsetOf(handle: Handle): number {
    const target = handle.snappedTarget
    const contentRoot = this.contentRoot
    if (target === null || contentRoot === null) return 0
    const rootTop = contentRoot.getBoundingClientRect().top
    if (target.line) {
      const edge = handle.kind === 'end' ? target.bottom : target.top
      const scrollTop = this.scrollport?.scrollTop ?? 0
      return edge - (rootTop + scrollTop)
    }
    const rect = target.el.getBoundingClientRect()
    const edge = handle.kind === 'end' ? rect.bottom : rect.top
    return edge - rootTop
  }

  /** Move a handle's line into the content overlay and lock its flow offset. */
  private snapLine(handle: Handle): void {
    if (this.contentRoot === null) return
    handle.flowOffset = this.flowOffsetOf(handle)
    this.contentRoot.append(handle.line)
  }

  /** Move a handle's line back into the fixed overlay (free-floating). */
  private unsnapLine(handle: Handle): void {
    if (this.root === null) return
    this.root.append(handle.line)
  }

  private positionHandle(handle: Handle, y: number, box: { left: number; width: number }, bottom: number): void {
    const ry = y
    if (handle.state === 'snapped') {
      // Snapped line lives in the content overlay at a fixed flow offset; the
      // compositor scrolls it with the text, so no per-frame reposition.
      handle.line.style.left = '0px'
      handle.line.style.width = `${box.width}px`
      handle.line.style.top = `${handle.flowOffset}px`
    } else {
      handle.line.style.left = `${box.left}px`
      handle.line.style.top = `${ry}px`
      handle.line.style.width = `${box.width}px`
    }
    // Horizontal pill in the left gutter, clear of the conversation content.
    const pillWidth = handle.pill.offsetWidth || 86
    const pillHeight = handle.pill.offsetHeight || 24
    const gutterX = box.left - pillWidth - GUTTER_GAP
    handle.pill.style.left = `${Math.max(4, gutterX)}px`
    // Shape the handles so they never overlap: the start pill's BOTTOM edge
    // sits on its line (hangs above), the end pill's TOP edge sits on its line
    // (hangs below). When the two lines meet, the pills occupy opposite sides.
    // Clamp to the composer top (`bottom`) so a low end handle never slides
    // under the sticky composer where it would become unclickable.
    const maxTop = Math.max(4, bottom - pillHeight)
    const pillTop = handle.kind === 'start' ? ry - pillHeight : ry
    handle.pill.style.top = `${clamp(pillTop, 4, maxTop)}px`
  }

  // ---- dragging ---------------------------------------------------------

  private onPointerDown(event: PointerEvent, handle: Handle): void {
    if (this.disposed) return
    event.preventDefault()
    // Focus the handle so ArrowUp/Down nudging works right after a click
    // (preventDefault above would otherwise suppress the default focus).
    handle.pill.focus({ preventScroll: true })
    try {
      handle.pill.setPointerCapture(event.pointerId)
    } catch {
      // Capture can throw for synthetic pointers; dragging still works via
      // document-level move tracking below.
    }
    this.edgeScrollActive = false
    this.lastPointerY = event.clientY
    // Any drag starts in the free-follow regime (a snapped handle detaches
    // on the first move); keep the line position for continuity.
    this.drag = {
      handle,
      pointerId: event.pointerId,
      lastPointerY: event.clientY,
      grabOffsetY: this.lineY(handle) - (event.clientY - this.rect.top),
      movedDistance: 0,
      attached: null,
      moved: false,
    }
    this.sync()
  }

  private onPointerMove(event: PointerEvent): void {
    const drag = this.drag
    if (drag === null || event.pointerId !== drag.pointerId) return
    const dy = event.clientY - drag.lastPointerY
    if (Math.abs(dy) > 0.5) drag.moved = true
    drag.movedDistance += Math.abs(dy)
    drag.lastPointerY = event.clientY
    this.lastPointerY = event.clientY
    const handle = drag.handle
    const bottom = this.effectiveBottom()

    if (handle.state === 'snapped') {
      // Detach from the target as soon as the user starts dragging it.
      handle.state = 'free'
      handle.snappedTarget = null
      handle.freeY = this.lineY(handle)
      this.unsnapLine(handle)
      this.clearOutline()
    }

    // The line follows the pointer 1:1 (grab offset preserved). The page
    // scrolls ONLY while the pointer sits in the top/bottom edge zones —
    // handled by the edge auto-scroll loop — never on ordinary movement.
    // The zones are relative to the overlay's visible height (the pointer can
    // travel over the composer seat); the handle pins at `bottom`.
    const pointerY = event.clientY - this.rect.top
    const inTopZone = pointerY <= EDGE_ZONE
    const inBottomZone = pointerY >= this.rect.height - EDGE_ZONE
    if (inTopZone) {
      handle.freeY = 0
    } else if (inBottomZone) {
      handle.freeY = bottom
    } else {
      handle.freeY = clamp(pointerY - drag.grabOffsetY, 0, bottom)
    }

    // The magnet stays active even in the edge zones: while auto-scrolling at
    // the edge, the pinned line catches elements as they pass under it, so the
    // range can extend to content below the composer or above the viewport.
    this.applyMagnet(drag)
    this.sync()
    this.ensureEdgeScroll()
  }

  private onPointerUp(event: PointerEvent): void {
    const drag = this.drag
    if (drag === null || event.pointerId !== drag.pointerId) return
    this.edgeScrollActive = false
    const handle = drag.handle
    if (drag.attached !== null) {
      handle.state = 'snapped'
      handle.snappedTarget = drag.attached
      handle.freeY = this.targetToFreeY(handle, drag.attached)
      this.snapLine(handle)
    } else {
      handle.state = 'free'
      handle.snappedTarget = null
      this.unsnapLine(handle)
    }
    this.drag = null
    this.setAttachedVisual(null)
    this.sync()
  }

  /** Keyboard nudge: move a handle by `delta` and latch it when it lands on a target. */
  private nudge(handle: Handle, delta: number): void {
    if (this.disposed) return
    if (handle.state === 'snapped') {
      // Capture the current (snapped) viewport y before detaching so the line
      // does not jump back to its pre-snap free position.
      const currentY = this.lineY(handle)
      handle.state = 'free'
      handle.snappedTarget = null
      handle.freeY = currentY
      this.unsnapLine(handle)
      this.clearOutline()
    }
    const bottom = this.effectiveBottom()
    handle.freeY = clamp(handle.freeY + delta, 0, bottom)
    const viewY = this.rect.top + handle.freeY
    const target = handle.kind === 'end'
      ? this.targets.nearestBottom(viewY)
      : this.targets.nearestTop(viewY)
    if (target !== null) {
      const scrollTop = this.scrollport?.scrollTop ?? 0
      const edge = handle.kind === 'end' ? target.bottom : target.top
      if (Math.abs(edge - (viewY + scrollTop)) <= SNAP_IN) {
        handle.state = 'snapped'
        handle.snappedTarget = target
        handle.freeY = this.targetToFreeY(handle, target)
        this.snapLine(handle)
      }
    }
    this.sync()
  }

  /** Convert a flow-relative target edge to overlay-local y at the live scroll. */
  private targetToFreeY(handle: Handle, target: SnapTarget): number {
    const scrollTop = this.scrollport?.scrollTop ?? 0
    const edge = handle.kind === 'end' ? target.bottom : target.top
    return edge - scrollTop - this.rect.top
  }

  /** Magnetic latch: attach near an element edge, release beyond the hysteresis distance. */
  private applyMagnet(drag: DragState): void {
    const handle = drag.handle
    const viewY = this.rect.top + handle.freeY
    // The start marker catches element TOP edges (nearest by top-edge
    // distance); the end marker BOTTOM edges.
    const target = handle.kind === 'end'
      ? this.targets.nearestBottom(viewY)
      : this.targets.nearestTop(viewY)
    if (target === null) {
      if (drag.attached !== null) this.setAttachedVisual(null)
      drag.attached = null
      return
    }
    const scrollTop = this.scrollport?.scrollTop ?? 0
    const lineFlowY = viewY + scrollTop
    const targetEdgeFlow = handle.kind === 'end' ? target.bottom : target.top
    const distance = Math.abs(targetEdgeFlow - lineFlowY)
    const current = drag.attached
    if (current !== null && current.el === target.el) {
      // Stay latched to this element (possibly a different LINE of the same
      // block): re-target so the release keeps the exact snapped edge, and
      // ride the target's edge. Clamp so an element scrolled past the edge
      // never pushes the line off-canvas.
      drag.attached = target
      handle.freeY = this.targetToFreeY(handle, target)
      return
    }
    if (distance <= SNAP_IN) {
      // Engage (or switch to) the nearest element — a closer edge re-targets
      // the latch instead of freezing it on the previous element.
      const latchY = this.targetToFreeY(handle, target)
      // Only latch when the line can actually sit on the target inside the
      // draggable band; latching out-of-band causes edge jitter.
      if (latchY < 0 || latchY > this.effectiveBottom()) {
        if (current !== null) {
          drag.attached = null
          this.setAttachedVisual(null)
        }
        return
      }
      drag.attached = target
      handle.freeY = latchY
      this.setAttachedVisual(target.el)
    } else if (current !== null && distance > SNAP_OUT) {
      drag.attached = null
      this.setAttachedVisual(null)
    }
  }

  /** Auto-scroll while the pointer is held in the top/bottom edge zones. */
  private ensureEdgeScroll(): void {
    if (this.edgeScrollActive) return
    this.edgeScrollActive = true
    let last = performance.now()
    const step = (now: number): void => {
      if (!this.edgeScrollActive || this.drag === null || this.scrollport === null || this.disposed) {
        this.edgeScrollActive = false
        return
      }
      // Frame-rate-independent speed: dt is ~1 at 60fps (ProMotion displays
      // run the rAF loop at 120Hz, which would otherwise double the speed).
      const dt = Math.min(2, (now - last) / 16.667)
      last = now
      const height = this.rect.height
      const y = this.lastPointerY - this.rect.top
      let speed = 0
      // A parked handle clicked without a real drag must NOT auto-scroll:
      // require meaningful pointer travel first.
      if (this.drag.movedDistance >= MIN_DRAG_FOR_EDGE_SCROLL) {
        if (y <= EDGE_ZONE) {
          // Penetration clamped to [0,1]: the pointer may travel past the zone
          // (into the composer area), which must NOT ramp the speed unboundedly.
          const penetration = clamp((EDGE_ZONE - y) / EDGE_ZONE, 0, 1)
          speed = -(EDGE_SCROLL_BASE + penetration * EDGE_SCROLL_RAMP)
        } else if (y >= height - EDGE_ZONE) {
          const penetration = clamp((y - (height - EDGE_ZONE)) / EDGE_ZONE, 0, 1)
          speed = EDGE_SCROLL_BASE + penetration * EDGE_SCROLL_RAMP
        }
      }
      if (speed !== 0) {
        const maxScroll = this.scrollport.scrollHeight - this.scrollport.clientHeight
        if (maxScroll > 0) {
          this.scrollport.scrollTop = clamp(this.scrollport.scrollTop + speed * dt, 0, maxScroll)
          this.sync()
        }
      }
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  private setAttachedVisual(el: HTMLElement | null): void {
    const drag = this.drag
    if (drag !== null) {
      const primary = themeColors().businessPrimary
      drag.handle.pill.style.transform = el === null ? '' : 'scale(1.04)'
      drag.handle.pill.style.borderColor = el === null ? '' : `var(--dsw-alias-state-business-primary, ${primary})`
    }
    this.clearOutline()
    if (el !== null) {
      const primary = themeColors().businessPrimary
      // Flat-design latch hint: a translucent blue rounded fill. The inset
      // shadow follows the element's own border-radius, so only elements with
      // square corners get a temporary 8px radius; every other element keeps
      // its real corner shape. Save the live inline values to restore them
      // exactly (never blank an element's own styling).
      const computedRadius = getComputedStyle(el).borderRadius
      const radius = computedRadius === '0px' ? '8px' : computedRadius
      this.outlined = {
        el,
        boxShadow: el.style.boxShadow,
        borderRadius: el.style.borderRadius,
      }
      el.style.boxShadow = `inset 0 0 0 999px color-mix(in srgb, var(--dsw-alias-state-business-primary, ${primary}) 9%, transparent)`
      el.style.borderRadius = radius
    }
  }

  private clearOutline(): void {
    if (this.outlined !== null) {
      this.outlined.el.style.boxShadow = this.outlined.boxShadow
      this.outlined.el.style.borderRadius = this.outlined.borderRadius
      this.outlined = null
    }
  }
}
