import type { CaptureOutput } from './capture.ts';
export declare class PreviewModal {
    private root;
    show(output: CaptureOutput, title?: string): void;
    /** Copy the PNG to the clipboard via the async Clipboard API. */
    private copy;
    hide(): void;
}
