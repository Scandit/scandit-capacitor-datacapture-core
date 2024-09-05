export type Optional<T> = T | null;
export interface ScanditCaptureCorePluginInterface {
    initializePlugins(): Promise<any>;
}
export { Color, Direction, MarginsWithUnit, MeasureUnit, NumberWithUnit, Orientation, Point, PointWithUnit, Quadrilateral, Rect, RectWithUnit, Size, SizeWithAspect, SizeWithUnit, SizeWithUnitAndAspect, SizingMode, Anchor, LogoStyle, ScanIntention } from 'scandit-datacapture-frameworks-core';
export { TorchSwitchControl, ZoomSwitchControl } from 'scandit-datacapture-frameworks-core';
export { NoneLocationSelection, RadiusLocationSelection, RectangularLocationSelection, LocationSelection } from 'scandit-datacapture-frameworks-core';
export { AimerViewfinder, LaserlineViewfinder, LaserlineViewfinderStyle, RectangularViewfinder, RectangularViewfinderAnimation, RectangularViewfinderLineStyle, RectangularViewfinderStyle, Viewfinder } from 'scandit-datacapture-frameworks-core';
export { Brush, NoViewfinder } from 'scandit-datacapture-frameworks-core';
export { Camera, CameraSettings, CameraPosition, FocusGestureStrategy, FocusRange, FrameData, FrameSource, FrameSourceState, FrameSourceListener, ImageFrameSource, TorchState, VideoResolution, ImageBuffer } from 'scandit-datacapture-frameworks-core';
export { Feedback, Sound, Vibration } from 'scandit-datacapture-frameworks-core';
export { DataCaptureContext, DataCaptureContextSettings, DataCaptureContextCreationOptions, DataCaptureMode, DataCaptureContextListener, ContextStatus, DataCaptureComponent } from 'scandit-datacapture-frameworks-core';
export { DataCaptureView, HTMLElementState } from './ts/DataCaptureView';
export { SwipeToZoom, TapToFocus, FocusGesture, ZoomGesture } from 'scandit-datacapture-frameworks-core';
export { DataCaptureVersion, } from './ts/DataCaptureVersion';
export { VolumeButtonObserver, } from './ts/VolumeButtonObserver';
