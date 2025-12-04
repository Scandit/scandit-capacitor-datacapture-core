import { HTMLElementState, BaseDataCaptureView, HtmlElementPosition, HtmlElementSize, ignoreFromSerialization, loadCoreDefaults, getCoreDefaults, BaseNativeProxy, DataCaptureViewEvents, FactoryMaker, FrameSourceListenerEvents, createNativeProxy, Feedback, Camera, Color, DataCaptureContext, DataCaptureContextSettings, MarginsWithUnit, NumberWithUnit, Point, PointWithUnit, Quadrilateral, RadiusLocationSelection, Rect, RectWithUnit, RectangularLocationSelection, Size, SizeWithAspect, SizeWithUnit, SizeWithUnitAndAspect, Brush, RectangularViewfinder, RectangularViewfinderAnimation, RectangularViewfinderLineStyle, RectangularViewfinderStyle, AimerViewfinder, CameraPosition, CameraSettings, FrameDataSettings, FrameDataSettingsBuilder, FrameSourceState, TorchState, VideoResolution, FocusRange, FocusGestureStrategy, Anchor, TorchSwitchControl, ZoomSwitchControl, TapToFocus, SwipeToZoom, Direction, Orientation, MeasureUnit, NoneLocationSelection, SizingMode, Sound, NoViewfinder, Vibration, LicenseInfo, ImageFrameSource, OpenSourceSoftwareLicenseInfo } from './core.js';
export { ContextStatus, ImageBuffer, LaserlineViewfinder, LogoStyle, ScanIntention } from './core.js';

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol */


function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

class DataCaptureView {
    get overlays() {
        return this.baseDataCaptureView.overlays;
    }
    get context() {
        return this.baseDataCaptureView.context;
    }
    set context(context) {
        this.baseDataCaptureView.context = context;
    }
    get scanAreaMargins() {
        return this.baseDataCaptureView.scanAreaMargins;
    }
    set scanAreaMargins(newValue) {
        this.baseDataCaptureView.scanAreaMargins = newValue;
    }
    get pointOfInterest() {
        return this.baseDataCaptureView.pointOfInterest;
    }
    set pointOfInterest(newValue) {
        this.baseDataCaptureView.pointOfInterest = newValue;
    }
    get logoStyle() {
        return this.baseDataCaptureView.logoStyle;
    }
    set logoStyle(style) {
        this.baseDataCaptureView.logoStyle = style;
    }
    get logoAnchor() {
        return this.baseDataCaptureView.logoAnchor;
    }
    set logoAnchor(newValue) {
        this.baseDataCaptureView.logoAnchor = newValue;
    }
    get logoOffset() {
        return this.baseDataCaptureView.logoOffset;
    }
    set logoOffset(newValue) {
        this.baseDataCaptureView.logoOffset = newValue;
    }
    get focusGesture() {
        return this.baseDataCaptureView.focusGesture;
    }
    set focusGesture(newValue) {
        this.baseDataCaptureView.focusGesture = newValue;
    }
    get zoomGesture() {
        return this.baseDataCaptureView.zoomGesture;
    }
    set zoomGesture(newValue) {
        this.baseDataCaptureView.zoomGesture = newValue;
    }
    set htmlElementState(newState) {
        const didChangeShown = this._htmlElementState.isShown !== newState.isShown;
        const didChangePositionOrSize = this._htmlElementState.didChangeComparedTo(newState);
        this._htmlElementState = newState;
        if (didChangePositionOrSize) {
            this.updatePositionAndSize();
        }
        if (didChangeShown) {
            if (this._htmlElementState.isShown) {
                this._show();
            }
            else {
                this._hide();
            }
        }
    }
    get htmlElementState() {
        return this._htmlElementState;
    }
    // eslint-disable-next-line @typescript-eslint/member-ordering
    static forContext(context) {
        const view = new DataCaptureView();
        view.context = context;
        return view;
    }
    // eslint-disable-next-line @typescript-eslint/member-ordering
    constructor() {
        this.htmlElement = null;
        this._htmlElementState = new HTMLElementState();
        this.scrollListener = this.elementDidChange.bind(this);
        this.domObserver = new MutationObserver(this.elementDidChange.bind(this));
        this.orientationChangeListener = (() => {
            this.elementDidChange();
            // SDC-1784 -> workaround because at the moment of this callback the element doesn't have the updated size.
            setTimeout(this.elementDidChange.bind(this), 100);
            setTimeout(this.elementDidChange.bind(this), 300);
            setTimeout(this.elementDidChange.bind(this), 1000);
        });
        this.baseDataCaptureView = new BaseDataCaptureView(false);
    }
    connectToElement(element) {
        const viewId = (Date.now() / 1000) | 0;
        // add view to native hierarchy
        this.baseDataCaptureView.createNativeView(viewId).then(() => {
            this.htmlElement = element;
            this.htmlElementState = new HTMLElementState();
            // Initial update
            this.elementDidChange();
            this.subscribeToChangesOnHTMLElement();
        });
    }
    detachFromElement() {
        this.unsubscribeFromChangesOnHTMLElement();
        this.htmlElement = null;
        this.elementDidChange();
        // Remove view from native hierarchy
        this.baseDataCaptureView.removeNativeView();
    }
    setFrame(frame, isUnderContent = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const viewId = (Date.now() / 1000) | 0;
            yield this.baseDataCaptureView.createNativeView(viewId);
            return this.baseDataCaptureView.setFrame(frame, isUnderContent);
        });
    }
    show() {
        if (this.htmlElement) {
            throw new Error("Views should only be manually shown if they're manually sized using setFrame");
        }
        return this._show();
    }
    hide() {
        if (this.htmlElement) {
            throw new Error("Views should only be manually hidden if they're manually sized using setFrame");
        }
        return this._hide();
    }
    addOverlay(overlay) {
        this.baseDataCaptureView.addOverlay(overlay);
    }
    removeOverlay(overlay) {
        this.baseDataCaptureView.removeOverlay(overlay);
    }
    addListener(listener) {
        this.baseDataCaptureView.addListener(listener);
    }
    removeListener(listener) {
        this.baseDataCaptureView.removeListener(listener);
    }
    viewPointForFramePoint(point) {
        return this.baseDataCaptureView.viewPointForFramePoint(point);
    }
    viewQuadrilateralForFrameQuadrilateral(quadrilateral) {
        return this.baseDataCaptureView.viewQuadrilateralForFrameQuadrilateral(quadrilateral);
    }
    addControl(control) {
        this.baseDataCaptureView.addControl(control);
    }
    addControlWithAnchorAndOffset(control, anchor, offset) {
        return this.baseDataCaptureView.addControlWithAnchorAndOffset(control, anchor, offset);
    }
    removeControl(control) {
        this.baseDataCaptureView.removeControl(control);
    }
    subscribeToChangesOnHTMLElement() {
        this.domObserver.observe(document, { attributes: true, childList: true, subtree: true });
        window.addEventListener('scroll', this.scrollListener);
        window.addEventListener('orientationchange', this.orientationChangeListener);
    }
    unsubscribeFromChangesOnHTMLElement() {
        this.domObserver.disconnect();
        window.removeEventListener('scroll', this.scrollListener);
        window.removeEventListener('orientationchange', this.orientationChangeListener);
    }
    elementDidChange() {
        if (!this.htmlElement) {
            this.htmlElementState = new HTMLElementState();
            return;
        }
        const newState = new HTMLElementState();
        const boundingRect = this.htmlElement.getBoundingClientRect();
        newState.position = new HtmlElementPosition(boundingRect.top, boundingRect.left);
        newState.size = new HtmlElementSize(boundingRect.width, boundingRect.height);
        newState.shouldBeUnderContent = parseInt(this.htmlElement.style.zIndex || '1', 10) < 0
            || parseInt(getComputedStyle(this.htmlElement).zIndex || '1', 10) < 0;
        const isDisplayed = getComputedStyle(this.htmlElement).display !== 'none'
            && this.htmlElement.style.display !== 'none';
        const isInDOM = document.body.contains(this.htmlElement);
        newState.isShown = isDisplayed && isInDOM && !this.htmlElement.hidden;
        this.htmlElementState = newState;
    }
    updatePositionAndSize() {
        if (!this.htmlElementState || !this.htmlElementState.isValid) {
            return;
        }
        this.baseDataCaptureView.setPositionAndSize(this.htmlElementState.position.top, this.htmlElementState.position.left, this.htmlElementState.size.width, this.htmlElementState.size.height, this.htmlElementState.shouldBeUnderContent);
    }
    _show() {
        return this.baseDataCaptureView.show();
    }
    _hide() {
        return this.baseDataCaptureView.hide();
    }
    toJSON() {
        return this.baseDataCaptureView.toJSON();
    }
}
__decorate([
    ignoreFromSerialization
], DataCaptureView.prototype, "htmlElement", void 0);
__decorate([
    ignoreFromSerialization
], DataCaptureView.prototype, "_htmlElementState", void 0);
__decorate([
    ignoreFromSerialization
], DataCaptureView.prototype, "scrollListener", void 0);
__decorate([
    ignoreFromSerialization
], DataCaptureView.prototype, "domObserver", void 0);
__decorate([
    ignoreFromSerialization
], DataCaptureView.prototype, "orientationChangeListener", void 0);

