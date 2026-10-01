import { findBrandSvg } from "./brand.js";
import { captureRange } from "./capture.js";
import { findFlowList, findHeaderUtilities, findScrollport, insidePopup, switchToChatTab } from "./dom.js";
import { ghostButtonHoverBackground, ghostButtonStyle, headerShareButtonActiveStyle, headerShareButtonStyle, headerShareHoverBackground, headerShareIconSVG, primaryButtonBackground, primaryButtonHoverBackground, primaryButtonStyle, } from "./icons.js";
import { MarkerOverlay } from "./markers.js";
import { PreviewModal } from "./modal.js";
import { resolveThemeBackground } from "./theme.js";
import { dismissToast, showToast } from "./toast.js";
const ACTIONS_CLASS = 'dsh-share-tabs-actions';
export class ShareController {
    ctx;
    modal = new PreviewModal();
    observer = null;
    utilities = null;
    /** The Session log button's computed border, copied so the share pill matches. */
    logBorder = '';
    actionsRow = null;
    shareButton = null;
    cancelButton = null;
    confirmButton = null;
    overlay = null;
    active = false;
    disposed = false;
    constructor(ctx) {
        this.ctx = ctx;
    }
    attach() {
        this.observer = new MutationObserver(() => this.syncButton());
        this.observer.observe(document.body, { childList: true, subtree: true });
        this.syncButton();
    }
    dispose() {
        this.disposed = true;
        this.observer?.disconnect();
        this.observer = null;
        this.deactivate();
        this.teardownButton();
        this.modal.hide();
    }
    // ---- button mounting --------------------------------------------------
    syncButton() {
        if (this.disposed)
            return;
        const utilities = findHeaderUtilities();
        // A popup (e.g. the header's "更多操作" menu) is not the resident strip: never
        // mount the share control there, or it unmounts with the popup.
        if (utilities === null || insidePopup(utilities)) {
            if (this.active)
                this.deactivate();
            this.teardownButton();
            return;
        }
        if (this.utilities === utilities && this.shareButton !== null && utilities.contains(this.shareButton))
            return;
        // The header was re-created — likely a session switch.
        if (this.active)
            this.deactivate();
        this.teardownButton();
        this.buildButton(utilities);
    }
    buildButton(utilities) {
        const row = document.createElement('div');
        row.className = ACTIONS_CLASS;
        row.style.cssText = 'display:flex;align-items:center;gap:6px;flex:none;';
        const share = document.createElement('button');
        share.type = 'button';
        share.title = '分享对话截图';
        share.setAttribute('aria-label', '分享对话截图');
        share.style.cssText = headerShareButtonStyle();
        share.innerHTML = headerShareIconSVG() + '<span>分享</span>';
        share.addEventListener('click', () => this.toggle());
        // Hover fill matching the Session log button's :hover. Inline styles beat
        // stylesheet :hover rules, so toggle the background via events; skip while
        // share mode is active (the active tint already reads as "pressed").
        share.addEventListener('mouseenter', () => {
            if (this.active)
                return;
            share.style.background = headerShareHoverBackground;
        });
        share.addEventListener('mouseleave', () => {
            if (this.active)
                return;
            share.style.background = 'transparent';
        });
        row.append(share);
        // Match the Session log button's hairline border exactly (theme-agnostic:
        // copy its computed value so both buttons always agree). The label is localized
        // (e.g. "Session 日志"), so accept the "log" stem or the CJK 日志 — but menu
        // items rendered inside the strip's own popup match it too, and only
        // strip-resident buttons count.
        const logBtn = Array.from(utilities.querySelectorAll('button')).find(b => /session\s*(?:log|日志)/i.test((b.textContent ?? '').trim()) && !insidePopup(b));
        if (logBtn !== undefined) {
            this.logBorder = getComputedStyle(logBtn).border;
            share.style.border = this.logBorder;
        }
        // Sit to the LEFT of the Session log button (the strip's first child).
        utilities.insertBefore(row, utilities.firstChild);
        this.utilities = utilities;
        this.actionsRow = row;
        this.shareButton = share;
    }
    teardownButton() {
        this.actionsRow?.remove();
        this.actionsRow = null;
        this.shareButton = null;
        this.cancelButton = null;
        this.confirmButton = null;
        this.utilities = null;
    }
    // ---- mode switching ---------------------------------------------------
    toggle() {
        if (this.active)
            this.deactivate();
        else
            this.activate();
    }
    activate() {
        if (this.active || this.disposed)
            return;
        switchToChatTab();
        const scrollport = findScrollport();
        const flowList = findFlowList();
        if (scrollport === null || flowList === null) {
            showToast('当前会话还没有可分享的对话内容');
            return;
        }
        this.showActionButtons();
        this.active = true;
        this.setShareActive(true);
        this.overlay = new MarkerOverlay({ onDetach: () => this.deactivate(), isStreaming: () => this.sessionRunning() });
        this.overlay.activate(scrollport, flowList);
        if (this.sessionRunning())
            showToast('对话仍在生成中，标记位置可能随新消息变化');
    }
    deactivate() {
        if (this.disposed)
            return;
        this.overlay?.dispose();
        this.overlay = null;
        this.hideActionButtons();
        this.active = false;
        this.setShareActive(false);
    }
    /** Highlight the share icon while share mode is active so it reads as a toggle. */
    setShareActive(active) {
        const share = this.shareButton;
        if (share === null)
            return;
        // The share pill gets a distinct active look (primary border + tint) so
        // the toggle state reads at a glance.
        if (active) {
            share.style.cssText = headerShareButtonStyle() + headerShareButtonActiveStyle();
            share.setAttribute('aria-pressed', 'true');
        }
        else {
            share.style.cssText = headerShareButtonStyle();
            // The inactive hairline must match the Session log button exactly.
            if (this.logBorder !== '')
                share.style.border = this.logBorder;
            share.removeAttribute('aria-pressed');
        }
    }
    sessionRunning() {
        try {
            const list = this.ctx.sessions.list.getSnapshot();
            const id = list.current;
            if (id === undefined)
                return false;
            return list.byId[id]?.running ?? false;
        }
        catch {
            return false;
        }
    }
    /** Human-facing title of the current session, for the download filename. */
    currentTitle() {
        try {
            const list = this.ctx.sessions.list.getSnapshot();
            const id = list.current;
            if (id === undefined)
                return '';
            const summary = list.byId[id];
            return summary?.displayTitle ?? summary?.title ?? '';
        }
        catch {
            return '';
        }
    }
    // ---- action buttons ---------------------------------------------------
    showActionButtons() {
        const row = this.actionsRow;
        const share = this.shareButton;
        if (row === null || share === null || this.cancelButton !== null)
            return;
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.textContent = '取消';
        cancel.style.cssText = ghostButtonStyle();
        if (this.logBorder !== '')
            cancel.style.border = this.logBorder;
        cancel.addEventListener('click', () => this.deactivate());
        // Hover fill matching the theme's ghost/secondary button (inline styles beat
        // the stylesheet :hover, so toggle the background via events).
        cancel.addEventListener('mouseenter', () => {
            cancel.style.background = ghostButtonHoverBackground();
        });
        cancel.addEventListener('mouseleave', () => {
            cancel.style.background = 'transparent';
        });
        const confirm = document.createElement('button');
        confirm.type = 'button';
        confirm.textContent = '确认';
        confirm.style.cssText = primaryButtonStyle();
        confirm.addEventListener('click', () => {
            const range = this.overlay?.currentRange();
            if (range !== null && range !== undefined) {
                void this.confirm(range.startEl, range.endEl, range.startEdge, range.endEdge);
            }
        });
        // Hover fill: darken the business primary slightly (no dedicated hover token,
        // so mix toward black); restore the base fill on leave.
        confirm.addEventListener('mouseenter', () => {
            confirm.style.background = primaryButtonHoverBackground();
        });
        confirm.addEventListener('mouseleave', () => {
            confirm.style.background = primaryButtonBackground();
        });
        // 取消/确认 expand to the LEFT of the share button; the share pill itself
        // stays in place (its active style marks the toggle state).
        row.insertBefore(cancel, share);
        row.insertBefore(confirm, share);
        this.cancelButton = cancel;
        this.confirmButton = confirm;
    }
    hideActionButtons() {
        this.cancelButton?.remove();
        this.confirmButton?.remove();
        this.cancelButton = null;
        this.confirmButton = null;
    }
    // ---- capture ----------------------------------------------------------
    async confirm(startEl, endEl, startEdge, endEdge) {
        const scrollport = findScrollport();
        const flowList = findFlowList();
        if (scrollport === null || flowList === null) {
            showToast('对话流已变化，请重新选择范围');
            this.deactivate();
            return;
        }
        this.deactivate();
        // Pin a "generating" notice for the (potentially multi-second) render; it
        // is replaced by the error toast on failure or cleared on success.
        showToast('正在生成截图…', 0);
        try {
            const output = await captureRange({
                scrollport,
                flowList,
                startEl,
                endEl,
                startEdge,
                endEdge,
                brandSvg: findBrandSvg(),
                themeBg: resolveThemeBackground(),
            });
            dismissToast();
            this.modal.show(output, this.currentTitle());
        }
        catch (error) {
            showToast(`截图生成失败：${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
