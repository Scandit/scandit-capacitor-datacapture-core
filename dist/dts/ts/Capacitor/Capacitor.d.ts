import { CoreDefaults } from 'scandit-datacapture-frameworks-core';
import { Optional } from '../../definitions';
export declare enum CapacitorFunction {
    GetDefaults = "getDefaults",
    ContextFromJSON = "contextFromJSON",
    DisposeContext = "disposeContext",
    UpdateContextFromJSON = "updateContextFromJSON",
    SubscribeContextListener = "subscribeContextListener",
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
    GetLastFrame = "getLastFrame",
    GetLastFrameOrNull = "getLastFrameOrNull",
    EmitFeedback = "emitFeedback",
    SubscribeVolumeButtonObserver = "subscribeVolumeButtonObserver",
    UnsubscribeVolumeButtonObserver = "unsubscribeVolumeButtonObserver",
    AddModeToContext = "addModeToContext",
    RemoveModeFromContext = "removeModeFromContext",
    RemoveAllModesFromContext = "removeAllModesFromContext",
    CreateDataCaptureView = "createDataCaptureView",
    UpdateDataCaptureView = "updateDataCaptureView",
    AddOverlay = "addOverlay",
    RemoveOverlay = "removeOverlay",
    RemoveAllOverlays = "removeAllOverlays"
}
export interface CapacitorWindow extends Window {
    Scandit: any;
    Capacitor: any;
}
export declare const pluginName = "ScanditCaptureCoreNative";
export declare const Capacitor: {
    pluginName: string;
    defaults: CoreDefaults;
    exec: (success: Optional<Function>, error: Optional<Function>, functionName: string, args: Optional<[any]>) => void;
};
export declare const getDefaults: () => Promise<CoreDefaults>;
