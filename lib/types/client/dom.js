/** Locate the conversation chrome the share feature rides on. */
/** The 对话/轨迹 tab row (only present for a real session header). */
export function findTablist() {
    return document.querySelector('[data-phase] [role="tablist"]');
}
/** The conversation column's scrollport (host of the chat flow). */
export function findScrollport() {
    return document.querySelector('[data-conversation-scroll]');
}
/** The chat flow list (children are the semantic chat rows). */
export function findFlowList() {
    return document.querySelector('[data-chat-flow]');
}
/** The sticky composer seat inside the scrollport, when present. */
export function findComposerSeat(scrollport) {
    return scrollport.querySelector('[data-composer-seat]');
}
/**
 * Popup surfaces (menus, dialogs, dropdowns) rendered inside the header.
 * A control inside one of these is NOT part of the resident header strip.
 */
export const POPUP_SELECTOR = '[role="menu"],[role="listbox"],[role="dialog"],[data-menu-material]';
/** Whether a node lives inside a popup rather than the resident header strip. */
export function insidePopup(el) {
    return el !== null && el.closest(POPUP_SELECTOR) !== null;
}
/** The header's right-end utilities strip (home of the Session log button). */
export function findHeaderUtilities() {
    // Stable slot (dsh alpha+): the header's right-end utilities strip. Prefer the
    // explicit data-slot so the locator survives Session-log-button label changes.
    const slot = document.querySelector('[data-slot="conversation.session.header.utilities"]');
    if (slot !== null)
        return slot;
    // Fallback (older builds / label variants): the parent of the Session log button.
    // The label is localized (e.g. "Session 日志"), so accept the "log" stem or the CJK 日志.
    //
    // DSH now folds that button into the header's "更多操作" overflow menu, and that
    // popup renders INSIDE <header>: matching "下载 Session 日志" there would mount the
    // share control into the secondary menu, where it vanishes with the popup. Only a
    // control on the resident strip counts, so popup descendants are rejected.
    const log = Array.from(document.querySelectorAll('header button')).find(b => /session\s*(?:log|日志)/i.test((b.textContent ?? '').trim())
        && (b.textContent ?? '').trim().length < 30
        && !insidePopup(b));
    const parent = log?.parentElement ?? null;
    return insidePopup(parent) ? null : parent;
}
/** Ensure the 对话 tab is active (the share flow operates on the chat view). */
export function switchToChatTab() {
    const tablist = findTablist();
    if (tablist === null)
        return;
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    if (tabs.length < 2)
        return;
    const active = tabs.find(tab => tab.getAttribute('aria-selected') === 'true');
    if (active === undefined || active === tabs[0])
        return;
    tabs[0].click();
}
