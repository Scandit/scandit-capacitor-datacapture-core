import { CoreDefaults, NativeCaller } from 'scandit-datacapture-frameworks-core';
import { Optional } from '../../definitions';
export declare enum CapacitorFunction {
    GetDefaults = "getDefaults",
    ContextFromJSON = "contextFromJSON",
    DisposeContext = "disposeContext",
    UpdateContextFromJSON = "updateContextFromJSON",
    SubscribeContextListener = "subscribeContextListener",
    UnsubscribeContextListener = "unsubscribeContextListener",
    SetViewPositionAndSize = "setViewPositionAndSize",
    ShowView = "showView",
    HideView = "hideView",
    ViewPointForFramePoint = "viewPointForFramePoint",
    ViewQuadrilateralForFrameQuadrilateral = "viewQuadrilateralForFrameQuadrilateral",
    SubscribeViewListener = "subscribeViewListener",
    UnsubscribeViewListener = "unsubscribeViewListener",
    GetCurrentCameraState = "getCurrentCameraState",
    GetIsTorchAvailable = "getIsTorchAvailable",
    RegisterListenerForCameraEvents = "registerListenerForCameraEvents",
    UnregisterListenerForCameraEvents = "unregisterListenerForCameraEvents",
    SwitchCameraToDesiredState = "switchCameraToDesiredState",
    GetFrame = "getFrame",
    EmitFeedback = "emitFeedback",
    SubscribeVolumeButtonObserver = "subscribeVolumeButtonObserver",
    UnsubscribeVolumeButtonObserver = "unsubscribeVolumeButtonObserver",
    AddModeToContext = "addModeToContext",
    RemoveModeFromContext = "removeModeFromContext",
    RemoveAllModesFromContext = "removeAllModesFromContext",
    CreateDataCaptureView = "createDataCaptureView",
    UpdateDataCaptureView = "updateDataCaptureView",
    RemoveDataCaptureView = "removeDataCaptureView",
    GetOpenSourceSoftwareLicenseInfo = "getOpenSourceSoftwareLicenseInfo"
}
export interface CapacitorWindow extends Window {
    Scandit: any;
    Capacitor: any;
}
export declare const pluginName = "ScanditCaptureCoreNative";
export declare const Capacitor: {
    pluginName: string;
    defaults: CoreDefaults;
    exec: (success: Optional<Function>, error: Optional<Function>, functionName: string, args: Optional<[
        any
    ]>) => void;
};
export declare const getDefaults: () => Promise<CoreDefaults>;
export declare class CapacitorNativeCaller implements NativeCaller {
    private pluginName;
    constructor(pluginName: string);
    callFn(fnName: string, args: object | undefined | null): Promise<any>;
    registerEvent(evName: string, handler: (args: any) => Promise<void>): Promise<any>;
    unregisterEvent(_evName: string, subscription: any): Promise<void>;
}
export declare const capacitorCoreNativeCaller: CapacitorNativeCaller;
