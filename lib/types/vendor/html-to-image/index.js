/**
 * Typed re-export of the vendored html-to-image implementation.
 *
 * The vendored sources (this directory) are html-to-image 1.11.13 (MIT);
 * see LICENSE in this directory. Only the entry surface needed by the
 * capture pipeline is re-exported here with a local Options type (the
 * upstream es build ships its types separately, so we restate the option
 * shape we consume).
 */
import { toPng, toCanvas, toSvg, toPixelData, toJpeg, toBlob, getFontEmbedCSS, } from "./index-impl.js";
export { toPng, toCanvas, toSvg, toPixelData, toJpeg, toBlob, getFontEmbedCSS };
