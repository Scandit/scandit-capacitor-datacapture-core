import { Capacitor } from './Capacitor/Capacitor';
import { DefaultSerializeable } from './Serializeable';
export var FrameSourceState;
(function (FrameSourceState) {
    FrameSourceState["On"] = "on";
    FrameSourceState["Off"] = "off";
    FrameSourceState["Starting"] = "starting";
    FrameSourceState["Stopping"] = "stopping";
    FrameSourceState["Standby"] = "standby";
    FrameSourceState["BootingUp"] = "bootingUp";
    FrameSourceState["WakingUp"] = "wakingUp";
    FrameSourceState["GoingToSleep"] = "goingToSleep";
    FrameSourceState["ShuttingDown"] = "shuttingDown";
})(FrameSourceState || (FrameSourceState = {}));
export var TorchState;
(function (TorchState) {
    TorchState["On"] = "on";
    TorchState["Off"] = "off";
    TorchState["Auto"] = "auto";
})(TorchState || (TorchState = {}));
export var CameraPosition;
(function (CameraPosition) {
    CameraPosition["WorldFacing"] = "worldFacing";
    CameraPosition["UserFacing"] = "userFacing";
    CameraPosition["Unspecified"] = "unspecified";
})(CameraPosition || (CameraPosition = {}));
export var VideoResolution;
(function (VideoResolution) {
    VideoResolution["Auto"] = "auto";
    VideoResolution["HD"] = "hd";
    VideoResolution["FullHD"] = "fullHd";
    VideoResolution["UHD4K"] = "uhd4k";
})(VideoResolution || (VideoResolution = {}));
export var FocusRange;
(function (FocusRange) {
    FocusRange["Full"] = "full";
    FocusRange["Near"] = "near";
    FocusRange["Far"] = "far";
})(FocusRange || (FocusRange = {}));
export var FocusGestureStrategy;
(function (FocusGestureStrategy) {
    FocusGestureStrategy["None"] = "none";
    FocusGestureStrategy["Manual"] = "manual";
    FocusGestureStrategy["ManualUntilCapture"] = "manualUntilCapture";
    FocusGestureStrategy["AutoOnLocation"] = "autoOnLocation";
})(FocusGestureStrategy || (FocusGestureStrategy = {}));
var PrivateCameraProperty;
(function (PrivateCameraProperty) {
    PrivateCameraProperty["CameraAPI"] = "api";
})(PrivateCameraProperty || (PrivateCameraProperty = {}));
export class CameraSettings extends DefaultSerializeable {
    constructor(settings) {
        super();
        this.preferredResolution = Capacitor.defaults.Camera.Settings.preferredResolution;
        this.zoomFactor = Capacitor.defaults.Camera.Settings.zoomFactor;
        this.zoomGestureZoomFactor = Capacitor.defaults.Camera.Settings.zoomGestureZoomFactor;
        this.api = 0;
        this.focus = {
            range: Capacitor.defaults.Camera.Settings.focusRange,
            focusGestureStrategy: Capacitor.defaults.Camera.Settings.focusGestureStrategy,
            shouldPreferSmoothAutoFocus: Capacitor.defaults.Camera.Settings.shouldPreferSmoothAutoFocus,
        };
        if (settings !== undefined && settings !== null) {
            Object.getOwnPropertyNames(settings).forEach(propertyName => {
                this[propertyName] = settings[propertyName];
            });
        }
    }
    get focusRange() {
        return this.focus.range;
    }
    set focusRange(newRange) {
        this.focus.range = newRange;
    }
    get focusGestureStrategy() {
        return this.focus.focusGestureStrategy;
    }
    set focusGestureStrategy(newStrategy) {
        this.focus.focusGestureStrategy = newStrategy;
    }
    get shouldPreferSmoothAutoFocus() {
        return this.focus.shouldPreferSmoothAutoFocus;
    }
    set shouldPreferSmoothAutoFocus(newShouldPreferSmoothAutoFocus) {
        this.focus.shouldPreferSmoothAutoFocus = newShouldPreferSmoothAutoFocus;
    }
    static fromJSON(json) {
        const settings = new CameraSettings();
        settings.preferredResolution = json.preferredResolution;
        settings.zoomFactor = json.zoomFactor;
        settings.focusRange = json.focusRange;
        settings.zoomGestureZoomFactor = json.zoomGestureZoomFactor;
        settings.focusGestureStrategy = json.focusGestureStrategy;
        settings.shouldPreferSmoothAutoFocus = json.shouldPreferSmoothAutoFocus;
        if (json.api !== undefined && json.api !== null) {
            settings.api = json.api;
        }
        return settings;
    }
    setProperty(name, value) {
        this[name] = value;
    }
    getProperty(name) {
        return this[name];
    }
}
export class ImageBuffer {
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    get data() {
        return this._data;
    }
}
export class PrivateFrameData {
    get imageBuffers() {
        return this._imageBuffers;
    }
    get orientation() {
        return this._orientation;
    }
    static fromJSON(json) {
        const frameData = new PrivateFrameData();
        frameData._imageBuffers = json.imageBuffers.map((imageBufferJSON) => {
            const imageBuffer = new ImageBuffer();
            imageBuffer._width = imageBufferJSON.width;
            imageBuffer._height = imageBufferJSON.height;
            imageBuffer._data = imageBufferJSON.data;
            return imageBuffer;
        });
        frameData._orientation = json.orientation;
        return frameData;
    }
}
//# sourceMappingURL=Camera+Related.js.map