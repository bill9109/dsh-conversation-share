/**
 * Clone the DeepSeek Harness brand wordmark for the capture footer.
 *
 * Older web-UI builds ship the whole lockup as ONE 182x24 SVG: the whale mark,
 * the "deepseek harness" wordmark and (historically) the BETA badge, all riding
 * `currentColor`.
 *
 * Newer builds split that same artwork into two SVGs inside one brand button:
 *   [data-slot="sidebar.brand.mark"] -> the whale, viewBox "0 0 23.16 17.04"
 *   [data-slot="sidebar.brand.name"] -> the wordmark, viewBox "26 0 156 24"
 * Both are crops of the original 182x24 artwork — the wordmark's crop origin
 * (26) is exactly where the text starts after the mark — so re-assembling them
 * (mark at the artwork origin, text at its own crop origin) reproduces the old
 * lockup. Using only the button's first SVG, as this module used to, silently
 * reduced the footer to the bare whale.
 *
 * The button's CSS-module class is hashed per web-UI build (observed values:
 * `EGiMFG_brand EGiMFG_wide`, `DEy3Aq_brand DEy3Aq_wide`, `RP9faW_brand
 * RP9faW_wide`, ...). Matching a specific hash silently drops the footer the
 * moment the web UI is rebuilt, so the lookup matches the stable `_brand`
 * class token and the `sidebar.brand.*` slots instead, with the lockup's
 * `viewBox` as a fallback for future renames.
 *
 * Two SVG-image-isolation problems are handled here:
 *  1. `var()` fills must be baked to their computed colors — and that can
 *     only be read from the LIVE (in-document) elements, since the detached
 *     clone cannot resolve CSS variables.
 *  2. `url(#...)` clip-path references do not resolve when the SVG is
 *     re-rendered inside an isolated SVG image, which blanks clipped content
 *     (exactly what made the badge text disappear). The clip regions only
 *     trim overflow already inside the artwork bounds, so dropping the
 *     clip-path attributes is safe and restores the text.
 */
const SVG_NS = 'http://www.w3.org/2000/svg';
/** viewBox of the single-SVG lockup (older web-UI builds). */
const BRAND_VIEWBOX = '0 0 182 24';
/** A brand SVG at least this many times wider than tall is the wordmark row. */
const WORDMARK_MIN_ASPECT = 3;
/** Presentation attributes a part's children may rely on inheriting. */
const PRESENTATION_ATTRIBUTES = [
    'fill', 'fill-rule', 'clip-rule', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'opacity',
];
/**
 * The last wordmark part seen in the DOM, with its `var()` colors already
 * baked. The collapsed sidebar keeps only the whale mark (the wordmark slot is
 * unmounted), so a capture taken in that state re-assembles the lockup from
 * this snapshot instead of degrading to the bare mark.
 */
let cachedWordMarkup = null;
export function findBrandSvg() {
    const parts = findBrandParts();
    if (parts === null)
        return null;
    if (parts.word !== null)
        rememberWord(parts.word);
    const word = parts.word ?? reviveWord();
    // The wordmark rides `currentColor`; read it from the live host element
    // (the brand button in normal builds) so the detached clone renders in the
    // right color inside the isolated SVG image.
    const host = parts.mark.parentElement ?? parts.mark;
    const clone = word === null ? cloneLockup(parts.mark) : composeLockup(parts.mark, word);
    clone.style.color = getComputedStyle(host).color;
    neutralizeClipPaths(clone);
    return clone;
}
/** Snapshot a live wordmark with its `var()` colors resolved. */
function rememberWord(word) {
    const resolved = word.cloneNode(true);
    resolvePresentationColors(word, resolved);
    cachedWordMarkup = resolved.outerHTML;
}
/** Rebuild the remembered wordmark when the collapsed sidebar unmounted it. */
function reviveWord() {
    if (cachedWordMarkup === null)
        return null;
    const holder = document.createElement('div');
    holder.innerHTML = cachedWordMarkup;
    const svg = holder.querySelector('svg');
    return svg instanceof SVGElement ? svg : null;
}
/** Clone a single-SVG lockup verbatim. */
function cloneLockup(svg) {
    const clone = svg.cloneNode(true);
    resolvePresentationColors(svg, clone);
    return clone;
}
/**
 * Re-assemble a split lockup. Both parts are crops of the same artwork, so the
 * wordmark's own crop origin is the x where the text begins and the combined
 * viewBox is simply that origin plus the wordmark's width.
 */
