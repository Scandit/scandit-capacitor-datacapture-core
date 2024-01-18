import { DefaultSerializeable } from './Serializeable';
export class PrivateFocusGestureDeserializer {
    static fromJSON(json) {
        if (json && json.type === new TapToFocus().type) {
            return new TapToFocus();
        }
        else {
            return null;
        }
    }
}
export class TapToFocus extends DefaultSerializeable {
    constructor() {
        super();
        this.type = 'tapToFocus';
    }
}
export class PrivateZoomGestureDeserializer {
    static fromJSON(json) {
        if (json && json.type === new SwipeToZoom().type) {
            return new SwipeToZoom();
        }
        else {
            return null;
        }
    }
}
export class SwipeToZoom extends DefaultSerializeable {
    constructor() {
        super();
        this.type = 'swipeToZoom';
    }
}
export var LogoStyle;
(function (LogoStyle) {
    LogoStyle["Minimal"] = "minimal";
    LogoStyle["Extended"] = "extended";
})(LogoStyle || (LogoStyle = {}));
//# sourceMappingURL=DataCaptureView+Related.js.map