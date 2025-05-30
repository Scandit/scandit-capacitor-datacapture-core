import { CameraPosition, ImageFrameSourceProxy, NativeCallResult } from 'scandit-datacapture-frameworks-core';
export declare class NativeImageFrameSourceProxy implements ImageFrameSourceProxy {
    private eventEmitter;
    private didChangeState;
    constructor();
    getCurrentCameraState(position: CameraPosition): Promise<NativeCallResult>;
    switchCameraToDesiredState(desiredStateJson: string): Promise<void>;
    registerListenerForEvents(): void;
    unregisterListenerForEvents(): void;
    subscribeDidChangeState(): void;
    private notifyListeners;
}