function composeLockup(mark, word) {
    const markBox = viewBoxOf(mark) ?? { x: 0, y: 0, width: 23.16, height: 17.04 };
    const wordBox = viewBoxOf(word) ?? { x: 0, y: 0, width: 182, height: 24 };
    const width = wordBox.x + wordBox.width;
    const height = Math.max(wordBox.height, markBox.height);
    const combined = document.createElementNS(SVG_NS, 'svg');
    combined.setAttribute('viewBox', `0 0 ${width} ${height}`);
    combined.setAttribute('width', String(width));
    combined.setAttribute('height', String(height));
    combined.setAttribute('fill', 'none');
    combined.setAttribute('aria-hidden', 'true');
    // The mark sits on the artwork's left edge, centred on the wordmark's box —
    // that is how the pre-split artwork positioned it.
    const markDy = (height - markBox.height) / 2 - markBox.y;
    combined.append(importPart(mark, `translate(${-markBox.x} ${markDy})`));
    combined.append(importPart(word, `translate(0 ${-wordBox.y})`));
    return combined;
}
/** Import one part's children into a positioned group of the combined lockup. */
function importPart(source, transform) {
    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('transform', transform);
    // The part's root carries presentation attributes (e.g. fill="none") that its
    // children rely on; they must ride the group now that the <svg> root is gone.
    for (const attribute of PRESENTATION_ATTRIBUTES) {
        const value = source.getAttribute(attribute);
        if (value !== null)
            group.setAttribute(attribute, value);
    }
    for (const child of Array.from(source.children))
        group.append(child.cloneNode(true));
    resolvePresentationColors(source, group);
    return group;
}
/** The brand's SVGs, in document order (mark first when both slots exist). */
function brandSvgs() {
    const slots = [
        ...document.querySelectorAll('[data-slot="sidebar.brand.mark"] svg'),
        ...document.querySelectorAll('[data-slot="sidebar.brand.name"] svg'),
    ];
    if (slots.length > 0)
        return slots;
    const buttons = Array.from(document.querySelectorAll('button[class*="_brand"]'));
    for (const button of buttons) {
        const svgs = Array.from(button.querySelectorAll('svg'));
        if (svgs.length > 0)
            return svgs;
    }
    // Last resort: any element holding the lockup geometry (survives renames).
    const orphan = document.querySelector(`svg[viewBox="${BRAND_VIEWBOX}"]`);
    return orphan === null ? [] : [orphan];
}
function findBrandParts() {
    const candidates = brandSvgs();
    if (candidates.length === 0)
        return null;
    // Single-SVG builds: the whole lockup, used verbatim.
    const lockup = candidates.find(svg => svg.getAttribute('viewBox') === BRAND_VIEWBOX);
    if (lockup !== undefined)
        return { mark: lockup, word: null };
    // Split builds: the widest SVG is the wordmark row, the narrowest the mark.
    const ranked = [...candidates].sort((a, b) => aspectOf(b) - aspectOf(a));
    const word = ranked[0];
    if (word === undefined || aspectOf(word) < WORDMARK_MIN_ASPECT) {
        return { mark: candidates[0], word: null };
    }
    const mark = ranked[ranked.length - 1];
    return mark === word ? { mark: word, word: null } : { mark, word };
}
function aspectOf(svg) {
    const box = viewBoxOf(svg);
    if (box === null || box.height === 0)
        return 0;
    return box.width / box.height;
}
/** Parse an SVG's viewBox, or null when it is absent or malformed. */
function viewBoxOf(svg) {
    const raw = svg.getAttribute('viewBox');
    if (raw === null)
        return null;
    const numbers = raw.trim().split(/[\s,]+/).map(Number);
    if (numbers.length !== 4 || numbers.some(value => !Number.isFinite(value)))
        return null;
    return { x: numbers[0], y: numbers[1], width: numbers[2], height: numbers[3] };
}
/** Copy resolved fill/stroke colors from the live SVG onto the clone. */
function resolvePresentationColors(source, clone) {
    const sources = [source, ...Array.from(source.querySelectorAll('*'))];
    const targets = [clone, ...Array.from(clone.querySelectorAll('*'))];
    for (let i = 0; i < sources.length && i < targets.length; i++) {
        const original = sources[i];
        const target = targets[i];
        for (const attribute of ['fill', 'stroke']) {
            const value = original.getAttribute(attribute);
            if (value !== null && value.startsWith('var(')) {
                const resolved = getComputedStyle(original)[attribute];
                if (resolved !== '' && resolved !== 'none' && !resolved.startsWith('var(')) {
                    target.setAttribute(attribute, resolved);
                }
            }
        }
    }
}
/** Drop `url(#...)` clip-path references (broken in isolated SVG images). */
function neutralizeClipPaths(clone) {
    for (const el of [clone, ...Array.from(clone.querySelectorAll('*'))]) {
        if (el.getAttribute('clip-path') !== null)
            el.removeAttribute('clip-path');
    }
}
