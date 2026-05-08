import { DataCaptureViewProxy, BaseNativeProxy } from 'scandit-datacapture-frameworks-core';
export declare class NativeDataCaptureViewProxy extends BaseNativeProxy implements DataCaptureViewProxy {
    setPositionAndSize(top: number, left: number, width: number, height: number, shouldBeUnderWebView: boolean): Promise<void>;
    show(): Promise<void>;
    hide(): Promise<void>;
    viewPointForFramePoint(pointJson: string): Promise<string>;
    viewQuadrilateralForFrameQuadrilateral(quadrilateralJson: string): Promise<string>;
    createView(viewJson: string): Promise<void>;
    updateView(viewJson: string): Promise<void>;
    removeView(): Promise<void>;
    registerListenerForViewEvents(): void;
    unregisterListenerForViewEvents(): void;
    subscribeDidChangeSize(): void;
    private notifyListeners;
}
