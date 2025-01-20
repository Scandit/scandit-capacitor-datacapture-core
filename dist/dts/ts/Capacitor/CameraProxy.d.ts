import { CameraPosition, CameraProxy, FrameSourceState } from 'scandit-datacapture-frameworks-core';
export declare class NativeCameraProxy implements CameraProxy {
    private eventEmitter;
    private didChangeState;
    constructor();
    getFrame(frameId: string): Promise<string | null>;
    getCurrentCameraState(_position: CameraPosition): Promise<FrameSourceState>;
    isTorchAvailable(position: CameraPosition): Promise<boolean>;
    switchCameraToDesiredState(desiredStateJson: string): Promise<void>;
    registerListenerForCameraEvents(): void;
    unregisterListenerForCameraEvents(): Promise<void>;
    subscribeDidChangeState(): void;
    private notifyListeners;
}