class DataCaptureVersion {
    static get pluginVersion() {
        return '7.5.2';
    }
}

class CapacitorError {
    static fromJSON(json) {
        if (json && json.code && json.message) {
            return new CapacitorError(json.code, json.message);
        }
        else {
            return null;
        }
    }
    constructor(code, message) {
        this.code = code;
        this.message = message;
    }
}
const capacitorExec = (successCallback, errorCallback, pluginName, functionName, args) => {
    if (window.Scandit && window.Scandit.DEBUG) {
        // tslint:disable-next-line:no-console
        console.log(`Called native function: ${functionName}`, args, { success: successCallback, error: errorCallback });
    }
    const extendedSuccessCallback = (message) => {
        const shouldCallback = message && message.shouldNotifyWhenFinished;
        const finishCallbackID = shouldCallback ? message.finishCallbackID : null;
        const started = Date.now();
        let callbackResult;
        if (successCallback) {
            callbackResult = successCallback(message);
        }
        if (shouldCallback) {
            const maxCallbackDuration = 50;
            const callbackDuration = Date.now() - started;
            if (callbackDuration > maxCallbackDuration) {
                // tslint:disable-next-line:no-console
                console.log(`[SCANDIT WARNING] Took ${callbackDuration}ms to execute callback that's blocking native execution. You should keep this duration short, for more information, take a look at the documentation.`);
            }
            window.Capacitor.Plugins[pluginName].finishCallback([{
                    finishCallbackID,
                    result: callbackResult,
                }]);
        }
    };
    const extendedErrorCallback = (error) => {
        if (errorCallback) {
            const capacitorError = CapacitorError.fromJSON(error);
            if (capacitorError !== null) {
                error = capacitorError;
            }
            errorCallback(error);
        }
    };
    window.Capacitor.Plugins[pluginName][functionName](args).then(extendedSuccessCallback, extendedErrorCallback);
};
const doReturnWithFinish = (finishCallbackID, result) => {
    if (window.Capacitor.Plugins.ScanditBarcodeNative) {
        window.Capacitor.Plugins.ScanditBarcodeNative.finishCallback({ result: Object.assign({ finishCallbackID }, result) });
    }
    else if (window.Capacitor.Plugins.ScanditIdNative) {
        window.Capacitor.Plugins.ScanditIdNative.finishCallback({ result: Object.assign({ finishCallbackID }, result) });
    }
    return result;
};

