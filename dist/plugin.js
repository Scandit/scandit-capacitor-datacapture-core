var capacitorPlugin = (function (exports, core) {
    'use strict';

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

    // tslint:disable-next-line:ban-types
    function ignoreFromSerialization(target, propertyName) {
        target.ignoredProperties = target.ignoredProperties || [];
        target.ignoredProperties.push(propertyName);
    }
    // tslint:disable-next-line:ban-types
    function nameForSerialization(customName) {
        return (target, propertyName) => {
            target.customPropertyNames = target.customPropertyNames || {};
            target.customPropertyNames[propertyName] = customName;
        };
    }
    // tslint:disable-next-line:ban-types
    function ignoreFromSerializationIfNull(target, propertyName) {
        target.ignoredIfNullProperties = target.ignoredIfNullProperties || [];
        target.ignoredIfNullProperties.push(propertyName);
    }
    // tslint:disable-next-line:ban-types
    function serializationDefault(defaultValue) {
        return (target, propertyName) => {
            target.customPropertyDefaults = target.customPropertyDefaults || {};
            target.customPropertyDefaults[propertyName] = defaultValue;
        };
    }
    class DefaultSerializeable {
        toJSON() {
            const properties = Object.keys(this);
            // use @ignoreFromSerialization to ignore properties
            const ignoredProperties = this.ignoredProperties || [];
            // use @ignoreFromSerializationIfNull to ignore properties if they're null
            const ignoredIfNullProperties = this.ignoredIfNullProperties || [];
            // use @nameForSerialization('customName') to rename properties in the JSON output
            const customPropertyNames = this.customPropertyNames || {};
            // use @serializationDefault({}) to use a different value in the JSON output if they're null
            const customPropertyDefaults = this.customPropertyDefaults || {};
            return properties.reduce((json, property) => {
                if (ignoredProperties.includes(property)) {
                    return json;
                }
                let value = this[property];
                if (value === undefined) {
                    return json;
                }
                // Ignore if it's null and should be ignored.
                // This is basically responsible for not including optional properties in the JSON if they're null,
                // as that's not always deserialized to mean the same as not present.
                if (value === null && ignoredIfNullProperties.includes(property)) {
                    return json;
                }
                if (value === null && customPropertyDefaults[property] !== undefined) {
                    value = customPropertyDefaults[property];
                }
                // Serialize if serializeable
                if (value != null && value.toJSON) {
                    value = value.toJSON();
                }
                // Serialize the array if the elements are serializeable
                if (Array.isArray(value)) {
                    value = value.map(e => e.toJSON ? e.toJSON() : e);
                }
                const propertyName = customPropertyNames[property] || property;
                json[propertyName] = value;
                return json;
            }, {});
        }
    }

    var __decorate$8 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    class Point extends DefaultSerializeable {
        get x() {
            return this._x;
        }
        get y() {
            return this._y;
        }
        static fromJSON(json) {
            return new Point(json.x, json.y);
        }
        constructor(x, y) {
            super();
            this._x = x;
            this._y = y;
        }
    }
    __decorate$8([
        nameForSerialization('x')
    ], Point.prototype, "_x", void 0);
    __decorate$8([
        nameForSerialization('y')
    ], Point.prototype, "_y", void 0);
    class Quadrilateral extends DefaultSerializeable {
        get topLeft() {
            return this._topLeft;
        }
        get topRight() {
            return this._topRight;
        }
        get bottomRight() {
            return this._bottomRight;
        }
        get bottomLeft() {
            return this._bottomLeft;
        }
        static fromJSON(json) {
            return new Quadrilateral(Point.fromJSON(json.topLeft), Point.fromJSON(json.topRight), Point.fromJSON(json.bottomRight), Point.fromJSON(json.bottomLeft));
        }
        constructor(topLeft, topRight, bottomRight, bottomLeft) {
            super();
            this._topLeft = topLeft;
            this._topRight = topRight;
            this._bottomRight = bottomRight;
            this._bottomLeft = bottomLeft;
        }
    }
    __decorate$8([
        nameForSerialization('topLeft')
    ], Quadrilateral.prototype, "_topLeft", void 0);
    __decorate$8([
        nameForSerialization('topRight')
    ], Quadrilateral.prototype, "_topRight", void 0);
    __decorate$8([
        nameForSerialization('bottomRight')
    ], Quadrilateral.prototype, "_bottomRight", void 0);
    __decorate$8([
        nameForSerialization('bottomLeft')
    ], Quadrilateral.prototype, "_bottomLeft", void 0);
    var MeasureUnit;
    (function (MeasureUnit) {
        MeasureUnit["DIP"] = "dip";
        MeasureUnit["Pixel"] = "pixel";
        MeasureUnit["Fraction"] = "fraction";
    })(MeasureUnit || (MeasureUnit = {}));
    class NumberWithUnit extends DefaultSerializeable {
        get value() {
            return this._value;
        }
        get unit() {
            return this._unit;
        }
        static fromJSON(json) {
            return new NumberWithUnit(json.value, json.unit);
        }
        constructor(value, unit) {
            super();
            this._value = value;
            this._unit = unit;
        }
    }
    __decorate$8([
        nameForSerialization('value')
    ], NumberWithUnit.prototype, "_value", void 0);
    __decorate$8([
        nameForSerialization('unit')
    ], NumberWithUnit.prototype, "_unit", void 0);
    class PointWithUnit extends DefaultSerializeable {
        get x() {
            return this._x;
        }
        get y() {
            return this._y;
        }
        static fromJSON(json) {
            return new PointWithUnit(NumberWithUnit.fromJSON(json.x), NumberWithUnit.fromJSON(json.y));
        }
        static get zero() {
            return new PointWithUnit(new NumberWithUnit(0, MeasureUnit.Pixel), new NumberWithUnit(0, MeasureUnit.Pixel));
        }
        constructor(x, y) {
            super();
            this._x = x;
            this._y = y;
        }
    }
    __decorate$8([
        nameForSerialization('x')
    ], PointWithUnit.prototype, "_x", void 0);
    __decorate$8([
        nameForSerialization('y')
    ], PointWithUnit.prototype, "_y", void 0);
    class Rect extends DefaultSerializeable {
        get origin() {
            return this._origin;
        }
        get size() {
            return this._size;
        }
        constructor(origin, size) {
            super();
            this._origin = origin;
            this._size = size;
        }
    }
    __decorate$8([
        nameForSerialization('origin')
    ], Rect.prototype, "_origin", void 0);
    __decorate$8([
        nameForSerialization('size')
    ], Rect.prototype, "_size", void 0);
    class RectWithUnit extends DefaultSerializeable {
        get origin() {
            return this._origin;
        }
        get size() {
            return this._size;
        }
        constructor(origin, size) {
            super();
            this._origin = origin;
            this._size = size;
        }
    }
    __decorate$8([
        nameForSerialization('origin')
    ], RectWithUnit.prototype, "_origin", void 0);
    __decorate$8([
        nameForSerialization('size')
    ], RectWithUnit.prototype, "_size", void 0);
    class SizeWithUnit extends DefaultSerializeable {
        get width() {
            return this._width;
        }
        get height() {
            return this._height;
        }
        constructor(width, height) {
            super();
            this._width = width;
            this._height = height;
        }
    }
    __decorate$8([
        nameForSerialization('width')
    ], SizeWithUnit.prototype, "_width", void 0);
    __decorate$8([
        nameForSerialization('height')
    ], SizeWithUnit.prototype, "_height", void 0);
    class Size extends DefaultSerializeable {
        get width() {
            return this._width;
        }
        get height() {
            return this._height;
        }
        static fromJSON(json) {
            return new Size(json.width, json.height);
        }
        constructor(width, height) {
            super();
            this._width = width;
            this._height = height;
        }
    }
    __decorate$8([
        nameForSerialization('width')
    ], Size.prototype, "_width", void 0);
    __decorate$8([
        nameForSerialization('height')
    ], Size.prototype, "_height", void 0);
    class SizeWithAspect {
        get size() {
            return this._size;
        }
        get aspect() {
            return this._aspect;
        }
        constructor(size, aspect) {
            this._size = size;
            this._aspect = aspect;
        }
    }
    __decorate$8([
        nameForSerialization('size')
    ], SizeWithAspect.prototype, "_size", void 0);
    __decorate$8([
        nameForSerialization('aspect')
    ], SizeWithAspect.prototype, "_aspect", void 0);
    var SizingMode;
    (function (SizingMode) {
        SizingMode["WidthAndHeight"] = "widthAndHeight";
        SizingMode["WidthAndAspectRatio"] = "widthAndAspectRatio";
        SizingMode["HeightAndAspectRatio"] = "heightAndAspectRatio";
        SizingMode["ShorterDimensionAndAspectRatio"] = "shorterDimensionAndAspectRatio";
    })(SizingMode || (SizingMode = {}));
    class SizeWithUnitAndAspect {
        constructor() {
            this._shorterDimensionAndAspectRatio = null;
        }
        get widthAndHeight() {
            return this._widthAndHeight;
        }
        get widthAndAspectRatio() {
            return this._widthAndAspectRatio;
        }
        get heightAndAspectRatio() {
            return this._heightAndAspectRatio;
        }
        get shorterDimensionAndAspectRatio() {
            return this._shorterDimensionAndAspectRatio;
        }
        get sizingMode() {
            if (this.widthAndAspectRatio) {
                return SizingMode.WidthAndAspectRatio;
            }
            if (this.heightAndAspectRatio) {
                return SizingMode.HeightAndAspectRatio;
            }
            if (this.shorterDimensionAndAspectRatio) {
                return SizingMode.ShorterDimensionAndAspectRatio;
            }
            return SizingMode.WidthAndHeight;
        }
        static sizeWithWidthAndHeight(widthAndHeight) {
            const sizeWithUnitAndAspect = new SizeWithUnitAndAspect();
            sizeWithUnitAndAspect._widthAndHeight = widthAndHeight;
            return sizeWithUnitAndAspect;
        }
        static sizeWithWidthAndAspectRatio(width, aspectRatio) {
            const sizeWithUnitAndAspect = new SizeWithUnitAndAspect();
            sizeWithUnitAndAspect._widthAndAspectRatio = new SizeWithAspect(width, aspectRatio);
            return sizeWithUnitAndAspect;
        }
        static sizeWithHeightAndAspectRatio(height, aspectRatio) {
            const sizeWithUnitAndAspect = new SizeWithUnitAndAspect();
            sizeWithUnitAndAspect._heightAndAspectRatio = new SizeWithAspect(height, aspectRatio);
            return sizeWithUnitAndAspect;
        }
        static sizeWithShorterDimensionAndAspectRatio(shorterDimension, aspectRatio) {
            const sizeWithUnitAndAspect = new SizeWithUnitAndAspect();
            sizeWithUnitAndAspect._shorterDimensionAndAspectRatio = new SizeWithAspect(shorterDimension, aspectRatio);
            return sizeWithUnitAndAspect;
        }
        static fromJSON(json) {
            if (json.width && json.height) {
                return this.sizeWithWidthAndHeight(new SizeWithUnit(NumberWithUnit.fromJSON(json.width), NumberWithUnit.fromJSON(json.height)));
            }
            else if (json.width && json.aspect) {
                return this.sizeWithWidthAndAspectRatio(NumberWithUnit.fromJSON(json.width), json.aspect);
            }
            else if (json.height && json.aspect) {
                return this.sizeWithHeightAndAspectRatio(NumberWithUnit.fromJSON(json.height), json.aspect);
            }
            else if (json.shorterDimension && json.aspect) {
                return this.sizeWithShorterDimensionAndAspectRatio(NumberWithUnit.fromJSON(json.shorterDimension), json.aspect);
            }
            else {
                throw new Error(`SizeWithUnitAndAspectJSON is malformed: ${JSON.stringify(json)}`);
            }
        }
        // no member access so our coverage check doesn't pick it up
        // TODO: https://jira.scandit.com/browse/SDC-1773
        // tslint:disable-next-line:member-access
        toJSON() {
            switch (this.sizingMode) {
                case SizingMode.WidthAndAspectRatio:
                    return {
                        width: this.widthAndAspectRatio.size.toJSON(),
                        aspect: this.widthAndAspectRatio.aspect,
                    };
                case SizingMode.HeightAndAspectRatio:
                    return {
                        height: this.heightAndAspectRatio.size.toJSON(),
                        aspect: this.heightAndAspectRatio.aspect,
                    };
                case SizingMode.ShorterDimensionAndAspectRatio:
                    return {
                        shorterDimension: this.shorterDimensionAndAspectRatio.size.toJSON(),
                        aspect: this.shorterDimensionAndAspectRatio.aspect,
                    };
                default:
                    return {
                        width: this.widthAndHeight.width.toJSON(),
                        height: this.widthAndHeight.height.toJSON(),
                    };
            }
        }
    }
    __decorate$8([
        nameForSerialization('widthAndHeight')
    ], SizeWithUnitAndAspect.prototype, "_widthAndHeight", void 0);
    __decorate$8([
        nameForSerialization('widthAndAspectRatio')
    ], SizeWithUnitAndAspect.prototype, "_widthAndAspectRatio", void 0);
    __decorate$8([
        nameForSerialization('heightAndAspectRatio')
    ], SizeWithUnitAndAspect.prototype, "_heightAndAspectRatio", void 0);
    __decorate$8([
        nameForSerialization('shorterDimensionAndAspectRatio')
    ], SizeWithUnitAndAspect.prototype, "_shorterDimensionAndAspectRatio", void 0);
    class MarginsWithUnit extends DefaultSerializeable {
        get left() {
            return this._left;
        }
        get right() {
            return this._right;
        }
        get top() {
            return this._top;
        }
        get bottom() {
            return this._bottom;
        }
        static fromJSON(json) {
            return new MarginsWithUnit(NumberWithUnit.fromJSON(json.left), NumberWithUnit.fromJSON(json.right), NumberWithUnit.fromJSON(json.top), NumberWithUnit.fromJSON(json.bottom));
        }
        static get zero() {
            return new MarginsWithUnit(new NumberWithUnit(0, MeasureUnit.Pixel), new NumberWithUnit(0, MeasureUnit.Pixel), new NumberWithUnit(0, MeasureUnit.Pixel), new NumberWithUnit(0, MeasureUnit.Pixel));
        }
        constructor(left, right, top, bottom) {
            super();
            this._left = left;
            this._right = right;
            this._top = top;
            this._bottom = bottom;
        }
    }
    __decorate$8([
        nameForSerialization('left')
    ], MarginsWithUnit.prototype, "_left", void 0);
    __decorate$8([
        nameForSerialization('right')
    ], MarginsWithUnit.prototype, "_right", void 0);
    __decorate$8([
        nameForSerialization('top')
    ], MarginsWithUnit.prototype, "_top", void 0);
    __decorate$8([
        nameForSerialization('bottom')
    ], MarginsWithUnit.prototype, "_bottom", void 0);
    class Color {
        get redComponent() {
            return this.hexadecimalString.slice(0, 2);
        }
        get greenComponent() {
            return this.hexadecimalString.slice(2, 4);
        }
        get blueComponent() {
            return this.hexadecimalString.slice(4, 6);
        }
        get alphaComponent() {
            return this.hexadecimalString.slice(6, 8);
        }
        get red() {
            return Color.hexToNumber(this.redComponent);
        }
        get green() {
            return Color.hexToNumber(this.greenComponent);
        }
        get blue() {
            return Color.hexToNumber(this.blueComponent);
        }
        get alpha() {
            return Color.hexToNumber(this.alphaComponent);
        }
        static fromHex(hex) {
            return new Color(Color.normalizeHex(hex));
        }
        static fromRGBA(red, green, blue, alpha = 1) {
            const hexString = [red, green, blue, this.normalizeAlpha(alpha)]
                .reduce((hex, colorComponent) => hex + this.numberToHex(colorComponent), '');
            return new Color(hexString);
        }
        static hexToNumber(hex) {
            return parseInt(hex, 16);
        }
        static fromJSON(json) {
            return Color.fromHex(json);
        }
        static numberToHex(x) {
            x = Math.round(x);
            let hex = x.toString(16);
            if (hex.length === 1) {
                hex = '0' + hex;
            }
            return hex.toUpperCase();
        }
        static normalizeHex(hex) {
            // remove leading #
            if (hex[0] === '#') {
                hex = hex.slice(1);
            }
            // double digits if single digit
            if (hex.length < 6) {
                hex = hex.split('').map(s => s + s).join('');
            }
            // add alpha if missing
            if (hex.length === 6) {
                hex = hex + 'FF';
            }
            return hex.toUpperCase();
        }
        static normalizeAlpha(alpha) {
            if (alpha > 0 && alpha <= 1) {
                return 255 * alpha;
            }
            return alpha;
        }
        constructor(hex) {
            this.hexadecimalString = hex;
        }
        withAlpha(alpha) {
            const newHex = this.hexadecimalString.slice(0, 6) + Color.numberToHex(Color.normalizeAlpha(alpha));
            return Color.fromHex(newHex);
        }
        // no member access so our coverage check doesn't pick it up
        // TODO: https://jira.scandit.com/browse/SDC-1773
        // tslint:disable-next-line:member-access
        toJSON() {
            return this.hexadecimalString;
        }
    }
    var Orientation;
    (function (Orientation) {
        Orientation["Unknown"] = "unknown";
        Orientation["Portrait"] = "portrait";
        Orientation["PortraitUpsideDown"] = "portraitUpsideDown";
        Orientation["LandscapeRight"] = "landscapeRight";
        Orientation["LandscapeLeft"] = "landscapeLeft";
    })(Orientation || (Orientation = {}));
    var Direction;
    (function (Direction) {
        Direction["None"] = "none";
        Direction["Horizontal"] = "horizontal";
        Direction["LeftToRight"] = "leftToRight";
        Direction["RightToLeft"] = "rightToLeft";
        Direction["Vertical"] = "vertical";
        Direction["TopToBottom"] = "topToBottom";
        Direction["BottomToTop"] = "bottomToTop";
    })(Direction || (Direction = {}));

    class PrivateFocusGestureDeserializer {
        static fromJSON(json) {
            if (json && json.type === new TapToFocus().type) {
                return new TapToFocus();
            }
            else {
                return null;
            }
        }
    }
    class TapToFocus extends DefaultSerializeable {
        constructor() {
            super();
            this.type = 'tapToFocus';
        }
    }
    class PrivateZoomGestureDeserializer {
        static fromJSON(json) {
            if (json && json.type === new SwipeToZoom().type) {
                return new SwipeToZoom();
            }
            else {
                return null;
            }
        }
    }
    class SwipeToZoom extends DefaultSerializeable {
        constructor() {
            super();
            this.type = 'swipeToZoom';
        }
    }
    var LogoStyle;
    (function (LogoStyle) {
        LogoStyle["Minimal"] = "minimal";
        LogoStyle["Extended"] = "extended";
    })(LogoStyle || (LogoStyle = {}));

    var __decorate$7 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var RectangularViewfinderStyle;
    (function (RectangularViewfinderStyle) {
        RectangularViewfinderStyle["Legacy"] = "legacy";
        RectangularViewfinderStyle["Rounded"] = "rounded";
        RectangularViewfinderStyle["Square"] = "square";
    })(RectangularViewfinderStyle || (RectangularViewfinderStyle = {}));
    var RectangularViewfinderLineStyle;
    (function (RectangularViewfinderLineStyle) {
        RectangularViewfinderLineStyle["Light"] = "light";
        RectangularViewfinderLineStyle["Bold"] = "bold";
    })(RectangularViewfinderLineStyle || (RectangularViewfinderLineStyle = {}));
    var LaserlineViewfinderStyle;
    (function (LaserlineViewfinderStyle) {
        LaserlineViewfinderStyle["Legacy"] = "legacy";
        LaserlineViewfinderStyle["Animated"] = "animated";
    })(LaserlineViewfinderStyle || (LaserlineViewfinderStyle = {}));
    class RectangularViewfinderAnimation extends DefaultSerializeable {
        static fromJSON(json) {
            if (json === null) {
                return null;
            }
            return new RectangularViewfinderAnimation(json.looping);
        }
        get isLooping() {
            return this._isLooping;
        }
        constructor(isLooping) {
            super();
            this._isLooping = false;
            this._isLooping = isLooping;
        }
    }
    __decorate$7([
        nameForSerialization('isLooping')
    ], RectangularViewfinderAnimation.prototype, "_isLooping", void 0);

    const defaultsFromJSON = (json) => {
        return {
            Camera: {
                Settings: {
                    preferredResolution: json.Camera.Settings.preferredResolution,
                    zoomFactor: json.Camera.Settings.zoomFactor,
                    focusRange: json.Camera.Settings.focusRange,
                    zoomGestureZoomFactor: json.Camera.Settings.zoomGestureZoomFactor,
                    focusGestureStrategy: json.Camera.Settings.focusGestureStrategy,
                    shouldPreferSmoothAutoFocus: json.Camera.Settings.shouldPreferSmoothAutoFocus,
                    properties: json.Camera.Settings.properties,
                },
                defaultPosition: (json.Camera.defaultPosition || null),
                availablePositions: json.Camera.availablePositions,
            },
            DataCaptureView: {
                scanAreaMargins: MarginsWithUnit
                    .fromJSON(JSON.parse(json.DataCaptureView.scanAreaMargins)),
                pointOfInterest: PointWithUnit
                    .fromJSON(JSON.parse(json.DataCaptureView.pointOfInterest)),
                logoAnchor: json.DataCaptureView.logoAnchor,
                logoOffset: PointWithUnit
                    .fromJSON(JSON.parse(json.DataCaptureView.logoOffset)),
                focusGesture: PrivateFocusGestureDeserializer.fromJSON(JSON.parse(json.DataCaptureView.focusGesture)),
                zoomGesture: PrivateZoomGestureDeserializer.fromJSON(JSON.parse(json.DataCaptureView.zoomGesture)),
                logoStyle: json.DataCaptureView.logoStyle.toLowerCase(),
            },
            LaserlineViewfinder: Object
                .keys(json.LaserlineViewfinder.styles)
                .reduce((acc, key) => {
                const viewfinder = json.LaserlineViewfinder.styles[key];
                acc.styles[key] = {
                    width: NumberWithUnit
                        .fromJSON(JSON.parse(viewfinder.width)),
                    enabledColor: Color
                        .fromJSON(viewfinder.enabledColor),
                    disabledColor: Color
                        .fromJSON(viewfinder.disabledColor),
                    style: viewfinder.style,
                };
                return acc;
            }, { defaultStyle: json.LaserlineViewfinder.defaultStyle, styles: {} }),
            RectangularViewfinder: Object
                .keys(json.RectangularViewfinder.styles)
                .reduce((acc, key) => {
                const viewfinder = json.RectangularViewfinder.styles[key];
                acc.styles[key] = {
                    size: SizeWithUnitAndAspect
                        .fromJSON(JSON.parse(viewfinder.size)),
                    color: Color
                        .fromJSON(viewfinder.color),
                    style: viewfinder.style,
                    lineStyle: viewfinder.lineStyle,
                    dimming: viewfinder.dimming,
                    disabledDimming: viewfinder.disabledDimming,
                    animation: RectangularViewfinderAnimation
                        .fromJSON(viewfinder.animation ? JSON.parse(viewfinder.animation) : null),
                };
                return acc;
            }, { defaultStyle: json.RectangularViewfinder.defaultStyle, styles: {} }),
            AimerViewfinder: {
                frameColor: Color.fromJSON(json.AimerViewfinder.frameColor),
                dotColor: Color.fromJSON(json.AimerViewfinder.dotColor),
            },
            Brush: {
                fillColor: Color
                    .fromJSON(json.Brush.fillColor),
                strokeColor: Color
                    .fromJSON(json.Brush.strokeColor),
                strokeWidth: json.Brush.strokeWidth,
            },
            deviceID: json.deviceID,
            capacitorVersion: json.capacitorVersion,
        };
    };

    var __awaiter$1 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var CapacitorFunction;
    (function (CapacitorFunction) {
        CapacitorFunction["GetDefaults"] = "getDefaults";
        CapacitorFunction["ContextFromJSON"] = "contextFromJSON";
        CapacitorFunction["DisposeContext"] = "disposeContext";
        CapacitorFunction["UpdateContextFromJSON"] = "updateContextFromJSON";
        CapacitorFunction["SubscribeContextListener"] = "subscribeContextListener";
        CapacitorFunction["SubscribeContextFrameListener"] = "subscribeContextFrameListener";
        CapacitorFunction["SetViewPositionAndSize"] = "setViewPositionAndSize";
        CapacitorFunction["ShowView"] = "showView";
        CapacitorFunction["HideView"] = "hideView";
        CapacitorFunction["ViewPointForFramePoint"] = "viewPointForFramePoint";
        CapacitorFunction["ViewQuadrilateralForFrameQuadrilateral"] = "viewQuadrilateralForFrameQuadrilateral";
        CapacitorFunction["SubscribeViewListener"] = "subscribeViewListener";
        CapacitorFunction["GetCurrentCameraState"] = "getCurrentCameraState";
        CapacitorFunction["GetIsTorchAvailable"] = "getIsTorchAvailable";
        CapacitorFunction["GetLastFrame"] = "getLastFrame";
        CapacitorFunction["GetLastFrameOrNull"] = "getLastFrameOrNull";
        CapacitorFunction["EmitFeedback"] = "emitFeedback";
        CapacitorFunction["SubscribeVolumeButtonObserver"] = "subscribeVolumeButtonObserver";
        CapacitorFunction["UnsubscribeVolumeButtonObserver"] = "unsubscribeVolumeButtonObserver";
    })(CapacitorFunction || (CapacitorFunction = {}));
    const pluginName = 'ScanditCaptureCoreNative';
    // tslint:disable-next-line:variable-name
    const Capacitor = {
        pluginName,
        defaults: {},
        exec: (success, error, functionName, args) => capacitorExec(success, error, pluginName, functionName, args),
    };
    const getDefaults = () => __awaiter$1(void 0, void 0, void 0, function* () {
        yield window.Capacitor.Plugins[pluginName][CapacitorFunction.GetDefaults]()
            .then((defaultsJSON) => {
            const defaults = defaultsFromJSON(defaultsJSON);
            Capacitor.defaults = defaults;
        })
            .catch((error) => {
            // tslint:disable-next-line:no-console
            console.warn(error);
        });
        return Capacitor.defaults;
    });

    var __decorate$6 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    // tslint:disable-next-line:variable-name
    const NoneLocationSelection = { type: 'none' };
    class RadiusLocationSelection extends DefaultSerializeable {
        get radius() {
            return this._radius;
        }
        constructor(radius) {
            super();
            this.type = 'radius';
            this._radius = radius;
        }
    }
    __decorate$6([
        nameForSerialization('radius')
    ], RadiusLocationSelection.prototype, "_radius", void 0);
    class RectangularLocationSelection extends DefaultSerializeable {
        constructor() {
            super(...arguments);
            this.type = 'rectangular';
        }
        get sizeWithUnitAndAspect() {
            return this._sizeWithUnitAndAspect;
        }
        static withSize(size) {
            const locationSelection = new RectangularLocationSelection();
            locationSelection._sizeWithUnitAndAspect = SizeWithUnitAndAspect.sizeWithWidthAndHeight(size);
            return locationSelection;
        }
        static withWidthAndAspectRatio(width, heightToWidthAspectRatio) {
            const locationSelection = new RectangularLocationSelection();
            locationSelection._sizeWithUnitAndAspect = SizeWithUnitAndAspect
                .sizeWithWidthAndAspectRatio(width, heightToWidthAspectRatio);
            return locationSelection;
        }
        static withHeightAndAspectRatio(height, widthToHeightAspectRatio) {
            const locationSelection = new RectangularLocationSelection();
            locationSelection._sizeWithUnitAndAspect = SizeWithUnitAndAspect
                .sizeWithHeightAndAspectRatio(height, widthToHeightAspectRatio);
            return locationSelection;
        }
    }
    __decorate$6([
        nameForSerialization('size')
    ], RectangularLocationSelection.prototype, "_sizeWithUnitAndAspect", void 0);

    var __decorate$5 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    class Brush extends DefaultSerializeable {
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
    const NoViewfinder = { type: 'none' };
    class LaserlineViewfinder extends DefaultSerializeable {
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
    __decorate$5([
        nameForSerialization('style')
    ], LaserlineViewfinder.prototype, "_style", void 0);
    class RectangularViewfinder extends DefaultSerializeable {
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
    __decorate$5([
        nameForSerialization('style')
    ], RectangularViewfinder.prototype, "_style", void 0);
    __decorate$5([
        nameForSerialization('lineStyle')
    ], RectangularViewfinder.prototype, "_lineStyle", void 0);
    __decorate$5([
        nameForSerialization('dimming')
    ], RectangularViewfinder.prototype, "_dimming", void 0);
    __decorate$5([
        nameForSerialization('disabledDimming')
    ], RectangularViewfinder.prototype, "_disabledDimming", void 0);
    __decorate$5([
        nameForSerialization('animation'),
        ignoreFromSerialization
    ], RectangularViewfinder.prototype, "_animation", void 0);
    __decorate$5([
        nameForSerialization('size')
    ], RectangularViewfinder.prototype, "_sizeWithUnitAndAspect", void 0);
    class AimerViewfinder extends DefaultSerializeable {
        constructor() {
            super();
            this.type = 'aimer';
            this.frameColor = Capacitor.defaults.AimerViewfinder.frameColor;
            this.dotColor = Capacitor.defaults.AimerViewfinder.dotColor;
        }
    }

    var __decorate$4 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var FrameSourceState;
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
    var TorchState;
    (function (TorchState) {
        TorchState["On"] = "on";
        TorchState["Off"] = "off";
        TorchState["Auto"] = "auto";
    })(TorchState || (TorchState = {}));
    var CameraPosition;
    (function (CameraPosition) {
        CameraPosition["WorldFacing"] = "worldFacing";
        CameraPosition["UserFacing"] = "userFacing";
        CameraPosition["Unspecified"] = "unspecified";
    })(CameraPosition || (CameraPosition = {}));
    var VideoResolution;
    (function (VideoResolution) {
        VideoResolution["Auto"] = "auto";
        VideoResolution["HD"] = "hd";
        VideoResolution["FullHD"] = "fullHd";
        VideoResolution["UHD4K"] = "uhd4k";
    })(VideoResolution || (VideoResolution = {}));
    var FocusRange;
    (function (FocusRange) {
        FocusRange["Full"] = "full";
        FocusRange["Near"] = "near";
        FocusRange["Far"] = "far";
    })(FocusRange || (FocusRange = {}));
    var FocusGestureStrategy;
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
    class CameraSettings extends DefaultSerializeable {
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
            if (json.properties != undefined) {
                for (const key of Object.keys(json.properties)) {
                    settings.setProperty(key, json.properties[key]);
                }
            }
            return settings;
        }
        constructor(settings) {
            super();
            this.focusHiddenProperties = [
                'range',
                'manualLensPosition',
                'shouldPreferSmoothAutoFocus',
                'focusStrategy',
                'focusGestureStrategy'
            ];
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
        setProperty(name, value) {
            if (this.focusHiddenProperties.includes(name)) {
                this.focus[name] = value;
                return;
            }
            this[name] = value;
        }
        getProperty(name) {
            if (this.focusHiddenProperties.includes(name)) {
                return this.focus[name];
            }
            return this[name];
        }
    }
    __decorate$4([
        ignoreFromSerialization
    ], CameraSettings.prototype, "focusHiddenProperties", void 0);
    class ImageBuffer {
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
    class PrivateFrameData {
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

    class FeedbackProxy {
        static forFeedback(feedback) {
            const proxy = new FeedbackProxy();
            proxy.feedback = feedback;
            return proxy;
        }
        emit() {
            window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.EmitFeedback]({ feedback: this.feedback.toJSON() });
        }
    }

    var __decorate$3 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var VibrationType;
    (function (VibrationType) {
        VibrationType["default"] = "default";
        VibrationType["selectionHaptic"] = "selectionHaptic";
        VibrationType["successHaptic"] = "successHaptic";
    })(VibrationType || (VibrationType = {}));
    class Vibration extends DefaultSerializeable {
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
    class Sound extends DefaultSerializeable {
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
    __decorate$3([
        ignoreFromSerializationIfNull
    ], Sound.prototype, "resource", void 0);
    class Feedback extends DefaultSerializeable {
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
    __decorate$3([
        ignoreFromSerializationIfNull,
        nameForSerialization('vibration')
    ], Feedback.prototype, "_vibration", void 0);
    __decorate$3([
        ignoreFromSerializationIfNull,
        nameForSerialization('sound')
    ], Feedback.prototype, "_sound", void 0);
    __decorate$3([
        ignoreFromSerialization
    ], Feedback.prototype, "proxy", void 0);

    class CameraProxy {
        static forCamera(camera) {
            const proxy = new CameraProxy();
            proxy.camera = camera;
            return proxy;
        }
        static getLastFrame() {
            return new Promise(resolve => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.GetLastFrame]().then((result) => {
                resolve(PrivateFrameData.fromJSON(JSON.parse(result.data)));
            }));
        }
        static getLastFrameOrNull() {
            return new Promise(resolve => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.GetLastFrameOrNull]()
                .then((frameDataJSONString) => {
                if (!frameDataJSONString) {
                    return resolve(null);
                }
                resolve(PrivateFrameData.fromJSON(JSON.parse(frameDataJSONString.data)));
            }));
        }
        getCurrentState() {
            return new Promise((resolve, reject) => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.GetCurrentCameraState]()
                .then((result) => {
                resolve(result.data);
            }, reject));
        }
        getIsTorchAvailable() {
            return new Promise((resolve, reject) => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.GetIsTorchAvailable]({
                position: this.camera.position,
            }).then((result) => { resolve(result.data); }, reject));
        }
    }

    var __decorate$2 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    class Camera extends DefaultSerializeable {
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
    __decorate$2([
        serializationDefault({})
    ], Camera.prototype, "settings", void 0);
    __decorate$2([
        nameForSerialization('desiredTorchState')
    ], Camera.prototype, "_desiredTorchState", void 0);
    __decorate$2([
        nameForSerialization('desiredState')
    ], Camera.prototype, "_desiredState", void 0);
    __decorate$2([
        ignoreFromSerialization
    ], Camera.prototype, "listeners", void 0);
    __decorate$2([
        ignoreFromSerialization
    ], Camera.prototype, "context", void 0);
    __decorate$2([
        ignoreFromSerialization
    ], Camera.prototype, "_proxy", void 0);

    class ContextStatus {
        static fromJSON(json) {
            const status = new ContextStatus();
            status._code = json.code;
            status._message = json.message;
            status._isValid = json.isValid;
            return status;
        }
        get message() {
            return this._message;
        }
        get code() {
            return this._code;
        }
        get isValid() {
            return this._isValid;
        }
    }

    var DataCaptureContextListenerEvent;
    (function (DataCaptureContextListenerEvent) {
        DataCaptureContextListenerEvent["DidChangeContextStatus"] = "DataCaptureContextListener.onStatusChanged";
        DataCaptureContextListenerEvent["DidStartObservingContext"] = "DataCaptureContextListener.onObservationStarted";
    })(DataCaptureContextListenerEvent || (DataCaptureContextListenerEvent = {}));
    // TODO: adjust when readding framedata to the api https://jira.scandit.com/browse/SDC-1159
    // enum DataCaptureContextFrameListenerEvent {
    //   WillProcessFrame = 'willProcessFrame',
    //   DidProcessFrame = 'didProcessFrame',
    // }
    class DataCaptureContextProxy {
        static forDataCaptureContext(context) {
            const contextProxy = new DataCaptureContextProxy();
            contextProxy.context = context;
            contextProxy.initialize();
            return contextProxy;
        }
        updateContextFromJSON() {
            return new Promise((resolve, reject) => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.UpdateContextFromJSON]({
                context: JSON.stringify(this.context.toJSON()),
            }).then(resolve.bind(this), reject.bind(this)));
        }
        dispose() {
            window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.DisposeContext]();
        }
        initialize() {
            this.subscribeListener();
            this.initializeContextFromJSON();
        }
        initializeContextFromJSON() {
            return new Promise((resolve, reject) => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.ContextFromJSON]({
                context: JSON.stringify(this.context.toJSON()),
            }).then(resolve.bind(this), reject.bind(this)));
        }
        subscribeListener() {
            window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.SubscribeContextListener]();
            window.Capacitor.Plugins[Capacitor.pluginName]
                .addListener(DataCaptureContextListenerEvent.DidChangeContextStatus, this.notifyListeners.bind(this));
            window.Capacitor.Plugins[Capacitor.pluginName]
                .addListener(DataCaptureContextListenerEvent.DidStartObservingContext, this.notifyListeners.bind(this));
        }
        notifyListeners(event) {
            if (!event) {
                // The event could be undefined/null in case the plugin result did not pass a "message",
                // which could happen e.g. in case of "ok" results, which could signal e.g. successful
                // listener subscriptions.
                return;
            }
            this.context.listeners.forEach((listener) => {
                switch (event.name) {
                    case DataCaptureContextListenerEvent.DidChangeContextStatus:
                        if (listener.didChangeStatus) {
                            const contextStatus = ContextStatus.fromJSON(event.status);
                            listener.didChangeStatus(this.context, contextStatus);
                        }
                        break;
                    case DataCaptureContextListenerEvent.DidStartObservingContext:
                        if (listener.didStartObservingContext) {
                            listener.didStartObservingContext(this.context);
                        }
                        break;
                }
            });
            return;
        }
    }

    var __decorate$1 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    class DataCaptureContextSettings extends DefaultSerializeable {
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
    class DataCaptureContext extends DefaultSerializeable {
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
    __decorate$1([
        nameForSerialization('frameSource')
    ], DataCaptureContext.prototype, "_frameSource", void 0);
    __decorate$1([
        ignoreFromSerialization
    ], DataCaptureContext.prototype, "proxy", void 0);
    __decorate$1([
        ignoreFromSerialization
    ], DataCaptureContext.prototype, "listeners", void 0);

    var DataCaptureViewListenerEvent;
    (function (DataCaptureViewListenerEvent) {
        DataCaptureViewListenerEvent["DidChangeSizeOrientation"] = "DataCaptureViewListener.onSizeChanged";
    })(DataCaptureViewListenerEvent || (DataCaptureViewListenerEvent = {}));
    class DataCaptureViewProxy {
        static forDataCaptureView(view) {
            const viewProxy = new DataCaptureViewProxy();
            viewProxy.view = view;
            viewProxy.initialize();
            return viewProxy;
        }
        setPositionAndSize(top, left, width, height, shouldBeUnderWebView) {
            return new Promise((resolve, reject) => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.SetViewPositionAndSize]({
                position: { top, left, width, height, shouldBeUnderWebView },
            }).then(resolve.bind(this), reject.bind(this)));
        }
        show() {
            return window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.ShowView]();
        }
        hide() {
            return window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.HideView]();
        }
        viewPointForFramePoint(point) {
            return new Promise((resolve, reject) => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.ViewPointForFramePoint]({
                point: point.toJSON(),
            }).then((result) => resolve(Point.fromJSON(JSON.parse(result.data))), reject.bind(this)));
        }
        viewQuadrilateralForFrameQuadrilateral(quadrilateral) {
            return new Promise((resolve, reject) => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.ViewQuadrilateralForFrameQuadrilateral]({
                point: quadrilateral.toJSON(),
            }).then((result) => {
                const quadrilateral = Quadrilateral
                    .fromJSON(JSON.parse(result.data));
                resolve(quadrilateral);
            }, reject.bind(this)));
        }
        subscribeListener() {
            window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.SubscribeViewListener]();
            window.Capacitor.Plugins[Capacitor.pluginName]
                .addListener(DataCaptureViewListenerEvent.DidChangeSizeOrientation, this.notifyListeners.bind(this));
        }
        notifyListeners(event) {
            if (!event) {
                // The event could be undefined/null in case the plugin result did not pass a "message",
                // which could happen e.g. in case of "ok" results, which could signal e.g. successful
                // listener subscriptions.
                return;
            }
            event = Object.assign(Object.assign(Object.assign({}, event), event.argument), { argument: undefined });
            this.view.listeners.forEach((listener) => {
                switch (event.name) {
                    case DataCaptureViewListenerEvent.DidChangeSizeOrientation:
                        if (listener.didChangeSize) {
                            const size = Size.fromJSON(event.size);
                            const orientation = event.orientation;
                            listener.didChangeSize(this.view, size, orientation);
                        }
                        break;
                }
            });
        }
        initialize() {
            this.subscribeListener();
        }
    }

    var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    class TorchSwitchControl extends DefaultSerializeable {
        constructor() {
            super(...arguments);
            this.type = 'torch';
            this.icon = {
                on: { default: null, pressed: null },
                off: { default: null, pressed: null },
            };
            this.view = null;
        }
        get torchOffImage() {
            return this.icon.off.default;
        }
        set torchOffImage(torchOffImage) {
            this.icon.off.default = torchOffImage;
            this.view.controlUpdated();
        }
        get torchOffPressedImage() {
            return this.icon.off.pressed;
        }
        set torchOffPressedImage(torchOffPressedImage) {
            this.icon.off.pressed = torchOffPressedImage;
            this.view.controlUpdated();
        }
        get torchOnImage() {
            return this.icon.on.default;
        }
        set torchOnImage(torchOnImage) {
            this.icon.on.default = torchOnImage;
            this.view.controlUpdated();
        }
        get torchOnPressedImage() {
            return this.icon.on.pressed;
        }
        set torchOnPressedImage(torchOnPressedImage) {
            this.icon.on.pressed = torchOnPressedImage;
            this.view.controlUpdated();
        }
    }
    __decorate([
        ignoreFromSerialization
    ], TorchSwitchControl.prototype, "view", void 0);
    class ZoomSwitchControl extends DefaultSerializeable {
        constructor() {
            super(...arguments);
            this.type = 'zoom';
            this.icon = {
                zoomedOut: { default: null, pressed: null },
                zoomedIn: { default: null, pressed: null },
            };
            this.view = null;
        }
        get zoomedOutImage() {
            return this.icon.zoomedOut.default;
        }
        set zoomedOutImage(zoomedOutImage) {
            var _a;
            this.icon.zoomedOut.default = zoomedOutImage;
            (_a = this.view) === null || _a === void 0 ? void 0 : _a.controlUpdated();
        }
        get zoomedInImage() {
            return this.icon.zoomedIn.default;
        }
        set zoomedInImage(zoomedInImage) {
            var _a;
            this.icon.zoomedIn.default = zoomedInImage;
            (_a = this.view) === null || _a === void 0 ? void 0 : _a.controlUpdated();
        }
        get zoomedInPressedImage() {
            return this.icon.zoomedIn.pressed;
        }
        set zoomedInPressedImage(zoomedInPressedImage) {
            var _a;
            this.icon.zoomedIn.pressed = zoomedInPressedImage;
            (_a = this.view) === null || _a === void 0 ? void 0 : _a.controlUpdated();
        }
        get zoomedOutPressedImage() {
            return this.icon.zoomedOut.pressed;
        }
        set zoomedOutPressedImage(zoomedOutPressedImage) {
            var _a;
            this.icon.zoomedOut.pressed = zoomedOutPressedImage;
            (_a = this.view) === null || _a === void 0 ? void 0 : _a.controlUpdated();
        }
    }
    __decorate([
        ignoreFromSerialization
    ], ZoomSwitchControl.prototype, "view", void 0);
    var Anchor;
    (function (Anchor) {
        Anchor["TopLeft"] = "topLeft";
        Anchor["TopCenter"] = "topCenter";
        Anchor["TopRight"] = "topRight";
        Anchor["CenterLeft"] = "centerLeft";
        Anchor["Center"] = "center";
        Anchor["CenterRight"] = "centerRight";
        Anchor["BottomLeft"] = "bottomLeft";
        Anchor["BottomCenter"] = "bottomCenter";
        Anchor["BottomRight"] = "bottomRight";
    })(Anchor || (Anchor = {}));
    class HTMLElementState {
        constructor() {
            this.isShown = false;
            this.position = null;
            this.size = null;
            this.shouldBeUnderContent = false;
        }
        get isValid() {
            return this.isShown !== undefined && this.isShown !== null
                && this.position !== undefined && this.position !== null
                && this.size !== undefined && this.size !== null
                && this.shouldBeUnderContent !== undefined && this.shouldBeUnderContent !== null;
        }
        didChangeComparedTo(other) {
            return this.position !== other.position
                || this.size !== other.size
                || this.shouldBeUnderContent !== other.shouldBeUnderContent;
        }
    }
    class DataCaptureView extends DefaultSerializeable {
        get context() {
            return this._context;
        }
        set context(context) {
            this._context = context;
            if (context) {
                context.view = this;
            }
        }
        get viewProxy() {
            if (!this._viewProxy) {
                this.initialize();
            }
            return this._viewProxy;
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
        /**
         * The current context as a PrivateDataCaptureContext
         */
        get privateContext() {
            return this.context;
        }
        // eslint-disable-next-line @typescript-eslint/member-ordering
        static forContext(context) {
            const view = new DataCaptureView();
            view.context = context;
            return view;
        }
        // eslint-disable-next-line @typescript-eslint/member-ordering
        constructor() {
            super();
            this._context = null;
            this.scanAreaMargins = Capacitor.defaults.DataCaptureView.scanAreaMargins;
            this.pointOfInterest = Capacitor.defaults.DataCaptureView.pointOfInterest;
            this.logoAnchor = Capacitor.defaults.DataCaptureView.logoAnchor;
            this.logoOffset = Capacitor.defaults.DataCaptureView.logoOffset;
            this.focusGesture = Capacitor.defaults.DataCaptureView.focusGesture;
            this.zoomGesture = Capacitor.defaults.DataCaptureView.zoomGesture;
            this.logoStyle = Capacitor.defaults.DataCaptureView.logoStyle;
            this.overlays = [];
            this.controls = [];
            this.listeners = [];
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
        }
        connectToElement(element) {
            this.htmlElement = element;
            this.htmlElementState = new HTMLElementState();
            // Initial update
            this.elementDidChange();
            this.subscribeToChangesOnHTMLElement();
        }
        detachFromElement() {
            this.unsubscribeFromChangesOnHTMLElement();
            this.htmlElement = null;
            this.elementDidChange();
        }
        setFrame(frame, isUnderContent = false) {
            return this.viewProxy.setPositionAndSize(frame.origin.y, frame.origin.x, frame.size.width, frame.size.height, isUnderContent);
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
            if (this.overlays.includes(overlay)) {
                return;
            }
            this.overlays.push(overlay);
            this.privateContext.update();
        }
        removeOverlay(overlay) {
            if (!this.overlays.includes(overlay)) {
                return;
            }
            this.overlays.splice(this.overlays.indexOf(overlay), 1);
            this.privateContext.update();
        }
        addListener(listener) {
            if (!this.listeners.includes(listener)) {
                this.listeners.push(listener);
            }
        }
        removeListener(listener) {
            if (this.listeners.includes(listener)) {
                this.listeners.splice(this.listeners.indexOf(listener), 1);
            }
        }
        viewPointForFramePoint(point) {
            return this.viewProxy.viewPointForFramePoint(point);
        }
        viewQuadrilateralForFrameQuadrilateral(quadrilateral) {
            return this.viewProxy.viewQuadrilateralForFrameQuadrilateral(quadrilateral);
        }
        addControl(control) {
            if (!this.controls.includes(control)) {
                this.controls.push(control);
                this.privateContext.update();
            }
        }
        removeControl(control) {
            if (this.controls.includes(control)) {
                control.view = null;
                this.controls.splice(this.overlays.indexOf(control), 1);
                this.privateContext.update();
            }
        }
        controlUpdated() {
            this.privateContext.update();
        }
        initialize() {
            if (this._viewProxy) {
                return;
            }
            this._viewProxy = DataCaptureViewProxy.forDataCaptureView(this);
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
            newState.position = { top: boundingRect.top, left: boundingRect.left };
            newState.size = { width: boundingRect.width, height: boundingRect.height };
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
            this.viewProxy.setPositionAndSize(this.htmlElementState.position.top, this.htmlElementState.position.left, this.htmlElementState.size.width, this.htmlElementState.size.height, this.htmlElementState.shouldBeUnderContent);
        }
        _show() {
            if (!this.context) {
                throw new Error('There should be a context attached to a view that should be shown');
            }
            this.privateContext.initialize();
            return this.viewProxy.show();
        }
        _hide() {
            if (!this.context) {
                throw new Error('There should be a context attached to a view that should be shown');
            }
            return this.viewProxy.hide();
        }
    }
    __decorate([
        ignoreFromSerialization
    ], DataCaptureView.prototype, "_context", void 0);
    __decorate([
        ignoreFromSerialization
    ], DataCaptureView.prototype, "_viewProxy", void 0);
    __decorate([
        ignoreFromSerialization
    ], DataCaptureView.prototype, "listeners", void 0);
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
            return '6.19.4';
        }
    }

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
            this.subscriber = window.Capacitor.Plugins[Capacitor.pluginName]
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

    var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    const corePluginName = 'ScanditCaptureCorePlugin';
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
                    LaserlineViewfinder,
                    RectangularViewfinder,
                    LaserlineViewfinderStyle,
                    RectangularViewfinderAnimation,
                    RectangularViewfinderLineStyle,
                    RectangularViewfinderStyle,
                    AimerViewfinder,
                    CameraPosition,
                    CameraSettings,
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
                    HTMLElementState,
                    MeasureUnit,
                    NoneLocationSelection,
                    SizingMode,
                    Sound,
                    NoViewfinder,
                    Vibration,
                    VolumeButtonObserver,
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
    core.registerPlugin(corePluginName, {
        android: () => new ScanditCaptureCorePluginImplementation(),
        ios: () => new ScanditCaptureCorePluginImplementation(),
        web: () => new ScanditCaptureCorePluginImplementation(),
    });
    // tslint:disable-next-line:variable-name
    const ScanditCaptureCorePlugin = new ScanditCaptureCorePluginImplementation();

    exports.ScanditCaptureCorePlugin = ScanditCaptureCorePlugin;
    exports.ScanditCaptureCorePluginImplementation = ScanditCaptureCorePluginImplementation;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({}, capacitorExports);
//# sourceMappingURL=plugin.js.map
