const MIN_TARGET_HEIGHT = 4;
const MAX_TARGETS = 8000;
/** Markdown block tags that are always snap candidates. */
const BLOCK_TAGS = new Set([
    'P', 'PRE', 'UL', 'OL', 'LI', 'TABLE', 'BLOCKQUOTE',
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
]);
/** Child tags that mark an element as a layout wrapper rather than a leaf. */
const WRAPPER_CHILD_TAGS = new Set([
    'DIV', 'P', 'PRE', 'UL', 'OL', 'TABLE', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
]);
const INTERACTIVE_SELECTOR = 'button, a, [role="button"], input, textarea, select, [contenteditable="true"]';
/** Tags whose text lines become fine-grained snap targets. */
const LINE_BLOCK_TAGS = new Set(['P', 'LI', 'PRE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
function hasDirectText(el) {
    for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent !== null && node.textContent.trim().length > 0) {
            return true;
        }
    }
    return false;
}
function insideInteractive(el) {
    return el.closest(INTERACTIVE_SELECTOR) !== null;
}
function hasVisualBox(el) {
    const style = getComputedStyle(el);
    if (style.backgroundImage !== 'none')
        return true;
    if (style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent')
        return true;
    if (style.borderTopWidth !== '0px' && style.borderTopStyle !== 'none')
        return true;
    if (parseFloat(style.paddingTop || '0') > 4)
        return true;
    return false;
}
function hasBlockChildren(el) {
    for (const child of el.children) {
        if (WRAPPER_CHILD_TAGS.has(child.tagName))
            return true;
    }
    return false;
}
function isSnapTarget(el) {
    if (el.getAttribute('data-dsh-share-skip') !== null)
        return false;
    // Hidden measurement/probe UI must never be snap targets.
    if (el.closest('[aria-hidden="true"]') !== null)
        return false;
    if (el.getBoundingClientRect().height < MIN_TARGET_HEIGHT)
        return false;
    const selfInteractive = el.tagName === 'BUTTON' || el.tagName === 'A';
    if (!selfInteractive && insideInteractive(el))
        return false;
    if (el.hasAttribute('data-chat-anchor-key'))
        return true;
    if (BLOCK_TAGS.has(el.tagName))
        return true;
    if (el.tagName === 'DIV') {
        if (hasDirectText(el))
            return true;
        const visual = hasVisualBox(el);
        if (visual && !hasBlockChildren(el))
            return true;
        if (visual && el.getBoundingClientRect().height >= 32)
            return true;
    }
    // Content-level controls (produced-file chips, text buttons) are snap-worthy
    // boundaries; icon-only chrome stays excluded by the direct-text rule.
    if (selfInteractive && hasDirectText(el) && el.getBoundingClientRect().height >= 18) {
        return true;
    }
    return false;
}
/** Distinct rendered line edges inside a text block (flow-relative). */
function lineEdges(block, scrollTop) {
    const edges = [];
    const seen = new Set();
    const range = document.createRange();
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node !== null) {
        const text = node.textContent ?? '';
        if (text.trim().length > 0) {
            try {
                range.setStart(node, 0);
                range.setEnd(node, text.length);
                for (const rect of range.getClientRects()) {
                    const key = Math.round(rect.top + scrollTop);
                    if (seen.has(key))
                        continue;
                    seen.add(key);
                    edges.push({ top: rect.top + scrollTop, bottom: rect.top + rect.height + scrollTop });
                }
            }
            catch {
                // Ignore range errors on edge-case nodes.
            }
        }
        node = walker.nextNode();
    }
    return edges;
}
export class SnapTargets {
    targets = [];
    flowList = null;
    overlay = null;
    scrollport = null;
    bind(flowList, overlay, scrollport) {
        this.flowList = flowList;
        this.overlay = overlay;
        this.scrollport = scrollport;
    }
    unbind() {
        this.flowList = null;
        this.overlay = null;
        this.scrollport = null;
        this.targets = [];
    }
    get count() {
        return this.targets.length;
    }
    /**
     * Re-scan the flow for snap targets. Call on activation and on flow mutation.
     * `fast` skips the expensive per-text-line edge pass (used while the session
     * streams, where the flow mutates every token).
     */
    rebuild(fast = false) {
        const list = this.flowList;
        if (list === null)
            return;
        const overlay = this.overlay;
        const scrollTop = this.scrollport?.scrollTop ?? 0;
        const found = [];
        const seenTops = new Set();
        const push = (el, top, bottom, line = false) => {
            if (found.length >= MAX_TARGETS)
                return;
            const key = Math.round(top);
            if (seenTops.has(key))
                return;
            seenTops.add(key);
            found.push({ el, top, bottom, center: (top + bottom) / 2, line });
        };
        const rows = Array.from(list.children).filter((child) => child instanceof HTMLElement && child.hasAttribute('data-chat-anchor-key'));
        // 1. Semantic rows (outermost boundaries win on duplicate tops).
        for (const row of rows) {
            const rect = row.getBoundingClientRect();
            push(row, rect.top + scrollTop, rect.top + rect.height + scrollTop);
        }
        // 2. Block-level elements inside rows (including content-level buttons
        //    such as produced-file chips).
        for (const row of rows) {
            for (const el of row.querySelectorAll('div, p, pre, ul, ol, li, table, h1, h2, h3, h4, h5, h6, blockquote, button, a')) {
                if (overlay !== null && overlay.contains(el))
                    continue;
                if (!isSnapTarget(el))
                    continue;
                const rect = el.getBoundingClientRect();
                push(el, rect.top + scrollTop, rect.top + rect.height + scrollTop);
            }
        }
        // 3. Individual text lines inside paragraphs/lists/code for fine snapping.
        if (!fast) {
            for (const row of rows) {
                for (const block of row.querySelectorAll('p, li, pre, h1, h2, h3, h4, h5, h6')) {
                    if (insideInteractive(block))
                        continue;
                    for (const line of lineEdges(block, scrollTop)) {
                        push(block, line.top, line.bottom, true);
                        if (found.length >= MAX_TARGETS)
                            break;
                    }
                    if (found.length >= MAX_TARGETS)
                        break;
                }
                if (found.length >= MAX_TARGETS)
                    break;
            }
        }
        found.sort((a, b) => a.top - b.top);
        this.targets = found;
    }
    /** Nearest target by vertical center distance to the given viewport y. */
    nearest(viewY) {
        const arr = this.targets;
        if (arr.length === 0)
            return null;
        const scrollTop = this.scrollport?.scrollTop ?? 0;
        const flowY = viewY + scrollTop;
        let lo = 0;
        let hi = arr.length - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (arr[mid].center < flowY)
                lo = mid + 1;
            else
                hi = mid;
        }
        let best = lo;
        if (lo > 0 && Math.abs(arr[lo - 1].center - flowY) < Math.abs(arr[lo].center - flowY))
            best = lo - 1;
        if (lo + 1 < arr.length && Math.abs(arr[lo + 1].center - flowY) < Math.abs(arr[best].center - flowY))
            best = lo + 1;
        return arr[best];
    }
    /** Nearest target by TOP-edge distance to the given viewport y (start marker). */
    nearestTop(viewY) {
        const arr = this.targets;
        if (arr.length === 0)
            return null;
        const scrollTop = this.scrollport?.scrollTop ?? 0;
        const flowY = viewY + scrollTop;
        let lo = 0;
        let hi = arr.length - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (arr[mid].top < flowY)
                lo = mid + 1;
            else
                hi = mid;
        }
        let best = lo;
        if (lo > 0 && Math.abs(arr[lo - 1].top - flowY) < Math.abs(arr[lo].top - flowY))
            best = lo - 1;
        if (lo + 1 < arr.length && Math.abs(arr[lo + 1].top - flowY) < Math.abs(arr[best].top - flowY))
            best = lo + 1;
        return arr[best];
    }
    /** Nearest target by BOTTOM-edge distance to the given viewport y (end marker). */
    nearestBottom(viewY) {
        const arr = this.targets;
        if (arr.length === 0)
            return null;
        const scrollTop = this.scrollport?.scrollTop ?? 0;
        const flowY = viewY + scrollTop;
        let lo = 0;
        let hi = arr.length - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (arr[mid].bottom < flowY)
                lo = mid + 1;
            else
                hi = mid;
        }
        let best = lo;
        if (lo > 0 && Math.abs(arr[lo - 1].bottom - flowY) < Math.abs(arr[lo].bottom - flowY))
            best = lo - 1;
        if (lo + 1 < arr.length && Math.abs(arr[lo + 1].bottom - flowY) < Math.abs(arr[best].bottom - flowY))
            best = lo + 1;
        return arr[best];
    }
    indexOf(el) {
        for (let i = 0; i < this.targets.length; i++) {
            if (this.targets[i].el === el)
                return i;
        }
        return -1;
    }
}
