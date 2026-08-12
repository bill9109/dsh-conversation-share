import { ShareController } from "./controller.js";
import { captureRange } from "./capture.js";
export const inject = ['sessions'];
window.__dshShareDebug = { captureRange };
/** Mount the browser-side share feature. */
export function apply(ctx) {
    const controller = new ShareController(ctx);
    controller.attach();
    ctx.effect(() => () => controller.dispose(), 'conversation-share: browser feature lifecycle');
}
