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
export declare function findBrandSvg(): SVGElement | null;
