/** Minimal transient toast used for share-flow notices. */
import { themeColors } from "./theme.js";
let current = null;
let timer = null;
export function showToast(message, durationMs = 4200) {
    if (current !== null)
        current.remove();
    if (timer !== null)
        window.clearTimeout(timer);
    const c = themeColors();
    const el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.textContent = message;
    el.style.cssText = [
        'position:fixed;right:24px;bottom:96px;z-index:1001;max-width:min(360px,calc(100vw - 48px));',
        'padding:10px 14px;border-radius:10px;',
        'background:var(--dsw-alias-toast-bg, ' + c.labelPrimary + ');',
        'color:var(--dsw-alias-bg-base, ' + c.bgBase + ');',
        'font:400 13px/18px -apple-system,BlinkMacSystemFont,\'Segoe UI\',\'PingFang SC\',\'Hiragino Sans GB\',\'Microsoft YaHei\',sans-serif;',
        'box-shadow:0 4px 16px rgb(0 0 0 / 20%);opacity:0;transition:opacity 160ms ease;',
    ].join('');
    document.body.append(el);
    // Force a style flush so the opacity transition plays.
    void el.offsetHeight;
    el.style.opacity = '1';
    current = el;
    // A non-positive duration keeps the toast pinned until dismissed/replaced.
    if (durationMs <= 0) {
        timer = null;
        return;
    }
    timer = window.setTimeout(() => {
        el.style.opacity = '0';
        window.setTimeout(() => el.remove(), 180);
        current = null;
        timer = null;
    }, durationMs);
}
/** Immediately clear any visible toast (e.g. when the awaited work completes). */
export function dismissToast() {
    if (timer !== null)
        window.clearTimeout(timer);
    timer = null;
    if (current !== null) {
        current.style.opacity = '0';
        window.setTimeout(() => current?.remove(), 180);
        current = null;
    }
}