var CapacitorFunction;
(function (CapacitorFunction) {
    CapacitorFunction["GetDefaults"] = "getDefaults";
    CapacitorFunction["SetViewPositionAndSize"] = "setViewPositionAndSize";
    CapacitorFunction["ShowView"] = "showView";
    CapacitorFunction["HideView"] = "hideView";
    CapacitorFunction["ViewPointForFramePoint"] = "viewPointForFramePoint";
    CapacitorFunction["ViewQuadrilateralForFrameQuadrilateral"] = "viewQuadrilateralForFrameQuadrilateral";
    CapacitorFunction["SubscribeViewListener"] = "subscribeViewListener";
    CapacitorFunction["UnsubscribeViewListener"] = "unsubscribeViewListener";
    CapacitorFunction["GetCurrentCameraState"] = "getCurrentCameraState";
    CapacitorFunction["GetIsTorchAvailable"] = "getIsTorchAvailable";
    CapacitorFunction["RegisterListenerForCameraEvents"] = "registerListenerForCameraEvents";
    CapacitorFunction["UnregisterListenerForCameraEvents"] = "unregisterListenerForCameraEvents";
    CapacitorFunction["SwitchCameraToDesiredState"] = "switchCameraToDesiredState";
    CapacitorFunction["GetFrame"] = "getFrame";
    CapacitorFunction["EmitFeedback"] = "emitFeedback";
    CapacitorFunction["SubscribeVolumeButtonObserver"] = "subscribeVolumeButtonObserver";
    CapacitorFunction["UnsubscribeVolumeButtonObserver"] = "unsubscribeVolumeButtonObserver";
    CapacitorFunction["CreateDataCaptureView"] = "createDataCaptureView";
    CapacitorFunction["UpdateDataCaptureView"] = "updateDataCaptureView";
    CapacitorFunction["RemoveDataCaptureView"] = "removeDataCaptureView";
})(CapacitorFunction || (CapacitorFunction = {}));
const pluginName = 'ScanditCaptureCoreNative';
// tslint:disable-next-line:variable-name
const Capacitor$1 = {
    pluginName,
    defaults: {},
    exec: (success, error, functionName, args) => capacitorExec(success, error, pluginName, functionName, args),
};
const getDefaults = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const defaultsJson = yield window.Capacitor.Plugins[pluginName][CapacitorFunction.GetDefaults]();
        loadCoreDefaults(defaultsJson);
        Capacitor$1.defaults = getCoreDefaults();
    }
    catch (error) {
        // tslint:disable-next-line:no-console
        console.warn(error);
    }
    return Capacitor$1.defaults;
});
class CapacitorNativeCaller {
    constructor(pluginName) {
        this.pluginName = pluginName;
    }
    get framework() {
        return 'capacitor';
    }
    get frameworkVersion() {
        return (() => Capacitor$1.defaults.capacitorVersion)();
    }
    callFn(fnName, args) {
        return window.Capacitor.Plugins[this.pluginName][fnName](args);
    }
    registerEvent(evName, handler) {
        return window.Capacitor.Plugins[this.pluginName]
            .addListener(evName, handler);
    }
    unregisterEvent(_evName, subscription) {
        return __awaiter(this, void 0, void 0, function* () {
            if (subscription) {
                yield subscription.remove();
            }
        });
    }
    eventHook(ev) {
        return ev;
    }
}
const capacitorCoreNativeCaller = new CapacitorNativeCaller(Capacitor$1.pluginName);

var VolumeButtonObserverEvent;
(function (VolumeButtonObserverEvent) {
    VolumeButtonObserverEvent["DidChangeVolume"] = "didChangeVolume";
})(VolumeButtonObserverEvent || (VolumeButtonObserverEvent = {}));
class VolumeButtonObserverProxy {
    static forVolumeButtonObserver(volumeButtonObserver) {
        const proxy = new VolumeButtonObserverProxy();
        proxy.volumeButtonObserver = volumeButtonObserver;
        proxy.subscribe();
        return proxy;
    }
    dispose() {
        this.unsubscribe();
    }
    subscribe() {
        this.subscriber = window.Capacitor.Plugins[Capacitor$1.pluginName]
            .addListener(VolumeButtonObserverEvent.DidChangeVolume, this.notifyListeners.bind(this));
    }
    unsubscribe() {
        this.subscriber.remove();
    }
    notifyListeners(event) {
        if (!event) {
            // The event could be undefined/null in case the plugin result did not pass a "message",
            // which could happen e.g. in case of "ok" results, which could signal e.g. successful
            // listener subscriptions.
            return doReturnWithFinish('', null);
        }
        if (this.volumeButtonObserver.didChangeVolume && event.name === VolumeButtonObserverEvent.DidChangeVolume) {
            this.volumeButtonObserver.didChangeVolume();
            return doReturnWithFinish(event.name, null);
        }
    }
}

class VolumeButtonObserver {
    constructor(didChangeVolume) {
        this.didChangeVolume = didChangeVolume;
        this.initialize();
    }
    dispose() {
        if (this.proxy) {
            this.proxy.dispose();
            this.proxy = null;
            this.didChangeVolume = null;
        }
    }
    initialize() {
        if (!this.proxy) {
            this.proxy = VolumeButtonObserverProxy.forVolumeButtonObserver(this);
        }
    }
}

