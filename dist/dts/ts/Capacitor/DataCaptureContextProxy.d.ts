import { BaseNativeProxy, DataCaptureContextProxy, NativeCallResult } from 'scandit-datacapture-frameworks-core';
export declare class NativeDataCaptureContextProxy extends BaseNativeProxy implements DataCaptureContextProxy {
    get framework(): string;
    get frameworkVersion(): string;
    contextFromJSON(contextJson: string): Promise<NativeCallResult>;
    updateContextFromJSON(contextJson: string): Promise<void>;
    addModeToContext(modeJson: string): Promise<void>;
    removeModeFromContext(modeJson: string): Promise<void>;
    removeAllModesFromContext(): Promise<void>;
    dispose(): void;
    registerListenerForDataCaptureContext(): void;
    unregisterListenerForDataCaptureContext(): Promise<void>;
    subscribeDidChangeStatus(): void;
    subscribeDidStartObservingContext(): void;
    getOpenSourceSoftwareLicenseInfo(): Promise<NativeCallResult>;
    private notifyListeners;
}
