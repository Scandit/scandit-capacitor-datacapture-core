/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2023- Scandit AG. All rights reserved.
 */

import ScanditCaptureCore

public struct ScanditCaptureCoreDefaults: Encodable {
    public struct CameraSettingsDefaults: Encodable {
        let preferredResolution: String
        let zoomFactor: Float
        let focusRange: String
        let zoomGestureZoomFactor: Float
        let focusGestureStrategy: String
        let shouldPreferSmoothAutoFocus: Bool
    }

    public struct CameraDefaults: Encodable {
        let Settings: CameraSettingsDefaults
        let defaultPosition: String?
        let availablePositions: [String]
    }

    public struct DataCaptureViewDefaults: Encodable {
        let scanAreaMargins: String
        let pointOfInterest: String
        let logoAnchor: String
        let logoOffset: String
        let focusGesture: String?
        let zoomGesture: String?
        let logoStyle: String
    }

    public struct LaserlineViewfinderDefaults: Encodable {
        let defaultStyle: String
        let styles: [String: LaserlineViewfinderStyleDefaults]
    }

    public struct LaserlineViewfinderStyleDefaults: Encodable {
        let style: String
        let width: String
        let enabledColor: String
        let disabledColor: String
    }

    public struct RectangularViewfinderDefaults: Encodable {
        let defaultStyle: String
        let styles: [String: RectangularViewfinderStyleDefaults]
    }

    public struct RectangularViewfinderStyleDefaults: Encodable {
        let style: String
        let size: String
        let color: String
        let lineStyle: String
        let dimming: Float
        let disabledDimming: Float
        let animation: String?
    }

    struct AimerViewfinderDefaults: Encodable {
        let frameColor: String
        let dotColor: String
    }

    public struct BrushDefaults: Encodable {
        let fillColor: String
        let strokeColor: String
        let strokeWidth: Int
    }

    let Camera: CameraDefaults
    let DataCaptureView: DataCaptureViewDefaults
    let LaserlineViewfinder: LaserlineViewfinderDefaults
    let RectangularViewfinder: RectangularViewfinderDefaults
    let AimerViewfinder: AimerViewfinderDefaults
    let Brush: BrushDefaults

    let deviceID: String?
    let capacitorVersion: String?

    init(cameraSettings: CameraSettings,
         dataCaptureView: DataCaptureView,
         laserlineViewfinder: LaserlineViewfinder,
         rectangularViewfinder: RectangularViewfinder,
         aimerViewfinder: AimerViewfinder,
         brush: Brush) {
        self.Camera = CameraDefaults.from(cameraSettings)
        self.DataCaptureView = DataCaptureViewDefaults.from(dataCaptureView)
        self.LaserlineViewfinder = LaserlineViewfinderDefaults.from(laserlineViewfinder)
        self.RectangularViewfinder = RectangularViewfinderDefaults.from(rectangularViewfinder)
        self.AimerViewfinder = AimerViewfinderDefaults.from(aimerViewfinder)
        self.Brush = BrushDefaults.from(brush)
        self.deviceID = DataCaptureContext.deviceID
        self.capacitorVersion = Bundle.allFrameworks
            .first(where: {$0.bundleIdentifier?.contains("org.cocoapods.Capacitor") ?? false})?
            .object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String
    }
}

public extension ScanditCaptureCoreDefaults.CameraDefaults {
    typealias Defaults = ScanditCaptureCoreDefaults.CameraDefaults

    static func from(_ cameraSettings: CameraSettings) -> Defaults {
        let availableCameras = [
            CameraPosition.userFacing.jsonString: Camera(position: .userFacing),
            CameraPosition.worldFacing.jsonString: Camera(position: .worldFacing)
        ]
        let availablePositions = Array(availableCameras.keys)

        return Defaults(Settings: ScanditCaptureCoreDefaults.CameraSettingsDefaults.from(cameraSettings),
                        defaultPosition: Camera.default?.position.jsonString,
                        availablePositions: availablePositions)
    }
}

public extension ScanditCaptureCoreDefaults.CameraSettingsDefaults {
    typealias Defaults = ScanditCaptureCoreDefaults.CameraSettingsDefaults

    static func from(_ cameraSettings: CameraSettings) -> Defaults {
        return Defaults(preferredResolution: cameraSettings.preferredResolution.jsonString,
                        zoomFactor: Float(cameraSettings.zoomFactor),
                        focusRange: cameraSettings.focusRange.jsonString,
                        zoomGestureZoomFactor: Float(cameraSettings.zoomGestureZoomFactor),
                        focusGestureStrategy: cameraSettings.focusGestureStrategy.jsonString,
                        shouldPreferSmoothAutoFocus: cameraSettings.shouldPreferSmoothAutoFocus)
    }
}