/*! Capacitor: https://capacitorjs.com/ - MIT License */
const createCapacitorPlatforms = (win) => {
    const defaultPlatformMap = new Map();
    defaultPlatformMap.set('web', { name: 'web' });
    const capPlatforms = win.CapacitorPlatforms || {
        currentPlatform: { name: 'web' },
        platforms: defaultPlatformMap,
    };
    const addPlatform = (name, platform) => {
        capPlatforms.platforms.set(name, platform);
    };
    const setPlatform = (name) => {
        if (capPlatforms.platforms.has(name)) {
            capPlatforms.currentPlatform = capPlatforms.platforms.get(name);
        }
    };
    capPlatforms.addPlatform = addPlatform;
    capPlatforms.setPlatform = setPlatform;
    return capPlatforms;
};
const initPlatforms = (win) => (win.CapacitorPlatforms = createCapacitorPlatforms(win));
/**
 * @deprecated Set `CapacitorCustomPlatform` on the window object prior to runtime executing in the web app instead
 */
const CapacitorPlatforms = /*#__PURE__*/ initPlatforms((typeof globalThis !== 'undefined'
    ? globalThis
    : typeof self !== 'undefined'
        ? self
        : typeof window !== 'undefined'
            ? window
            : typeof global !== 'undefined'
                ? global
                : {}));
/**
 * @deprecated Set `CapacitorCustomPlatform` on the window object prior to runtime executing in the web app instead
 */
CapacitorPlatforms.addPlatform;
/**
 * @deprecated Set `CapacitorCustomPlatform` on the window object prior to runtime executing in the web app instead
 */
CapacitorPlatforms.setPlatform;

var ExceptionCode;
(function (ExceptionCode) {
    /**
     * API is not implemented.
     *
     * This usually means the API can't be used because it is not implemented for
     * the current platform.
     */
    ExceptionCode["Unimplemented"] = "UNIMPLEMENTED";
    /**
     * API is not available.
     *
     * This means the API can't be used right now because:
     *   - it is currently missing a prerequisite, such as network connectivity
     *   - it requires a particular platform or browser version
     */
    ExceptionCode["Unavailable"] = "UNAVAILABLE";
})(ExceptionCode || (ExceptionCode = {}));
class CapacitorException extends Error {
    constructor(message, code, data) {
        super(message);
        this.message = message;
        this.code = code;
        this.data = data;
    }
}
const getPlatformId = (win) => {
    var _a, _b;
    if (win === null || win === void 0 ? void 0 : win.androidBridge) {
        return 'android';
    }
    else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
        return 'ios';
    }
    else {
        return 'web';
    }
};

const createCapacitor = (win) => {
    var _a, _b, _c, _d, _e;
    const capCustomPlatform = win.CapacitorCustomPlatform || null;
    const cap = win.Capacitor || {};
    const Plugins = (cap.Plugins = cap.Plugins || {});
    /**
     * @deprecated Use `capCustomPlatform` instead, default functions like registerPlugin will function with the new object.
     */
    const capPlatforms = win.CapacitorPlatforms;
    const defaultGetPlatform = () => {
        return capCustomPlatform !== null
            ? capCustomPlatform.name
            : getPlatformId(win);
    };
    const getPlatform = ((_a = capPlatforms === null || capPlatforms === void 0 ? void 0 : capPlatforms.currentPlatform) === null || _a === void 0 ? void 0 : _a.getPlatform) || defaultGetPlatform;
    const defaultIsNativePlatform = () => getPlatform() !== 'web';
    const isNativePlatform = ((_b = capPlatforms === null || capPlatforms === void 0 ? void 0 : capPlatforms.currentPlatform) === null || _b === void 0 ? void 0 : _b.isNativePlatform) || defaultIsNativePlatform;
    const defaultIsPluginAvailable = (pluginName) => {
        const plugin = registeredPlugins.get(pluginName);
        if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
            // JS implementation available for the current platform.
            return true;
        }
        if (getPluginHeader(pluginName)) {
            // Native implementation available.
            return true;
        }
        return false;
    };
    const isPluginAvailable = ((_c = capPlatforms === null || capPlatforms === void 0 ? void 0 : capPlatforms.currentPlatform) === null || _c === void 0 ? void 0 : _c.isPluginAvailable) ||
        defaultIsPluginAvailable;
    const defaultGetPluginHeader = (pluginName) => { var _a; return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find(h => h.name === pluginName); };
    const getPluginHeader = ((_d = capPlatforms === null || capPlatforms === void 0 ? void 0 : capPlatforms.currentPlatform) === null || _d === void 0 ? void 0 : _d.getPluginHeader) || defaultGetPluginHeader;
    const handleError = (err) => win.console.error(err);
    const pluginMethodNoop = (_target, prop, pluginName) => {
        return Promise.reject(`${pluginName} does not have an implementation of "${prop}".`);
    };
    const registeredPlugins = new Map();
    const defaultRegisterPlugin = (pluginName, jsImplementations = {}) => {
        const registeredPlugin = registeredPlugins.get(pluginName);
        if (registeredPlugin) {
            console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
            return registeredPlugin.proxy;
        }
        const platform = getPlatform();
        const pluginHeader = getPluginHeader(pluginName);
        let jsImplementation;
        const loadPluginImplementation = async () => {
            if (!jsImplementation && platform in jsImplementations) {
                jsImplementation =
                    typeof jsImplementations[platform] === 'function'
                        ? (jsImplementation = await jsImplementations[platform]())
                        : (jsImplementation = jsImplementations[platform]);
            }
            else if (capCustomPlatform !== null &&
                !jsImplementation &&
                'web' in jsImplementations) {
                jsImplementation =
                    typeof jsImplementations['web'] === 'function'
                        ? (jsImplementation = await jsImplementations['web']())
                        : (jsImplementation = jsImplementations['web']);
            }
            return jsImplementation;
        };
        const createPluginMethod = (impl, prop) => {
            var _a, _b;
            if (pluginHeader) {
                const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find(m => prop === m.name);
                if (methodHeader) {
                    if (methodHeader.rtype === 'promise') {
                        return (options) => cap.nativePromise(pluginName, prop.toString(), options);
                    }
                    else {
                        return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
                    }
                }
                else if (impl) {
                    return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
                }
            }
            else if (impl) {
                return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
            }
            else {
                throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
            }
        };
        const createPluginMethodWrapper = (prop) => {
            let remove;
            const wrapper = (...args) => {
                const p = loadPluginImplementation().then(impl => {
                    const fn = createPluginMethod(impl, prop);
                    if (fn) {
                        const p = fn(...args);
                        remove = p === null || p === void 0 ? void 0 : p.remove;
                        return p;
                    }
                    else {
                        throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
                    }
                });
                if (prop === 'addListener') {
                    p.remove = async () => remove();
                }
                return p;
            };
            // Some flair ✨
            wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
            Object.defineProperty(wrapper, 'name', {
                value: prop,
                writable: false,
                configurable: false,
            });
            return wrapper;
        };
        const addListener = createPluginMethodWrapper('addListener');
        const removeListener = createPluginMethodWrapper('removeListener');
        const addListenerNative = (eventName, callback) => {
            const call = addListener({ eventName }, callback);
            const remove = async () => {
                const callbackId = await call;
                removeListener({
                    eventName,
                    callbackId,
                }, callback);
            };
            const p = new Promise(resolve => call.then(() => resolve({ remove })));
            p.remove = async () => {
                console.warn(`Using addListener() without 'await' is deprecated.`);
                await remove();
            };
            return p;
        };
        const proxy = new Proxy({}, {
            get(_, prop) {
                switch (prop) {
                    // https://github.com/facebook/react/issues/20030
                    case '$$typeof':
                        return undefined;
                    case 'toJSON':
                        return () => ({});
                    case 'addListener':
                        return pluginHeader ? addListenerNative : addListener;
                    case 'removeListener':
                        return removeListener;
                    default:
                        return createPluginMethodWrapper(prop);
                }
            },
        });
        Plugins[pluginName] = proxy;
        registeredPlugins.set(pluginName, {
            name: pluginName,
            proxy,
            platforms: new Set([
                ...Object.keys(jsImplementations),
                ...(pluginHeader ? [platform] : []),
            ]),
        });
        return proxy;
    };
    const registerPlugin = ((_e = capPlatforms === null || capPlatforms === void 0 ? void 0 : capPlatforms.currentPlatform) === null || _e === void 0 ? void 0 : _e.registerPlugin) || defaultRegisterPlugin;
    // Add in convertFileSrc for web, it will already be available in native context
    if (!cap.convertFileSrc) {
        cap.convertFileSrc = filePath => filePath;
    }
    cap.getPlatform = getPlatform;
    cap.handleError = handleError;
    cap.isNativePlatform = isNativePlatform;
    cap.isPluginAvailable = isPluginAvailable;
    cap.pluginMethodNoop = pluginMethodNoop;
    cap.registerPlugin = registerPlugin;
    cap.Exception = CapacitorException;
    cap.DEBUG = !!cap.DEBUG;
    cap.isLoggingEnabled = !!cap.isLoggingEnabled;
    // Deprecated props
    cap.platform = cap.getPlatform();
    cap.isNative = cap.isNativePlatform();
    return cap;
};
const initCapacitorGlobal = (win) => (win.Capacitor = createCapacitor(win));

