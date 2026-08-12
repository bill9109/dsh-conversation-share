/** Locate the conversation chrome the share feature rides on. */
/** The 对话/轨迹 tab row (only present for a real session header). */
export declare function findTablist(): HTMLElement | null;
/** The conversation column's scrollport (host of the chat flow). */
export declare function findScrollport(): HTMLElement | null;
/** The chat flow list (children are the semantic chat rows). */
export declare function findFlowList(): HTMLElement | null;
/** The sticky composer seat inside the scrollport, when present. */
export declare function findComposerSeat(scrollport: HTMLElement): HTMLElement | null;
/** Ensure the 对话 tab is active (the share flow operates on the chat view). */
export declare function switchToChatTab(): void;
