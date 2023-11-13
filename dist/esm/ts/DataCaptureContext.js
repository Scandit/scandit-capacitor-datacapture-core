var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Capacitor } from './Capacitor/Capacitor';
import { DataCaptureContextProxy } from './Capacitor/DataCaptureContextProxy';
import { DefaultSerializeable, ignoreFromSerialization, nameForSerialization } from './Serializeable';
export class DataCaptureContextSettings extends DefaultSerializeable {
    constructor() {
        super();
    }
    setProperty(name, value) {
        this[name] = value;
    }
    getProperty(name) {
        return this[name];
    }
}
export class DataCaptureContext extends DefaultSerializeable {
    // TODO: adjust when readding framedata to the api https://jira.scandit.com/browse/SDC-1159
    // @ignoreFromSerialization
    // private frameListeners: DataCaptureContextFrameListener[] = [];
    get frameSource() {
        return this._frameSource;
    }
    static get deviceID() {
        return Capacitor.defaults.deviceID;
    }
    static forLicenseKey(licenseKey) {
        return DataCaptureContext.forLicenseKeyWithOptions(licenseKey, null);
    }
    static forLicenseKeyWithSettings(licenseKey, settings) {
        const context = this.forLicenseKey(licenseKey);
        if (settings !== null) {
            context.applySettings(settings);
        }
        return context;
    }
    static forLicenseKeyWithOptions(licenseKey, options) {
        if (options == null) {
            options = { deviceName: null };
        }
        return new DataCaptureContext(licenseKey, options.deviceName || '');
    }
    constructor(licenseKey, deviceName) {
        super();
        this.licenseKey = licenseKey;
        this.deviceName = deviceName;
        this.framework = 'capacitor';
        this.frameworkVersion = (() => Capacitor.defaults.capacitorVersion)();
        this.settings = new DataCaptureContextSettings();
        this._frameSource = null;
        this.view = null;
        this.modes = [];
        this.components = [];
        this.listeners = [];
    }
    setFrameSource(frameSource) {
        this._frameSource = frameSource;
        if (frameSource) {
            frameSource.context = this;
        }
        return this.update();
    }
    addListener(listener) {
        if (this.listeners.includes(listener)) {
            return;
        }
        this.listeners.push(listener);
    }
    removeListener(listener) {
        if (!this.listeners.includes(listener)) {
            return;
        }
        this.listeners.splice(this.listeners.indexOf(listener), 1);
    }
    // TODO: adjust when readding framedata to the api https://jira.scandit.com/browse/SDC-1159
    // public addFrameListener(frameListener: DataCaptureContextFrameListener) {
    //   if (this.frameListeners.includes(frameListener)) {
    //     return;
    //   }
    //   this.frameListeners.push(frameListener);
    // }
    // TODO: adjust when readding framedata to the api https://jira.scandit.com/browse/SDC-1159
    // public removeFrameListener(frameListener: DataCaptureContextFrameListener) {
    //   if (!this.frameListeners.includes(frameListener)) {
    //     return;
    //   }
    //   this.frameListeners.splice(this.frameListeners.indexOf(frameListener), 1);
    // }
    addMode(mode) {
        if (!this.modes.includes(mode)) {
            this.modes.push(mode);
            mode._context = this;
            this.update();
        }
    }
    removeMode(mode) {
        if (this.modes.includes(mode)) {
            this.modes.splice(this.modes.indexOf(mode), 1);
            mode._context = null;
            this.update();
        }
    }
    removeAllModes() {
        this.modes = [];
        this.update();
    }
    dispose() {
        if (!this.proxy) {
            return;
        }
        this.proxy.dispose();
    }
    applySettings(settings) {
        this.settings = settings;
        return this.update();
    }
    initialize() {
        if (this.proxy) {
            return;
        }
        this.proxy = DataCaptureContextProxy.forDataCaptureContext(this);
    }
    update() {
        if (!this.proxy) {
            return Promise.resolve();
        }
        return this.proxy.updateContextFromJSON();
    }
    addComponent(component) {
        if (!this.components.includes(component)) {
            this.components.push(component);
            component._context = this;
            return this.update();
        }
        else {
            return Promise.resolve();
        }
    }
}
__decorate([
    nameForSerialization('frameSource')
], DataCaptureContext.prototype, "_frameSource", void 0);
__decorate([
    ignoreFromSerialization
], DataCaptureContext.prototype, "proxy", void 0);
__decorate([
    ignoreFromSerialization
], DataCaptureContext.prototype, "listeners", void 0);
//# sourceMappingURL=DataCaptureContext.js.map