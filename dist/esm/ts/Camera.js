var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { FrameSourceState, TorchState, } from './Camera+Related';
import { CameraProxy } from './Capacitor/CameraProxy';
import { Capacitor } from './Capacitor/Capacitor';
import { DefaultSerializeable, ignoreFromSerialization, nameForSerialization, serializationDefault, } from './Serializeable';
export class Camera extends DefaultSerializeable {
    constructor() {
        super(...arguments);
        this.type = 'camera';
        this.settings = null;
        this._desiredTorchState = TorchState.Off;
        this._desiredState = FrameSourceState.Off;
        this.listeners = [];
        this.context = null;
    }
    get proxy() {
        if (!this._proxy) {
            this.initialize();
        }
        return this._proxy;
    }
    static get default() {
        if (Capacitor.defaults.Camera.defaultPosition) {
            const camera = new Camera();
            camera.position = Capacitor.defaults.Camera.defaultPosition;
            return camera;
        }
        else {
            return null;
        }
    }
    static atPosition(cameraPosition) {
        if (Capacitor.defaults.Camera.availablePositions.includes(cameraPosition)) {
            const camera = new Camera();
            camera.position = cameraPosition;
            return camera;
        }
        else {
            return null;
        }
    }
    get desiredState() {
        return this._desiredState;
    }
    set desiredTorchState(desiredTorchState) {
        this._desiredTorchState = desiredTorchState;
        this.didChange();
    }
    get desiredTorchState() {
        return this._desiredTorchState;
    }
    switchToDesiredState(state) {
        this._desiredState = state;
        return this.didChange();
    }
    getCurrentState() {
        return this.proxy.getCurrentState();
    }
    getIsTorchAvailable() {
        return this.proxy.getIsTorchAvailable();
    }
    addListener(listener) {
        if (listener == null) {
            return;
        }
        if (this.listeners.includes(listener)) {
            return;
        }
        this.listeners.push(listener);
    }
    removeListener(listener) {
        if (listener == null) {
            return;
        }
        if (!this.listeners.includes(listener)) {
            return;
        }
        this.listeners.splice(this.listeners.indexOf(listener), 1);
    }
    applySettings(settings) {
        this.settings = settings;
        return this.didChange();
    }
    initialize() {
        if (this._proxy) {
            return;
        }
        this._proxy = CameraProxy.forCamera(this);
    }
    didChange() {
        if (this.context) {
            return this.context.update();
        }
        else {
            return Promise.resolve();
        }
    }
}
__decorate([
    serializationDefault({})
], Camera.prototype, "settings", void 0);
__decorate([
    nameForSerialization('desiredTorchState')
], Camera.prototype, "_desiredTorchState", void 0);
__decorate([
    nameForSerialization('desiredState')
], Camera.prototype, "_desiredState", void 0);
__decorate([
    ignoreFromSerialization
], Camera.prototype, "listeners", void 0);
__decorate([
    ignoreFromSerialization
], Camera.prototype, "context", void 0);
__decorate([
    ignoreFromSerialization
], Camera.prototype, "_proxy", void 0);
//# sourceMappingURL=Camera.js.map