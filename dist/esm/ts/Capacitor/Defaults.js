import { Color, MarginsWithUnit, NumberWithUnit, PointWithUnit, SizeWithUnitAndAspect, } from '../Common';
import { PrivateFocusGestureDeserializer, PrivateZoomGestureDeserializer, } from '../DataCaptureView+Related';
import { RectangularViewfinderAnimation, } from '../Viewfinder+Related';
export const defaultsFromJSON = (json) => {
    return {
        Camera: {
            Settings: {
                preferredResolution: json.Camera.Settings.preferredResolution,
                zoomFactor: json.Camera.Settings.zoomFactor,
                focusRange: json.Camera.Settings.focusRange,
                zoomGestureZoomFactor: json.Camera.Settings.zoomGestureZoomFactor,
                focusGestureStrategy: json.Camera.Settings.focusGestureStrategy,
                shouldPreferSmoothAutoFocus: json.Camera.Settings.shouldPreferSmoothAutoFocus,
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
//# sourceMappingURL=Defaults.js.map