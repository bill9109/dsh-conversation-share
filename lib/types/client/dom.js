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
