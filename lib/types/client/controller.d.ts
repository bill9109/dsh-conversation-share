/**
 * Share-flow controller: owns the tab-row share button, the activate/cancel/
 * confirm button set, the marker overlay lifecycle, and the capture pipeline.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
export declare class ShareController {
    private readonly ctx;
    private readonly modal;
    private observer;
    private tablist;
    private actionsRow;
    private shareButton;
    private cancelButton;
    private confirmButton;
    private overlay;
    private active;
    private disposed;
    constructor(ctx: ClientContext);
    attach(): void;
    dispose(): void;
    private syncButton;
    private buildButton;
    private teardownButton;
    private toggle;
    private activate;
    private deactivate;
    /** Highlight the share icon while share mode is active so it reads as a toggle. */
    private setShareActive;
    private sessionRunning;
    /** Human-facing title of the current session, for the download filename. */
    private currentTitle;
    private showActionButtons;
    private hideActionButtons;
    private confirm;
}