const Capacitor = /*#__PURE__*/ initCapacitorGlobal(typeof globalThis !== 'undefined'
    ? globalThis
    : typeof self !== 'undefined'
        ? self
        : typeof window !== 'undefined'
            ? window
            : typeof global !== 'undefined'
                ? global
                : {});
const registerPlugin = Capacitor.registerPlugin;
/**
 * @deprecated Provided for backwards compatibility for Capacitor v2 plugins.
 * Capacitor v3 plugins should import the plugin directly. This "Plugins"
 * export is deprecated in v3, and will be removed in v4.
 */
Capacitor.Plugins;

/**
 * Base class web plugins should extend.
 */
class WebPlugin {
    constructor(config) {
        this.listeners = {};
        this.retainedEventArguments = {};
        this.windowListeners = {};
        if (config) {
            // TODO: add link to upgrade guide
            console.warn(`Capacitor WebPlugin "${config.name}" config object was deprecated in v3 and will be removed in v4.`);
            this.config = config;
        }
    }
    addListener(eventName, listenerFunc) {
        let firstListener = false;
        const listeners = this.listeners[eventName];
        if (!listeners) {
            this.listeners[eventName] = [];
            firstListener = true;
        }
        this.listeners[eventName].push(listenerFunc);
        // If we haven't added a window listener for this event and it requires one,
        // go ahead and add it
        const windowListener = this.windowListeners[eventName];
        if (windowListener && !windowListener.registered) {
            this.addWindowListener(windowListener);
        }
        if (firstListener) {
            this.sendRetainedArgumentsForEvent(eventName);
        }
        const remove = async () => this.removeListener(eventName, listenerFunc);
        const p = Promise.resolve({ remove });
        return p;
    }
    async removeAllListeners() {
        this.listeners = {};
        for (const listener in this.windowListeners) {
            this.removeWindowListener(this.windowListeners[listener]);
        }
        this.windowListeners = {};
    }
    notifyListeners(eventName, data, retainUntilConsumed) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
            if (retainUntilConsumed) {
                let args = this.retainedEventArguments[eventName];
                if (!args) {
                    args = [];
                }
                args.push(data);
                this.retainedEventArguments[eventName] = args;
            }
            return;
        }
        listeners.forEach(listener => listener(data));
    }
    hasListeners(eventName) {
        return !!this.listeners[eventName].length;
    }
    registerWindowListener(windowEventName, pluginEventName) {
        this.windowListeners[pluginEventName] = {
            registered: false,
            windowEventName,
            pluginEventName,
            handler: event => {
                this.notifyListeners(pluginEventName, event);
            },
        };
    }
    unimplemented(msg = 'not implemented') {
        return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
    }
    unavailable(msg = 'not available') {
        return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
    }
    async removeListener(eventName, listenerFunc) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
            return;
        }
        const index = listeners.indexOf(listenerFunc);
        this.listeners[eventName].splice(index, 1);
        // If there are no more listeners for this type of event,
        // remove the window listener
        if (!this.listeners[eventName].length) {
            this.removeWindowListener(this.windowListeners[eventName]);
        }
    }
    addWindowListener(handle) {
        window.addEventListener(handle.windowEventName, handle.handler);
        handle.registered = true;
    }
    removeWindowListener(handle) {
        if (!handle) {
            return;
        }
        window.removeEventListener(handle.windowEventName, handle.handler);
        handle.registered = false;
    }
    sendRetainedArgumentsForEvent(eventName) {
        const args = this.retainedEventArguments[eventName];
        if (!args) {
            return;
        }
        delete this.retainedEventArguments[eventName];
        args.forEach(arg => {
            this.notifyListeners(eventName, arg);
        });
    }
}
/******** END WEB VIEW PLUGIN ********/
/******** COOKIES PLUGIN ********/
/**
 * Safely web encode a string value (inspired by js-cookie)
 * @param str The string value to encode
 */
