/**
 * Typed re-export of the vendored html-to-image implementation.
 *
 * The vendored sources (this directory) are html-to-image 1.11.13 (MIT);
 * see LICENSE in this directory. Only the entry surface needed by the
 * capture pipeline is re-exported here with a local Options type (the
 * upstream es build ships its types separately, so we restate the option
 * shape we consume).
 */
import { toPng, toCanvas, toSvg, toPixelData, toJpeg, toBlob, getFontEmbedCSS } from './index-impl.ts';
export { toPng, toCanvas, toSvg, toPixelData, toJpeg, toBlob, getFontEmbedCSS };
/** Options accepted by the html-to-image entry functions (subset we use). */
export interface Options {
    width?: number;
    height?: number;
    backgroundColor?: string;
    canvasWidth?: number;
    canvasHeight?: number;
    style?: Partial<CSSStyleDeclaration>;
    filter?: (domNode: HTMLElement) => boolean;
    quality?: number;
    cacheBust?: boolean;
    includeQueryParams?: boolean;
    imagePlaceholder?: string;
    pixelRatio?: number;
    skipFonts?: boolean;
    preferredFontFormat?: string;
    fontEmbedCSS?: string;
    skipAutoScale?: boolean;
    includeStyleProperties?: string[];
}
