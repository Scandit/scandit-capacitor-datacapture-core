import { DataCaptureViewProxy, BaseNativeProxy, NativeCallResult } from 'scandit-datacapture-frameworks-core';
export declare class NativeDataCaptureViewProxy extends BaseNativeProxy implements DataCaptureViewProxy {
    setPositionAndSize(top: number, left: number, width: number, height: number, shouldBeUnderWebView: boolean): Promise<void>;
    show(): Promise<void>;
    hide(): Promise<void>;
    viewPointForFramePoint({ viewId, pointJson }: {
        viewId: number;
        pointJson: string;
    }): Promise<NativeCallResult>;
    viewQuadrilateralForFrameQuadrilateral({ viewId, quadrilateralJson }: {
        viewId: number;
        quadrilateralJson: string;
    }): Promise<NativeCallResult>;
    createView(viewJson: string): Promise<void>;
    updateView(viewJson: string): Promise<void>;
    removeView(viewId: number): Promise<void>;
    registerListenerForViewEvents(viewId: number): void;
    unregisterListenerForViewEvents(viewId: number): void;
    subscribeDidChangeSize(): void;
    private notifyListeners;
}
