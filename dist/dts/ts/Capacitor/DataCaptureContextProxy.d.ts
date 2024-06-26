import { BaseNativeProxy, DataCaptureContextProxy } from 'scandit-datacapture-frameworks-core';
declare type DataCaptureContext = any;
export declare class NativeDataCaptureContextProxy extends BaseNativeProxy implements DataCaptureContextProxy {
    get framework(): string;
    get frameworkVersion(): string;
    contextFromJSON(context: DataCaptureContext): Promise<void>;
    updateContextFromJSON(context: DataCaptureContext): Promise<void>;
    addModeToContext(modeJson: string): Promise<void>;
    removeModeFromContext(modeJson: string): Promise<void>;
    removeAllModesFromContext(): Promise<void>;
    dispose(): void;
    registerListenerForDataCaptureContext(): void;
    unregisterListenerForDataCaptureContext(): Promise<void>;
    subscribeDidChangeStatus(): void;
    subscribeDidStartObservingContext(): void;
    private notifyListeners;
}
export {};