public extension ScanditCaptureCoreDefaults.DataCaptureViewDefaults {
    typealias Defaults = ScanditCaptureCoreDefaults.DataCaptureViewDefaults

    static func from(_ dataCaptureView: DataCaptureView) -> Defaults {
        return Defaults(scanAreaMargins: dataCaptureView.scanAreaMargins.jsonString,
                        pointOfInterest: dataCaptureView.pointOfInterest.jsonString,
                        logoAnchor: dataCaptureView.logoAnchor.jsonString,
                        logoOffset: dataCaptureView.logoOffset.jsonString,
                        focusGesture: dataCaptureView.focusGesture?.jsonString,
                        zoomGesture: dataCaptureView.zoomGesture?.jsonString,
                        logoStyle: dataCaptureView.logoStyle.jsonString)
    }
}

public extension ScanditCaptureCoreDefaults.LaserlineViewfinderDefaults {
    internal typealias Defaults = ScanditCaptureCoreDefaults.LaserlineViewfinderDefaults
    internal typealias StyleDefaults = ScanditCaptureCoreDefaults.LaserlineViewfinderStyleDefaults

    internal static func from(_ viewfinder: LaserlineViewfinder) -> Defaults {
        func createViewfinderDefaults(style: LaserlineViewfinderStyle) -> StyleDefaults {
            let viewfinder = LaserlineViewfinder(style: style)

            return StyleDefaults(
                style: viewfinder.style.jsonString,
                width: viewfinder.width.jsonString,
                enabledColor: viewfinder.enabledColor.sdcHexString,
                disabledColor: viewfinder.disabledColor.sdcHexString
            )
        }

        return Defaults(
            defaultStyle: LaserlineViewfinder().style.jsonString,
            styles: [
                LaserlineViewfinderStyle.animated.jsonString: createViewfinderDefaults(style: .animated),
                LaserlineViewfinderStyle.legacy.jsonString: createViewfinderDefaults(style: .legacy)
            ]
        )
    }
}

extension ScanditCaptureCoreDefaults.AimerViewfinderDefaults {
    typealias Defaults = ScanditCaptureCoreDefaults.AimerViewfinderDefaults

    static func from(_ viewfinder: AimerViewfinder) -> Defaults {
        return Defaults(frameColor: viewfinder.frameColor.sdcHexString,
                        dotColor: viewfinder.dotColor.sdcHexString)
    }
}

public extension ScanditCaptureCoreDefaults.RectangularViewfinderDefaults {
    internal typealias Defaults = ScanditCaptureCoreDefaults.RectangularViewfinderDefaults
    internal typealias StyleDefaults = ScanditCaptureCoreDefaults.RectangularViewfinderStyleDefaults

    internal static func from(_ viewfinder: RectangularViewfinder) -> Defaults {
        func createViewfinderDefaults(style: RectangularViewfinderStyle) -> StyleDefaults {
            let viewfinder = RectangularViewfinder(style: style)

            return StyleDefaults(
                style: viewfinder.style.jsonString,
                size: viewfinder.sizeWithUnitAndAspect.jsonString,
                color: viewfinder.color.sdcHexString,
                lineStyle: viewfinder.lineStyle.jsonString,
                dimming: Float(viewfinder.dimming),
                disabledDimming: Float(viewfinder.disabledDimming),
                animation: viewfinder.animation?.jsonString
            )
        }

        return Defaults(
            defaultStyle: RectangularViewfinder().style.jsonString,
            styles: [
                RectangularViewfinderStyle.square.jsonString: createViewfinderDefaults(style: .square),
                RectangularViewfinderStyle.rounded.jsonString: createViewfinderDefaults(style: .rounded),
                RectangularViewfinderStyle.legacy.jsonString: createViewfinderDefaults(style: .legacy)
            ]
        )
    }
}

public extension ScanditCaptureCoreDefaults.BrushDefaults {
    typealias Defaults = ScanditCaptureCoreDefaults.BrushDefaults

    static func from(_ brush: Brush) -> Defaults {
        return Defaults(fillColor: brush.fillColor.sdcHexString,
                        strokeColor: brush.strokeColor.sdcHexString,
                        strokeWidth: Int(brush.strokeWidth))
    }
}
