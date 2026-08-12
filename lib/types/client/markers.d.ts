/** The captured range: boundary elements plus their exact flow-relative edges. */
export interface MarkerRange {
    readonly startEl: HTMLElement;
    /** Flow-relative y of the start boundary (the start marker's line). */
    readonly startEdge: number;
    readonly endEl: HTMLElement;
    /** Flow-relative y of the end boundary (the end marker's line). */
    readonly endEdge: number;
}
export declare class MarkerOverlay {
    private root;
    private scrollport;
    private flowList;
    private readonly targets;
    private readonly handles;
    private drag;
    private readonly onDetach;
    private disposed;
    private syncPending;
    private rebuildPending;
    private readonly listeners;
    private flowObserver;
    private detachObserver;
    private rect;
    private outlined;
    /** Last pointer y (viewport) for the edge auto-scroll loop. */
    private lastPointerY;
    private edgeScrollActive;
    private lastDimStartEdge;
    private lastDimEndEdge;
    private lastDimScrollTop;
    /** Per-line text Ranges + their flow-relative bounds (highlight API, no DOM mutation). */
    private dimLines;
    private ghostStart;
    private ghostEnd;
    /** Overlay mounted inside the flow content so snapped lines scroll natively. */
    private contentRoot;
    private prevFlowListPosition;
    private readonly isStreaming;
    private rebuildTimer;
    private lastRebuildAt;
    constructor(options: {
        onDetach: () => void;
        isStreaming: () => boolean;
    });
    activate(scrollport: HTMLElement, flowList: HTMLElement): void;
    dispose(): void;
    /** Resolve the current range: snapped targets, else nearest under each line. */
    currentRange(): MarkerRange | null;
    /** Dashed projection of where a free handle would snap on confirm. */
    private createGhost;
    private createHandle;
    private syncGeometry;
    /** Bottom of the interactive handle area (above the sticky composer seat). */
    private effectiveBottom;
    /** The flow content box in overlay coordinates. */
    private contentBox;
    private scheduleSync;
    /**
     * Lightweight synchronous reposition of snapped handles (lines + pills) on
     * scroll, so they track the content in the same frame instead of lagging a
     * frame behind the rAF-debounced full sync. Free handles are intentionally
     * skipped here — they stay screen-fixed and are handled by sync().
     */
    private syncSnappedHandles;
    private scheduleRebuild;
    private sync;
    /**
     * Build per-line text Ranges with flow-relative bounds for the whole flow.
     * Uses the CSS Custom Highlight API (zero DOM mutation), so snap collection —
     * which reads block segments straight off the DOM — is never disturbed.
     */
    private collectDimLines;
    /** Per-rendered-line Ranges of one text node, with flow-relative bounds. */
    private textNodeLineRanges;
    /** Character offsets where each rendered line after the first begins. */
    private lineBreakOffsets;
    /** Ensure the ::highlight(dsh-share-dim) rule exists and uses the theme gray. */
    private ensureDimStyle;
    /** Paint the outside lines gray via the Custom Highlight API (no DOM mutation). */
    private applyDim;
    /** Gray out text lines outside the selected range (line-precise, no overlay). */
    private syncDim;
    private clearDim;
    /** Project the confirm-time snap edge as a dashed ghost for free handles. */
    private syncGhosts;
    private placeGhost;
    private lineY;
    /** Content-relative y of a snapped edge, measured against the content overlay. */
    private flowOffsetOf;
    /** Move a handle's line into the content overlay and lock its flow offset. */
    private snapLine;
    /** Move a handle's line back into the fixed overlay (free-floating). */
    private unsnapLine;
    private positionHandle;
    private onPointerDown;
    private onPointerMove;
    private onPointerUp;
    /** Keyboard nudge: move a handle by `delta` and latch it when it lands on a target. */
    private nudge;
    /** Convert a flow-relative target edge to overlay-local y at the live scroll. */
    private targetToFreeY;
    /** Magnetic latch: attach near an element edge, release beyond the hysteresis distance. */
    private applyMagnet;
    /** Auto-scroll while the pointer is held in the top/bottom edge zones. */
    private ensureEdgeScroll;
    private setAttachedVisual;
    private clearOutline;
}
