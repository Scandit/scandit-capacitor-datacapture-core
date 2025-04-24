import { DataCaptureViewProxy, BaseNativeProxy, NativeCallResult } from 'scandit-datacapture-frameworks-core';
export declare class NativeDataCaptureViewProxy extends BaseNativeProxy implements DataCaptureViewProxy {
    setPositionAndSize(top: number, left: number, width: number, height: number, shouldBeUnderWebView: boolean): Promise<void>;
    show(): Promise<void>;
    hide(): Promise<void>;
    viewPointForFramePoint(pointJson: string): Promise<NativeCallResult>;
    viewQuadrilateralForFrameQuadrilateral(quadrilateralJson: string): Promise<NativeCallResult>;
    createView(viewJson: string): Promise<void>;
    updateView(viewJson: string): Promise<void>;
    removeView(): Promise<void>;
    registerListenerForViewEvents(): void;
    unregisterListenerForViewEvents(): void;
    subscribeDidChangeSize(): void;
    private notifyListeners;
}
