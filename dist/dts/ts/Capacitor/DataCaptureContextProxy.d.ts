import { DataCaptureContextProxy } from 'scandit-datacapture-frameworks-core';
declare type DataCaptureContext = any;
export declare class NativeDataCaptureContextProxy implements DataCaptureContextProxy {
    private eventEmitter;
    constructor();
    contextFromJSON(context: DataCaptureContext): Promise<void>;
    updateContextFromJSON(context: DataCaptureContext): Promise<void>;
    dispose(): void;
    registerListenerForEvents(): void;
    unsubscribeListener(): void;
    subscribeDidChangeStatus(): void;
    subscribeDidStartObservingContext(): void;
    private notifyListeners;
}
export {};