const encode = (str) => encodeURIComponent(str)
    .replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent)
    .replace(/[()]/g, escape);
/**
 * Safely web decode a string value (inspired by js-cookie)
 * @param str The string value to decode
 */
const decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
class CapacitorCookiesPluginWeb extends WebPlugin {
    async getCookies() {
        const cookies = document.cookie;
        const cookieMap = {};
        cookies.split(';').forEach(cookie => {
            if (cookie.length <= 0)
                return;
            // Replace first "=" with CAP_COOKIE to prevent splitting on additional "="
            let [key, value] = cookie.replace(/=/, 'CAP_COOKIE').split('CAP_COOKIE');
            key = decode(key).trim();
            value = decode(value).trim();
            cookieMap[key] = value;
        });
        return cookieMap;
    }
    async setCookie(options) {
        try {
            // Safely Encoded Key/Value
            const encodedKey = encode(options.key);
            const encodedValue = encode(options.value);
            // Clean & sanitize options
            const expires = `; expires=${(options.expires || '').replace('expires=', '')}`; // Default is "; expires="
            const path = (options.path || '/').replace('path=', ''); // Default is "path=/"
            const domain = options.url != null && options.url.length > 0
                ? `domain=${options.url}`
                : '';
            document.cookie = `${encodedKey}=${encodedValue || ''}${expires}; path=${path}; ${domain};`;
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    async deleteCookie(options) {
        try {
            document.cookie = `${options.key}=; Max-Age=0`;
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    async clearCookies() {
        try {
            const cookies = document.cookie.split(';') || [];
            for (const cookie of cookies) {
                document.cookie = cookie
                    .replace(/^ +/, '')
                    .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
            }
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    async clearAllCookies() {
        try {
            await this.clearCookies();
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
}
registerPlugin('CapacitorCookies', {
    web: () => new CapacitorCookiesPluginWeb(),
});
// UTILITY FUNCTIONS
/**
 * Read in a Blob value and return it as a base64 string
 * @param blob The blob value to convert to a base64 string
 */
const readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        const base64String = reader.result;
        // remove prefix "data:application/pdf;base64,"
        resolve(base64String.indexOf(',') >= 0
            ? base64String.split(',')[1]
            : base64String);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob);
});
/**
 * Normalize an HttpHeaders map by lowercasing all of the values
 * @param headers The HttpHeaders object to normalize
 */
const normalizeHttpHeaders = (headers = {}) => {
    const originalKeys = Object.keys(headers);
    const loweredKeys = Object.keys(headers).map(k => k.toLocaleLowerCase());
    const normalized = loweredKeys.reduce((acc, key, index) => {
        acc[key] = headers[originalKeys[index]];
        return acc;
    }, {});
    return normalized;
};
/**
 * Builds a string of url parameters that
 * @param params A map of url parameters
 * @param shouldEncode true if you should encodeURIComponent() the values (true by default)
 */
const buildUrlParams = (params, shouldEncode = true) => {
    if (!params)
        return null;
    const output = Object.entries(params).reduce((accumulator, entry) => {
        const [key, value] = entry;
        let encodedValue;
        let item;
        if (Array.isArray(value)) {
            item = '';
            value.forEach(str => {
                encodedValue = shouldEncode ? encodeURIComponent(str) : str;
                item += `${key}=${encodedValue}&`;
            });
            // last character will always be "&" so slice it off
            item.slice(0, -1);
        }
        else {
            encodedValue = shouldEncode ? encodeURIComponent(value) : value;
            item = `${key}=${encodedValue}`;
        }
        return `${accumulator}&${item}`;
    }, '');
    // Remove initial "&" from the reduce
    return output.substr(1);
};
/**
 * Build the RequestInit object based on the options passed into the initial request
 * @param options The Http plugin options
 * @param extra Any extra RequestInit values
 */
const buildRequestInit = (options, extra = {}) => {
    const output = Object.assign({ method: options.method || 'GET', headers: options.headers }, extra);
    // Get the content-type
    const headers = normalizeHttpHeaders(options.headers);
    const type = headers['content-type'] || '';
    // If body is already a string, then pass it through as-is.
    if (typeof options.data === 'string') {
        output.body = options.data;
    }
    // Build request initializers based off of content-type
    else if (type.includes('application/x-www-form-urlencoded')) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(options.data || {})) {
            params.set(key, value);
        }
        output.body = params.toString();
    }
    else if (type.includes('multipart/form-data') ||
        options.data instanceof FormData) {
        const form = new FormData();
        if (options.data instanceof FormData) {
            options.data.forEach((value, key) => {
                form.append(key, value);
            });
        }
        else {
            for (const key of Object.keys(options.data)) {
                form.append(key, options.data[key]);
            }
        }
        output.body = form;
        const headers = new Headers(output.headers);
        headers.delete('content-type'); // content-type will be set by `window.fetch` to includy boundary
        output.headers = headers;
    }
    else if (type.includes('application/json') ||
        typeof options.data === 'object') {
        output.body = JSON.stringify(options.data);
    }
    return output;
};
// WEB IMPLEMENTATION
class CapacitorHttpPluginWeb extends WebPlugin {
    /**
     * Perform an Http request given a set of options
     * @param options Options to build the HTTP request
     */
    async request(options) {
        const requestInit = buildRequestInit(options, options.webFetchExtra);
        const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
        const url = urlParams ? `${options.url}?${urlParams}` : options.url;
        const response = await fetch(url, requestInit);
        const contentType = response.headers.get('content-type') || '';
        // Default to 'text' responseType so no parsing happens
        let { responseType = 'text' } = response.ok ? options : {};
        // If the response content-type is json, force the response to be json
        if (contentType.includes('application/json')) {
            responseType = 'json';
        }
        let data;
        let blob;
        switch (responseType) {
            case 'arraybuffer':
            case 'blob':
                blob = await response.blob();
                data = await readBlobAsBase64(blob);
                break;
            case 'json':
                data = await response.json();
                break;
            case 'document':
            case 'text':
            default:
                data = await response.text();
        }
        // Convert fetch headers to Capacitor HttpHeaders
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });
        return {
            data,
            headers,
            status: response.status,
            url: response.url,
        };
    }
    /**
     * Perform an Http GET request given a set of options
     * @param options Options to build the HTTP request
     */
    async get(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: 'GET' }));
    }
    /**
     * Perform an Http POST request given a set of options
     * @param options Options to build the HTTP request
     */
    async post(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: 'POST' }));
    }
    /**
     * Perform an Http PUT request given a set of options
     * @param options Options to build the HTTP request
     */
    async put(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: 'PUT' }));
    }
    /**
     * Perform an Http PATCH request given a set of options
     * @param options Options to build the HTTP request
     */
    async patch(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: 'PATCH' }));
    }
    /**
     * Perform an Http DELETE request given a set of options
     * @param options Options to build the HTTP request
     */
    async delete(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: 'DELETE' }));
    }
}
registerPlugin('CapacitorHttp', {
    web: () => new CapacitorHttpPluginWeb(),
});

