/**
 * PNG long-image capture of the conversation range between two snap targets.
 *
 * Strategy: clone the chat rows between the range boundaries, render them in
 * height-bounded chunks with the vendored html-to-image engine, crop each
 * boundary chunk to the exact snapped element edges, stitch the chunks into
 * one canvas and append the brand footer. Chunking keeps every intermediate
 * canvas far below the browser's ~32767px canvas limit, so arbitrarily long
 * conversations export as a single image.
 */
import { toCanvas } from "../vendor/html-to-image/index.js";
/** Side padding per side, in points (doubled per user feedback: 40pt). */
const SIDE_PADDING_PT = 40;
/** Points per inch constant (CSS: 1pt = 1/72in; at 96dpi that is 4/3px). */
const PT_TO_PX = 96 / 72;
/** Target chunk height in css px. */
const CHUNK_TARGET_PX = 3000;
/** Brand footer vertical rhythm. */
const FOOTER_PAD_PX = 28;
/** Hard ceiling for the output canvas height in device px (browser canvas limit). */
const MAX_DEVICE_HEIGHT = 30000;
/**
 * Ceiling for a single html-to-image render. The vendored engine resolves its
 * image load through `requestAnimationFrame`, which browsers pause in hidden
 * tabs — without this bound the confirm flow would hang forever.
 */
