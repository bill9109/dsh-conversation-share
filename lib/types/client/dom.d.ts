/** Locate the conversation chrome the share feature rides on. */
/** The 对话/轨迹 tab row (only present for a real session header). */
export declare function findTablist(): HTMLElement | null;
/** The conversation column's scrollport (host of the chat flow). */
export declare function findScrollport(): HTMLElement | null;
/** The chat flow list (children are the semantic chat rows). */
export declare function findFlowList(): HTMLElement | null;
/** The sticky composer seat inside the scrollport, when present. */
export declare function findComposerSeat(scrollport: HTMLElement): HTMLElement | null;
/**
 * Popup surfaces (menus, dialogs, dropdowns) rendered inside the header.
 * A control inside one of these is NOT part of the resident header strip.
 */
export declare const POPUP_SELECTOR = "[role=\"menu\"],[role=\"listbox\"],[role=\"dialog\"],[data-menu-material]";
/** Whether a node lives inside a popup rather than the resident header strip. */
export declare function insidePopup(el: Element | null): boolean;
/** The header's right-end utilities strip (home of the Session log button). */
export declare function findHeaderUtilities(): HTMLElement | null;
/** Ensure the 对话 tab is active (the share flow operates on the chat view). */
export declare function switchToChatTab(): void;
