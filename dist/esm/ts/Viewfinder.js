var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Capacitor } from './Capacitor/Capacitor';
import { Color, MeasureUnit, NumberWithUnit, SizeWithUnitAndAspect } from './Common';
import { DefaultSerializeable, ignoreFromSerialization, nameForSerialization } from './Serializeable';
export class Brush extends DefaultSerializeable {
    static get transparent() {
        const transparentBlack = Color.fromRGBA(255, 255, 255, 0);
        return new Brush(transparentBlack, transparentBlack, 0);
    }
    get fillColor() {
        return this.fill.color;
    }
    get strokeColor() {
        return this.stroke.color;
    }
    get strokeWidth() {
        return this.stroke.width;
    }
    constructor(fillColor = Capacitor.defaults.Brush.fillColor, strokeColor = Capacitor.defaults.Brush.strokeColor, strokeWidth = Capacitor.defaults.Brush.strokeWidth) {
        super();
        this.fill = { color: fillColor };
        this.stroke = { color: strokeColor, width: strokeWidth };
    }
}
// tslint:disable-next-line:variable-name
export const NoViewfinder = { type: 'none' };
export class LaserlineViewfinder extends DefaultSerializeable {
    constructor(style) {
        super();
        this.type = 'laserline';
        const viewfinderStyle = style || Capacitor.defaults.LaserlineViewfinder.defaultStyle;
        this._style = Capacitor.defaults.LaserlineViewfinder.styles[viewfinderStyle].style;
        this.width = Capacitor.defaults.LaserlineViewfinder.styles[viewfinderStyle].width;
        this.enabledColor = Capacitor.defaults.LaserlineViewfinder.styles[viewfinderStyle].enabledColor;
        this.disabledColor = Capacitor.defaults.LaserlineViewfinder.styles[viewfinderStyle].disabledColor;
    }
    get style() {
        return this._style;
    }
}
__decorate([
    nameForSerialization('style')
], LaserlineViewfinder.prototype, "_style", void 0);
export class RectangularViewfinder extends DefaultSerializeable {
    get sizeWithUnitAndAspect() {
        return this._sizeWithUnitAndAspect;
    }
    constructor(style, lineStyle) {
        super();
        this.type = 'rectangular';
        const viewfinderStyle = style || Capacitor.defaults.RectangularViewfinder.defaultStyle;
        this._style = Capacitor.defaults.RectangularViewfinder.styles[viewfinderStyle].style;
        this._lineStyle = Capacitor.defaults.RectangularViewfinder.styles[viewfinderStyle].lineStyle;
        this._dimming = parseFloat(Capacitor.defaults.RectangularViewfinder.styles[viewfinderStyle].dimming);
        this._disabledDimming =
            parseFloat(Capacitor.defaults.RectangularViewfinder.styles[viewfinderStyle].disabledDimming);
        this._animation = Capacitor.defaults.RectangularViewfinder.styles[viewfinderStyle].animation;
        this.color = Capacitor.defaults.RectangularViewfinder.styles[viewfinderStyle].color;
        this._sizeWithUnitAndAspect = Capacitor.defaults.RectangularViewfinder.styles[viewfinderStyle].size;
        if (lineStyle !== undefined) {
            this._lineStyle = lineStyle;
        }
    }
    get style() {
        return this._style;
    }
    get lineStyle() {
        return this._lineStyle;
    }
    get dimming() {
        return this._dimming;
    }
    set dimming(value) {
        this._dimming = value;
    }
    get disabledDimming() {
        return this._disabledDimming;
    }
    set disabledDimming(value) {
        this._disabledDimming = value;
    }
    get animation() {
        return this._animation;
    }
    set animation(animation) {
        this._animation = animation;
    }
    setSize(size) {
        this._sizeWithUnitAndAspect = SizeWithUnitAndAspect.sizeWithWidthAndHeight(size);
    }
    setWidthAndAspectRatio(width, heightToWidthAspectRatio) {
        this._sizeWithUnitAndAspect = SizeWithUnitAndAspect.sizeWithWidthAndAspectRatio(width, heightToWidthAspectRatio);
    }
    setHeightAndAspectRatio(height, widthToHeightAspectRatio) {
        this._sizeWithUnitAndAspect = SizeWithUnitAndAspect.sizeWithHeightAndAspectRatio(height, widthToHeightAspectRatio);
    }
    setShorterDimensionAndAspectRatio(fraction, aspectRatio) {
        this._sizeWithUnitAndAspect = SizeWithUnitAndAspect.sizeWithShorterDimensionAndAspectRatio(new NumberWithUnit(fraction, MeasureUnit.Fraction), aspectRatio);
    }
}
__decorate([
    nameForSerialization('style')
], RectangularViewfinder.prototype, "_style", void 0);
__decorate([
    nameForSerialization('lineStyle')
], RectangularViewfinder.prototype, "_lineStyle", void 0);
__decorate([
    nameForSerialization('dimming')
], RectangularViewfinder.prototype, "_dimming", void 0);
__decorate([
    nameForSerialization('disabledDimming')
], RectangularViewfinder.prototype, "_disabledDimming", void 0);
__decorate([
    nameForSerialization('animation'),
    ignoreFromSerialization
], RectangularViewfinder.prototype, "_animation", void 0);
__decorate([
    nameForSerialization('size')
], RectangularViewfinder.prototype, "_sizeWithUnitAndAspect", void 0);
export class AimerViewfinder extends DefaultSerializeable {
    constructor() {
        super();
        this.type = 'aimer';
        this.frameColor = Capacitor.defaults.AimerViewfinder.frameColor;
        this.dotColor = Capacitor.defaults.AimerViewfinder.dotColor;
    }
}
//# sourceMappingURL=Viewfinder.js.map