const RENDER_TIMEOUT_MS = 30000;
class CaptureError extends Error {
}
/** The chat row (direct flowList child) containing an element. */
function rowOf(el, flowList) {
    let current = el;
    while (current !== null && current.parentElement !== flowList) {
        current = current.parentElement;
    }
    if (current === null)
        throw new CaptureError('范围标记不在对话流中');
    return current;
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
/** Reject a promise after `ms`, leaving the underlying work to settle on its own. */
function withTimeout(promise, ms, message) {
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new CaptureError(message)), ms);
        promise.then(value => { window.clearTimeout(timer); resolve(value); }, error => { window.clearTimeout(timer); reject(error); });
    });
}
const RENDER_TIMEOUT_MESSAGE = '截图渲染超时（标签页可能被切到后台），请切回本页后重试';
function buildChunkWrapper(rows, contentWidth, sidePadPx, outerWidth, themeBg, flowList) {
    const wrapper = document.createElement('div');
    const flowPosition = getComputedStyle(flowList).position;
    wrapper.style.cssText = [
        // Offscreen anchor only. Do NOT set visibility:hidden/opacity:0 here:
        // html-to-image copies computed styles onto its in-iframe clone, so a
        // hidden source renders a blank capture.
        `position:fixed;left:-100000px;top:0;pointer-events:none;`,
        `width:${outerWidth}px;background:${themeBg};`,
        `padding:0 ${sidePadPx}px;box-sizing:border-box;`,
    ].join('');
    const inner = document.createElement('div');
    const flowStyle = getComputedStyle(flowList);
    inner.style.cssText = [
        `width:${contentWidth}px;box-sizing:border-box;`,
        // Mirror the flow list's layout so spacing is preserved exactly: the live
        // flow is a flex column with a row gap — a plain block container collapses
        // those margins/gaps and the export loses inter-row spacing.
        `display:${flowStyle.display};`,
        flowStyle.flexDirection ? `flex-direction:${flowStyle.flexDirection};` : '',
        flowStyle.gap ? `gap:${flowStyle.gap};` : '',
        flowStyle.alignItems ? `align-items:${flowStyle.alignItems};` : '',
        // Mirror the positioning context so absolutely-positioned descendants
        // resolve against the same containing block.
        flowPosition === 'static' ? '' : `position:${flowPosition};`,
    ].join('');
    for (const row of rows) {
        inner.append(row.cloneNode(true));
    }
    wrapper.append(inner);
    return wrapper;
}
function buildFooterWrapper(outerWidth, footerHeight, themeBg, brandSvg) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = [
        `position:fixed;left:-100000px;top:0;pointer-events:none;`,
        `width:${outerWidth}px;height:${footerHeight}px;background:${themeBg};`,
        `display:flex;flex-direction:column;align-items:center;justify-content:flex-end;`,
        `padding-bottom:${FOOTER_PAD_PX}px;box-sizing:border-box;`,
    ].join('');
    if (brandSvg !== null) {
        const brand = brandSvg.cloneNode(true);
        brand.style.display = 'block';
        wrapper.append(brand);
    }
    return wrapper;
}
export async function captureRange(params) {
    const { scrollport, flowList, startEl, endEl, brandSvg, themeBg } = params;
    const rows = Array.from(flowList.children).filter((child) => child instanceof HTMLElement);
    const startRow = rowOf(startEl, flowList);
    const endRow = rowOf(endEl, flowList);
    const startIndex = rows.indexOf(startRow);
    const endIndex = rows.indexOf(endRow);
    if (startIndex === -1 || endIndex === -1)
        throw new CaptureError('无法定位对话范围');
    const slice = rows.slice(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex) + 1);
    const firstRow = slice[0];
    const lastRow = slice[slice.length - 1];
    // Crop amounts: from the first row's top to the start boundary, and from
    // the end boundary to the last row's bottom. Boundaries are flow-relative
    // snap edges (line-level); elements are the fallback.
    const firstRect = firstRow.getBoundingClientRect();
    const lastRect = lastRow.getBoundingClientRect();
    const scrollTop = scrollport.scrollTop;
    const startView = params.startEdge !== undefined
        ? params.startEdge - scrollTop
        : startEl.getBoundingClientRect().top;
    const endView = params.endEdge !== undefined
        ? params.endEdge - scrollTop
        : endEl.getBoundingClientRect().bottom;
    const topCrop = clamp(startView - firstRect.top, 0, Math.max(0, firstRect.height - 1));
    const bottomCrop = clamp(lastRect.bottom - endView, 0, Math.max(0, lastRect.height - 1));
    // Reproduce the live content width so text wrapping matches exactly.
    const flowStyle = getComputedStyle(flowList);
    const padLeft = parseFloat(flowStyle.paddingLeft) || 0;
    const padRight = parseFloat(flowStyle.paddingRight) || 0;
    const contentWidth = Math.max(120, flowList.clientWidth - padLeft - padRight);
    const sidePadPx = SIDE_PADDING_PT * PT_TO_PX;
    const outerWidth = contentWidth + sidePadPx * 2;
    // Partition rows into height-bounded chunks.
    const heights = slice.map(row => row.getBoundingClientRect().height);
    const chunks = [];
    let current = [];
    let currentHeight = 0;
    for (let i = 0; i < slice.length; i++) {
        current.push(i);
        currentHeight += heights[i];
        if (currentHeight >= CHUNK_TARGET_PX || i === slice.length - 1) {
            chunks.push(current);
            current = [];
            currentHeight = 0;
        }
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Brand footer band dimensions are known before rendering, so the length
    // guard below can fail fast instead of after an expensive render.
    const brandHeight = brandSvg !== null ? (Number(brandSvg.getAttribute('height')) || 24) : 0;
    const footerHeight = sidePadPx + brandHeight + FOOTER_PAD_PX;
    // Top padding matches the side padding (40pt): the content starts below a
    // theme-background band at the very top of the image.
    const topPadPx = sidePadPx;
    // Early length guard: estimate the final device height from the row heights
    // (pre-crop, so slightly conservative) and bail before rendering.
    const estimatedHeight = topPadPx + heights.reduce((sum, h) => sum + h, 0) + footerHeight;
    if (Math.round(estimatedHeight * dpr) > MAX_DEVICE_HEIGHT) {
        throw new CaptureError('选择范围过长，请缩短范围后重试');
    }
    // Render every chunk offscreen, cropping boundary chunks to the snap edges.
    const chunkCanvases = [];
    const chunkHeights = [];
    for (let c = 0; c < chunks.length; c++) {
        const rowsInChunk = chunks[c].map(index => slice[index]);
        const wrapper = buildChunkWrapper(rowsInChunk, contentWidth, sidePadPx, outerWidth, themeBg, flowList);
        document.body.append(wrapper);
        try {
            const measuredHeight = wrapper.offsetHeight;
            const canvas = await withTimeout(toCanvas(wrapper, {
                width: outerWidth,
                height: measuredHeight,
                pixelRatio: dpr,
                skipFonts: true,
                backgroundColor: themeBg,
                // The offscreen anchor (position:fixed; left:-100000px) is copied into
                // the in-SVG clone via computed-style inlining and would push the
                // whole chunk off-canvas. Neutralize it on the clone only.
                style: { position: 'static', left: '0px', top: '0px' },
            }), RENDER_TIMEOUT_MS, RENDER_TIMEOUT_MESSAGE);
            let srcTop = 0;
            let srcHeight = canvas.height;
            if (c === 0) {
                srcTop = Math.round(topCrop * dpr);
                srcHeight -= srcTop;
            }
            if (c === chunks.length - 1) {
                srcHeight -= Math.round(bottomCrop * dpr);
            }
            if (srcHeight <= 0)
                throw new CaptureError('选择范围为空');
            // Slice the cropped region out of the chunk canvas.
            const cropped = document.createElement('canvas');
            cropped.width = canvas.width;
            cropped.height = srcHeight;
            const context = cropped.getContext('2d');
            if (context === null)
                throw new CaptureError('无法初始化画布');
            context.drawImage(canvas, 0, srcTop, canvas.width, srcHeight, 0, 0, canvas.width, srcHeight);
            chunkCanvases.push(cropped);
            chunkHeights.push(srcHeight / dpr);
        }
        finally {
            wrapper.remove();
        }
    }
    // Brand footer band. The gap above the brand matches the top/side padding
    // (40pt) for a symmetric frame; FOOTER_PAD_PX remains below the brand.
    const footerWrapper = buildFooterWrapper(outerWidth, footerHeight, themeBg, brandSvg);
    document.body.append(footerWrapper);
    let footerCanvas = null;
    try {
        footerCanvas = brandSvg === null
            ? null
            : await withTimeout(toCanvas(footerWrapper, {
                width: outerWidth,
                height: footerHeight,
                pixelRatio: dpr,
                skipFonts: true,
                backgroundColor: themeBg,
                style: { position: 'static', left: '0px', top: '0px' },
            }), RENDER_TIMEOUT_MS, RENDER_TIMEOUT_MESSAGE);
    }
    finally {
        footerWrapper.remove();
    }
    const contentHeight = chunkHeights.reduce((sum, h) => sum + h, 0);
    // The footer band exists only when there is a brand to show; otherwise the
    // image ends at the last row (no transparent tail).
    const totalHeight = topPadPx + contentHeight + (footerCanvas !== null ? footerHeight : 0);
    const deviceWidth = Math.round(outerWidth * dpr);
    const deviceHeight = Math.round(totalHeight * dpr);
    if (deviceHeight > MAX_DEVICE_HEIGHT) {
        throw new CaptureError('选择范围过长，请缩短范围后重试');
    }
    const output = document.createElement('canvas');
    output.width = deviceWidth;
    output.height = deviceHeight;
    const context = output.getContext('2d');
    if (context === null)
        throw new CaptureError('无法初始化画布');
    context.fillStyle = themeBg;
    context.fillRect(0, 0, deviceWidth, deviceHeight);
    let y = topPadPx;
    for (let c = 0; c < chunkCanvases.length; c++) {
        const canvas = chunkCanvases[c];
        context.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, Math.round(y * dpr), deviceWidth, canvas.height);
        y += chunkHeights[c];
    }
    if (footerCanvas !== null) {
        context.drawImage(footerCanvas, 0, Math.round(y * dpr), deviceWidth, footerCanvas.height);
    }
    return {
        dataUrl: output.toDataURL('image/png'),
        width: deviceWidth,
        height: deviceHeight,
    };
}
