import { DataCaptureContext, MarginsWithUnit, PointWithUnit, LogoStyle, Anchor, FocusGesture, ZoomGesture, Rect, DataCaptureOverlay, DataCaptureViewListener, Point, Quadrilateral, Control, CoreDefaults, NativeCaller } from './core';
export { AimerViewfinder, Anchor, Brush, Camera, CameraPosition, CameraSettings, CameraSwitchControl, ClusteringMode, Color, ContextStatus, Control, DataCaptureComponent, DataCaptureContext, DataCaptureContextCreationOptions, DataCaptureContextListener, DataCaptureContextSettings, DataCaptureMode, DataCaptureOverlay, DataCaptureViewListener, Direction, Expiration, Feedback, FocusGesture, FocusGestureListener, FocusGestureStrategy, FocusRange, FontFamily, FrameData, FrameDataSettings, FrameDataSettingsBuilder, FrameSource, FrameSourceListener, FrameSourceState, ImageBuffer, ImageFrameSource, LaserlineViewfinder, LicenseInfo, LocationSelection, LogoStyle, MacroMode, MacroModeListener, MarginsWithUnit, MeasureUnit, NoViewfinder, NoneLocationSelection, NumberWithUnit, OpenSourceSoftwareLicenseInfo, Orientation, PinchToZoom, Point, PointWithUnit, Quadrilateral, RadiusLocationSelection, Rect, RectWithUnit, RectangularLocationSelection, RectangularViewfinder, RectangularViewfinderAnimation, RectangularViewfinderLineStyle, RectangularViewfinderStyle, ScanIntention, ScanditIcon, ScanditIconBuilder, ScanditIconShape, ScanditIconType, SelectionMode, SequenceFrameSource, Size, SizeWithAspect, SizeWithUnit, SizeWithUnitAndAspect, SizingMode, Sound, SwipeToZoom, TapToFocus, TextAlignment, TorchListener, TorchState, TorchSwitchControl, Vibration, VideoResolution, Viewfinder, ZoomGesture, ZoomGestureListener, ZoomListener, ZoomSwitchControl, ZoomSwitchOrientation } from './core';

declare class DataCaptureView {
    private baseDataCaptureView;
    private get overlays();
    get context(): DataCaptureContext | null;
    set context(context: DataCaptureContext | null);
    private _webViewContentOnTop;
    private htmlElement;
    private _htmlElementState;
    private scrollListener;
    private domObserver;
    private orientationChangeListener;
    get webViewContentOnTop(): boolean | null;
    set webViewContentOnTop(value: boolean | null);
    get scanAreaMargins(): MarginsWithUnit;
    set scanAreaMargins(newValue: MarginsWithUnit);
    get pointOfInterest(): PointWithUnit;
    set pointOfInterest(newValue: PointWithUnit);
    get logoStyle(): LogoStyle;
    set logoStyle(style: LogoStyle);
    get logoAnchor(): Anchor;
    set logoAnchor(newValue: Anchor);
    get logoOffset(): PointWithUnit;
    set logoOffset(newValue: PointWithUnit);
    get focusGesture(): FocusGesture | null;
    set focusGesture(newValue: FocusGesture | null);
    get zoomGestures(): ZoomGesture[];
    set zoomGestures(newValue: ZoomGesture[]);
    /** @deprecated Use zoomGestures instead. Will be removed in a future version. */
    get zoomGesture(): ZoomGesture | null;
    /** @deprecated Use zoomGestures instead. Will be removed in a future version. */
    set zoomGesture(newValue: ZoomGesture | null);
    get shouldShowZoomNotification(): boolean;
    set shouldShowZoomNotification(newValue: boolean);
    setProperty<T>(name: string, value: T): void;
    private set htmlElementState(value);
    private get htmlElementState();
    static forContext(context: Optional<DataCaptureContext>): DataCaptureView;
    constructor();
    connectToElement(element: HTMLElement): void;
    detachFromElement(): void;
    setFrame(frame: Rect, isUnderContent?: boolean): Promise<void>;
    show(): Promise<void>;
    hide(): Promise<void>;
    addOverlay(overlay: DataCaptureOverlay): Promise<void>;
    removeOverlay(overlay: DataCaptureOverlay): Promise<void>;
    addListener(listener: DataCaptureViewListener): void;
    removeListener(listener: DataCaptureViewListener): void;
    viewPointForFramePoint(point: Point): Promise<Point>;
    viewQuadrilateralForFrameQuadrilateral(quadrilateral: Quadrilateral): Promise<Quadrilateral>;
    addControl(control: Control): Promise<void>;
    addControlWithAnchorAndOffset(control: Control, anchor: Anchor, offset: PointWithUnit): void;
    removeControl(control: Control): void;
    private subscribeToChangesOnHTMLElement;
    private unsubscribeFromChangesOnHTMLElement;
    private elementDidChange;
    private updatePositionAndSize;
    private _show;
    private _hide;
    private toJSON;
}

declare class DataCaptureVersion {
    static get pluginVersion(): string;
}

declare class VolumeButtonObserver {
    private didChangeVolume;
    private proxy;
    constructor(didChangeVolume: () => void);
    dispose(): void;
    private initialize;
}

type Optional<T> = T | null;
interface ScanditCaptureCorePluginInterface {
    initializePlugins(): Promise<any>;
}

declare class ScanditCaptureCorePluginImplementation implements ScanditCaptureCorePluginInterface {
    initializePlugins(): Promise<any>;
}
declare const ScanditCaptureCorePlugin: ScanditCaptureCorePluginImplementation;

declare const Capacitor: {
    pluginName: string;
    defaults: CoreDefaults;
    exec: (success: Optional<Function>, error: Optional<Function>, functionName: string, args: Optional<[
        any
    ]>) => void;
};
declare class CapacitorNativeCaller implements NativeCaller {
    private pluginName;
    constructor(pluginName: string);
    get framework(): string;
    get frameworkVersion(): string;
    callFn(fnName: string, args: object | undefined | null, _meta?: {
        isEventRegistration?: boolean;
    }): Promise<any>;
    registerEvent(evName: string, handler: (args: any) => Promise<void>): Promise<any>;
    unregisterEvent(_evName: string, subscription: any): Promise<void>;
    eventHook(ev: any): any;
}

interface BlockingModeListenerResult {
    enabled: boolean;
}
declare const capacitorExec: (successCallback: Optional<Function>, errorCallback: Optional<Function>, pluginName: string, functionName: string, args: Optional<[
    any
]>) => void;
declare const doReturnWithFinish: (finishCallbackID: string, result: any) => any;

export { Capacitor as CapacitorCore, CapacitorNativeCaller, DataCaptureVersion, DataCaptureView, ScanditCaptureCorePlugin, ScanditCaptureCorePluginImplementation, VolumeButtonObserver, capacitorExec, doReturnWithFinish };
export type { BlockingModeListenerResult, Optional, ScanditCaptureCorePluginInterface };
