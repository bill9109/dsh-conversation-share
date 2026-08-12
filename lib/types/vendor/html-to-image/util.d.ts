export declare function resolveUrl(url: any, baseUrl: any): any;
export declare const uuid: () => string;
export declare function delay(ms: any): (args: any) => Promise<unknown>;
export declare function toArray(arrayLike: any): any[];
export declare function getStyleProperties(options?: {}): any;
export declare function getImageSize(targetNode: any, options?: {}): {
    width: any;
    height: any;
};
export declare function getPixelRatio(): number;
export declare function checkCanvasDimensions(canvas: any): void;
export declare function canvasToBlob(canvas: any, options?: {}): Promise<unknown>;
export declare function createImage(url: any): Promise<unknown>;
export declare function svgToDataURL(svg: any): Promise<string>;
export declare function nodeToDataURL(node: any, width: any, height: any): Promise<string>;
export declare const isInstanceOfElement: (node: any, instance: any) => any;