class NativeFeedbackProxy {
    emitFeedback(feedback) {
        return window.Capacitor.Plugins[Capacitor$1.pluginName][CapacitorFunction.EmitFeedback]({ feedback: JSON.stringify(feedback.toJSON()) });
    }
}

class NativeDataCaptureViewProxy extends BaseNativeProxy {
    setPositionAndSize(top, left, width, height, shouldBeUnderWebView) {
        return new Promise((resolve, reject) => window.Capacitor.Plugins[Capacitor$1.pluginName][CapacitorFunction.SetViewPositionAndSize]({
            position: { top, left, width, height, shouldBeUnderWebView },
        }).then(resolve.bind(this), reject.bind(this)));
    }
    show() {
        return window.Capacitor.Plugins[Capacitor$1.pluginName][CapacitorFunction.ShowView]();
    }
    hide() {
        return window.Capacitor.Plugins[Capacitor$1.pluginName][CapacitorFunction.HideView]();
    }
    viewPointForFramePoint({ viewId, pointJson }) {
        return window.Capacitor.Plugins[Capacitor$1.pluginName][CapacitorFunction.ViewPointForFramePoint]({
            viewId: viewId,
            point: pointJson,
        });
    }
    viewQuadrilateralForFrameQuadrilateral({ viewId, quadrilateralJson }) {
        return window.Capacitor.Plugins[Capacitor$1.pluginName][CapacitorFunction.ViewQuadrilateralForFrameQuadrilateral]({
            viewId: viewId,
            quadrilateral: quadrilateralJson,
        });
    }
    createView(viewJson) {
        return window.Capacitor.Plugins[Capacitor$1.pluginName][CapacitorFunction.CreateDataCaptureView]({
            viewJson: viewJson,
        });
    }
    updateView(viewJson) {
        return window.Capacitor.Plugins[Capacitor$1.pluginName][CapacitorFunction.UpdateDataCaptureView]({
            viewJson: viewJson,
        });
    }
    removeView(viewId) {
        return window.Capacitor.Plugins[Capacitor$1.pluginName][CapacitorFunction.RemoveDataCaptureView]({
            viewId: viewId,
        });
    }
    registerListenerForViewEvents(viewId) {
        window.Capacitor.Plugins[Capacitor$1.pluginName][CapacitorFunction.SubscribeViewListener]({
            viewId: viewId,
        });
    }
    unregisterListenerForViewEvents(viewId) {
        window.Capacitor.Plugins[Capacitor$1.pluginName][CapacitorFunction.UnsubscribeViewListener]({
            viewId: viewId,
        });
    }
    subscribeDidChangeSize() {
        window.Capacitor.Plugins[Capacitor$1.pluginName]
            .addListener(DataCaptureViewEvents.didChangeSize, this.notifyListeners.bind(this));
    }
    notifyListeners(event) {
        if (!event) {
            // The event could be undefined/null in case the plugin result did not pass a "message",
            // which could happen e.g. in case of "ok" results, which could signal e.g. successful
            // listener subscriptions.
            return;
        }
        switch (event.name) {
            case DataCaptureViewEvents.didChangeSize:
                this.eventEmitter.emit(DataCaptureViewEvents.didChangeSize, event.data);
                break;
        }
    }
}

