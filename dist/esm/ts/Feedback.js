var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { FeedbackProxy } from './Capacitor/FeedbackProxy';
import { DefaultSerializeable, ignoreFromSerialization, ignoreFromSerializationIfNull, nameForSerialization } from './Serializeable';
var VibrationType;
(function (VibrationType) {
    VibrationType["default"] = "default";
    VibrationType["selectionHaptic"] = "selectionHaptic";
    VibrationType["successHaptic"] = "successHaptic";
})(VibrationType || (VibrationType = {}));
export class Vibration extends DefaultSerializeable {
    static fromJSON(json) {
        return new Vibration(json.type);
    }
    static get defaultVibration() {
        return new Vibration(VibrationType.default);
    }
    static get selectionHapticFeedback() {
        return new Vibration(VibrationType.selectionHaptic);
    }
    static get successHapticFeedback() {
        return new Vibration(VibrationType.successHaptic);
    }
    constructor(type) {
        super();
        this.type = type;
    }
}
export class Sound extends DefaultSerializeable {
    static fromJSON(json) {
        return new Sound(json.resource);
    }
    static get defaultSound() {
        return new Sound(null);
    }
    constructor(resource) {
        super();
        this.resource = null;
        this.resource = resource;
    }
}
__decorate([
    ignoreFromSerializationIfNull
], Sound.prototype, "resource", void 0);
export class Feedback extends DefaultSerializeable {
    static get defaultFeedback() {
        return new Feedback(Vibration.defaultVibration, Sound.defaultSound);
    }
    static fromJSON(json) {
        return new Feedback(json.vibration ? Vibration.fromJSON(json.vibration) : null, json.sound ? Sound.fromJSON(json.sound) : null);
    }
    get vibration() {
        return this._vibration;
    }
    get sound() {
        return this._sound;
    }
    constructor(vibration, sound) {
        super();
        this._vibration = null;
        this._sound = null;
        this._vibration = vibration;
        this._sound = sound;
        this.initialize();
    }
    emit() {
        if (!this.proxy) {
            return;
        }
        this.proxy.emit();
    }
    initialize() {
        if (this.proxy) {
            return;
        }
        this.proxy = FeedbackProxy.forFeedback(this);
    }
}
__decorate([
    ignoreFromSerializationIfNull,
    nameForSerialization('vibration')
], Feedback.prototype, "_vibration", void 0);
__decorate([
    ignoreFromSerializationIfNull,
    nameForSerialization('sound')
], Feedback.prototype, "_sound", void 0);
__decorate([
    ignoreFromSerialization
], Feedback.prototype, "proxy", void 0);
//# sourceMappingURL=Feedback.js.map