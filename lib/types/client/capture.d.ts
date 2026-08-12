export interface CaptureParams {
    scrollport: HTMLElement;
    flowList: HTMLElement;
    startEl: HTMLElement;
    endEl: HTMLElement;
    /**
     * Flow-relative y of the exact start/end boundaries (line-level snap
     * positions). Optional: falls back to the elements' own edges.
     */
    startEdge?: number;
    endEdge?: number;
    brandSvg: SVGElement | null;
    themeBg: string;
}
export interface CaptureOutput {
    dataUrl: string;
    /** Device pixels. */
    width: number;
    height: number;
}
export declare function captureRange(params: CaptureParams): Promise<CaptureOutput>;
