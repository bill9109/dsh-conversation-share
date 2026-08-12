/**
 * Snap-target collection for the range markers.
 *
 * Targets are the natural visual boundaries of the conversation:
 *  - semantic message rows (`[data-chat-anchor-key]` flow items)
 *  - markdown block elements (p, pre, ul/ol/li, table, h1-h6, blockquote)
 *  - `div`s carrying visible content (direct text / visual box / substantial unit)
 *  - INDIVIDUAL TEXT LINES inside paragraphs/lists/code, so a marker can latch
 *    to any rendered line, not just block edges
 * Excluded: layout wrapper divs, interactive chrome, sub-pixel spacers.
 * Duplicate edges (nested elements sharing a top, e.g. a row and its first
 * block) collapse to the outermost one via position de-duplication.
 *
 * Coordinates are FLOW-RELATIVE (viewport + scrollTop at collect time), so
 * the cache stays valid while the user scrolls; the marker/capture derive
 * viewport positions with the live scrollTop.
 */
export interface SnapTarget {
    readonly el: HTMLElement;
    /** Flow-relative snap edge (the start marker sits on `top`). */
    readonly top: number;
    /** Flow-relative snap edge (the end marker sits on `bottom`). */
    readonly bottom: number;
    readonly center: number;
    /**
     * True when this target is an individual text LINE inside a block (the
     * element's own box does not match the snap edge); false for block/row
     * targets whose edges ARE the element's box edges.
     */
    readonly line: boolean;
}
export declare class SnapTargets {
    private targets;
    private flowList;
    private overlay;
    private scrollport;
    bind(flowList: HTMLElement, overlay: HTMLElement, scrollport: HTMLElement): void;
    unbind(): void;
    get count(): number;
    /**
     * Re-scan the flow for snap targets. Call on activation and on flow mutation.
     * `fast` skips the expensive per-text-line edge pass (used while the session
     * streams, where the flow mutates every token).
     */
    rebuild(fast?: boolean): void;
    /** Nearest target by vertical center distance to the given viewport y. */
    nearest(viewY: number): SnapTarget | null;
    /** Nearest target by TOP-edge distance to the given viewport y (start marker). */
    nearestTop(viewY: number): SnapTarget | null;
    /** Nearest target by BOTTOM-edge distance to the given viewport y (end marker). */
    nearestBottom(viewY: number): SnapTarget | null;
    indexOf(el: HTMLElement): number;
}
