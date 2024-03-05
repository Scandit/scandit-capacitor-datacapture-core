import { CameraPosition, ImageFrameSourceProxy, FrameSourceState } from 'scandit-datacapture-frameworks-core';
export declare class NativeImageFrameSourceProxy implements ImageFrameSourceProxy {
    private eventEmitter;
    private didChangeState;
    constructor();
    getCurrentCameraState(position: CameraPosition): Promise<FrameSourceState>;
    registerListenerForEvents(): void;
    unregisterListenerForEvents(): void;
    subscribeDidChangeState(): void;
    unsubscribeDidChangeState(): void;
    private notifyListeners;
}
