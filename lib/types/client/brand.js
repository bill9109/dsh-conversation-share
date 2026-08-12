/** Clone the DeepSeek Harness brand wordmark for the capture footer. */
/**
 * The top-left brand is a button whose content is the 182×24 "DeepSeek
 * Harness" inline SVG: the wordmark and the logo mark ride `currentColor`,
 * while the BETA badge text uses
 * `fill="var(--dsw-alias-label-primary-inverted)"` clipped by
 * `url(#dsh-wordmark-badge-clip)`.
 *
 * The button's CSS-module class is hashed per web-UI build (observed values:
 * `EGiMFG_brand EGiMFG_wide`, `DEy3Aq_brand DEy3Aq_wide`, …). Matching a
 * specific hash silently drops the footer the moment the web UI is rebuilt,
 * so the lookup instead matches the stable `_brand` class token, with the
 * wordmark's `viewBox` as a fallback for future renames.
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
/** viewBox of the DeepSeek Harness wordmark SVG (stable across builds). */
const BRAND_VIEWBOX = '0 0 182 24';
export function findBrandSvg() {
    const svg = findBrandSvgElement();
    if (svg === null)
        return null;
    // The wordmark rides `currentColor`; read it from the live host element
    // (the brand button in normal builds) so the detached clone renders in the
    // right color inside the isolated SVG image.
    const host = svg.parentElement ?? svg;
    const clone = svg.cloneNode(true);
    clone.style.color = getComputedStyle(host).color;
    resolvePresentationColors(svg, clone);
    neutralizeClipPaths(clone);
    return clone;
}
function findBrandSvgElement() {
    const buttons = Array.from(document.querySelectorAll('button[class*="_brand"]'));
    // Preferred: a `_brand` button whose svg is the exact wordmark geometry.
    for (const button of buttons) {
        const svg = button.querySelector('svg');
        if (svg !== null && svg.getAttribute('viewBox') === BRAND_VIEWBOX)
            return svg;
    }
    // Next best: any `_brand` button that contains an svg.
    for (const button of buttons) {
        const svg = button.querySelector('svg');
        if (svg !== null)
            return svg;
    }
    // Last resort: any element holding the wordmark geometry (survives renames).
    return document.querySelector(`svg[viewBox="${BRAND_VIEWBOX}"]`);
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