class NativeImageFrameSourceProxy {
    constructor() {
        this.eventEmitter = FactoryMaker.getInstance('EventEmitter');
    }
    getCurrentCameraState(position) {
        return window.Capacitor.Plugins[Capacitor$1.pluginName][CapacitorFunction.GetCurrentCameraState]({
            position: position,
        });
    }
    switchCameraToDesiredState(desiredStateJson) {
        return window.Capacitor.Plugins[Capacitor$1.pluginName][CapacitorFunction.SwitchCameraToDesiredState]({
            desiredState: desiredStateJson,
        });
    }
    registerListenerForEvents() {
        window.Capacitor.Plugins[Capacitor$1.pluginName][CapacitorFunction.RegisterListenerForCameraEvents]();
    }
    unregisterListenerForEvents() {
        window.Capacitor.Plugins[Capacitor$1.pluginName][CapacitorFunction.UnregisterListenerForCameraEvents]();
    }
    subscribeDidChangeState() {
        this.didChangeState = window.Capacitor.Plugins[Capacitor$1.pluginName].addListener(FrameSourceListenerEvents.didChangeState, this.notifyListeners.bind(this));
    }
    notifyListeners(event) {
        if (!event) {
            // The event could be undefined/null in case the plugin result did not pass a "message",
            // which could happen e.g. in case of "ok" results, which could signal e.g. successful
            // listener subscriptions.
            return;
        }
        switch (event.name) {
            case FrameSourceListenerEvents.didChangeState:
                this.eventEmitter.emit(FrameSourceListenerEvents.didChangeState, event.data);
                break;
        }
    }
}

function initProxy() {
    FactoryMaker.bindInstance('DataCaptureViewProxy', new NativeDataCaptureViewProxy());
    FactoryMaker.bindInstance('FeedbackProxy', new NativeFeedbackProxy());
    FactoryMaker.bindInstance('ImageFrameSourceProxy', new NativeImageFrameSourceProxy());
    FactoryMaker.bindLazyInstance('DataCaptureContextProxy', () => {
        return createNativeProxy(capacitorCoreNativeCaller);
    });
    FactoryMaker.bindLazyInstance('CameraProxy', () => {
        return createNativeProxy(capacitorCoreNativeCaller);
    });
}

const corePluginName = 'ScanditCaptureCorePlugin';
initProxy();
class ScanditCaptureCorePluginImplementation {
    initializePlugins() {
        return __awaiter(this, void 0, void 0, function* () {
            const coreDefaults = yield getDefaults();
            let api = {
                Feedback,
                Camera,
                Color,
                DataCaptureContext,
                DataCaptureContextSettings,
                MarginsWithUnit,
                NumberWithUnit,
                Point,
                PointWithUnit,
                Quadrilateral,
                RadiusLocationSelection,
                Rect,
                RectWithUnit,
                RectangularLocationSelection,
                Size,
                SizeWithAspect,
                SizeWithUnit,
                SizeWithUnitAndAspect,
                Brush,
                RectangularViewfinder,
                RectangularViewfinderAnimation,
                RectangularViewfinderLineStyle,
                RectangularViewfinderStyle,
                AimerViewfinder,
                CameraPosition,
                CameraSettings,
                FrameDataSettings,
                FrameDataSettingsBuilder,
                FrameSourceState,
                TorchState,
                VideoResolution,
                FocusRange,
                FocusGestureStrategy,
                Anchor,
                DataCaptureView,
                TorchSwitchControl,
                ZoomSwitchControl,
                TapToFocus,
                SwipeToZoom,
                DataCaptureVersion,
                Direction,
                Orientation,
                MeasureUnit,
                NoneLocationSelection,
                SizingMode,
                Sound,
                NoViewfinder,
                Vibration,
                VolumeButtonObserver,
                LicenseInfo,
                ImageFrameSource,
                OpenSourceSoftwareLicenseInfo,
            };
            for (const key of Object.keys(window.Capacitor.Plugins)) {
                if (key.startsWith('Scandit') && key.indexOf('Native') < 0 && key !== corePluginName) {
                    yield window.Capacitor.Plugins[key].initialize(coreDefaults)
                        .then((pluginApi) => {
                        api = Object.assign(Object.assign({}, api), pluginApi);
                    });
                }
            }
            return api;
        });
    }
}
registerPlugin(corePluginName, {
    android: () => new ScanditCaptureCorePluginImplementation(),
    ios: () => new ScanditCaptureCorePluginImplementation(),
    web: () => new ScanditCaptureCorePluginImplementation(),
});
// tslint:disable-next-line:variable-name
const ScanditCaptureCorePlugin = new ScanditCaptureCorePluginImplementation();

export { AimerViewfinder, Anchor, Brush, Camera, CameraPosition, CameraSettings, Capacitor$1 as CapacitorCore, CapacitorNativeCaller, Color, DataCaptureContext, DataCaptureContextSettings, DataCaptureVersion, DataCaptureView, Direction, Feedback, FocusGestureStrategy, FocusRange, FrameSourceState, ImageFrameSource, MarginsWithUnit, MeasureUnit, NoViewfinder, NoneLocationSelection, NumberWithUnit, OpenSourceSoftwareLicenseInfo, Orientation, Point, PointWithUnit, Quadrilateral, RadiusLocationSelection, Rect, RectWithUnit, RectangularLocationSelection, RectangularViewfinder, RectangularViewfinderAnimation, RectangularViewfinderLineStyle, RectangularViewfinderStyle, ScanditCaptureCorePlugin, ScanditCaptureCorePluginImplementation, Size, SizeWithAspect, SizeWithUnit, SizeWithUnitAndAspect, SizingMode, Sound, SwipeToZoom, TapToFocus, TorchState, TorchSwitchControl, Vibration, VideoResolution, VolumeButtonObserver, ZoomSwitchControl, capacitorExec, doReturnWithFinish };
//# sourceMappingURL=index.js.map
