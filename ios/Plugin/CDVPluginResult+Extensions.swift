/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2023- Scandit AG. All rights reserved.
 */

import Capacitor

public struct ListenerEvent {
    public enum Name: String, Decodable {
        // Context listener
        case didChangeContextStatus = "didChangeStatus"
        case didStartObservingContext = "didStartObservingContext"

        // Context frame listener
        case willProcessFrame = "willProcessFrame"
        case didProcessFrame = "didProcessFrame"

        // View listener
        case didChangeSize = "didChangeSizeOrientation"

        // Barcode Capture listener
        case didScanInBarcodeCapture = "onBarcodeScannedEvent"
        case didUpdateSessionInBarcodeCapture = "onSessionUpdateEvent"

        // Barcode Tracking listener
        case didUpdateSessionInBarcodeTracking = "onTrackingSessionUpdateEvent"

        // Barcode Tracking Basic Overlay listener
        case brushForTrackedBarcode = "onBrushForTrackedBarcodeEvent"
        case didTapTrackedBarcode = "onDidTapTrackedBarcodeEvent"

        // Barcode Tracking Advanced Overlay listener
        case viewForTrackedBarcode = "onViewForTrackedBarcodeEvent"
        case anchorForTrackedBarcode = "onAnchorForTrackedBarcodeEvent"
        case offsetForTrackedBarcode = "onOffsetForTrackedBarcodeEvent"
        case didTapViewForTrackedBarcode = "onTapViewForTrackedBarcodeEvent"

        // Barcode Selection listener
        case didUpdateSelectionInBarcodeSelection = "didUpdateSelectionInBarcodeSelection"
        case didUpdateSessionInBarcodeSelection = "didUpdateSessionInBarcodeSelection"

        // Text Capture Listener
        case didCaptureInTextCapture = "didCaptureInTextCapture"

        // ID Capture Listener
        case didCaptureInIdCapture = "didCaptureInIdCapture"
        case didFailInIdCapture = "didFailInIdCapture"
        case didLocalizeInIdCapture = "didLocalizeInIdCapture"
        case didRejectInIdCapture = "didRejectInIdCapture"

        // VolumeButtonObserver
        case didChangeVolume = "didChangeVolume"
    }

    public let name: Name
    public let argument: CommandError.JSONMessage
    let shouldNotifyWhenFinished: Bool

    public init(name: Name, argument: CommandError.JSONMessage = [:], shouldNotifyWhenFinished: Bool = false) {
        self.name = name
        self.argument = argument
        self.shouldNotifyWhenFinished = shouldNotifyWhenFinished
    }

    public var resultMessage: CommandError.JSONMessage {
        return [
            "name": name.rawValue,
            "finishCallbackID": name.rawValue,
            "argument": argument,
            "shouldNotifyWhenFinished": shouldNotifyWhenFinished
        ]
    }
}

public struct CommandError {

    public typealias JSONMessage = [AnyHashable: AnyHashable]

    public enum Code: Int, CaseIterable {
        case invalidJSON = 10001

        case couldNotDeserializeContext = 10011

        case noViewToBeShown = 10021
        case noViewToBeHidden = 10022

        case cantConvertPointWithoutView = 10031
        case cantConvertQuadrilateralWithoutView = 10032

        case noCamera = 10042
        case couldNotSwitchCamera = 10043
        case noCameraWithPosition = 10044

        case trackedBarcodeNotFound = 10051

        case parserNotFound = 10061
        case couldNotParseString = 10062
        case couldNotParseRawString = 10063

        case noOverlay = 10071
        case noBarcodeSelection = 10072
        case noBarcodeSelectionSession = 10073
        case noBarcodeSelectionOverlay = 10074
        case noBarcodeCaptureSession = 10075
        case noBarcodeTrackingSession = 10076

        case noFrameData = 10077
    }

    public static let invalidJSON = CommandError(code: .invalidJSON,
                                                 message: "Invalid or no JSON passed for command")

    public static func couldNotDeserializeContext(reason additionalInformation: String) -> CommandError {
        return CommandError(code: .couldNotDeserializeContext,
                            message: "Could not deserialize context: \(additionalInformation)")
    }

    public static let noViewToBeShown = CommandError(code: .noViewToBeShown,
                                                     message: "There was no capture view to be shown")
    public static let noViewToBeHidden = CommandError(code: .noViewToBeHidden,
                                                      message: "There was no capture view to be hidden")

    public static let cantConvertPointWithoutView = CommandError(code: .cantConvertPointWithoutView,
                                                                 message: """
        There is no view shown, so the point can not be converted into its coordinate space
        """)
    public static let cantConvertQuadrilateralWithoutView = CommandError(code: .cantConvertQuadrilateralWithoutView,
                                                                         message: """
        There is no view shown, so the quadrilateral can not be converted into its coordinate space
        """)

    public static let noCamera = CommandError(code: .noCamera,
                                              message: "No camera available or not yet initialized")
    public static let couldNotSwitchCamera = CommandError(code: .couldNotSwitchCamera,
                                                          message: "Could not switch camera to desired state")
    public static func noCamera(withPosition position: String) -> CommandError {
        return CommandError(code: .noCameraWithPosition,
                            message: "No camera available with position \(position)")
    }

    public static let trackedBarcodeNotFound = CommandError(code: .trackedBarcodeNotFound,
                                                            message: """
        Passed tracked barcode not found in current session
        """)

    public static let parserNotFound = CommandError(code: .parserNotFound,
                                                    message: """
        A parser with the passed component identifier was not found
        """)

    public static func couldNotParseString(reason additionalInformation: String) -> CommandError {
        return CommandError(code: .couldNotParseString,
                            message: "Could not parse string: \(additionalInformation)")
    }

    public static func couldNotParseRawData(reason additionalInformation: String) -> CommandError {
        return CommandError(code: .couldNotParseRawString,
                            message: "Could not parse raw string: \(additionalInformation)")
    }

    public static let noOverlay = CommandError(code: .noOverlay,
                                               message: "There was no overlay to execute the command on")

    public static let noBarcodeSelection = CommandError(code: .noBarcodeSelection,
                                               message: """
                                                There was no BarcodeSelection mode to execute the command on
                                                """)

    public static let noBarcodeCaptureSession = CommandError(code: .noBarcodeCaptureSession,
                                               message: """
                                                There was no BarcodeCapture session to execute the command on
                                                """)

    public static let noBarcodeTrackingSession = CommandError(code: .noBarcodeTrackingSession,
                                               message: """
                                                There was no BarcodeTracking session to execute the command on
                                                """)

    public static let noBarcodeSelectionSession = CommandError(code: .noBarcodeSelectionSession,
                                               message: """
                                                There was no BarcodeSelection session to execute the command on
                                                """)

    public static let noBarcodeSelectionOverlay = CommandError(code: .noBarcodeSelectionOverlay,
                                               message: """
                                                There was no BarcodeSelection overlay to execute the command on
                                                """)

    public static let noFrameData = CommandError(code: .noFrameData,
                                                 message: """
                                                  There was no FrameData to execute the command on
                                                  """)

    public let code: Code
    public let message: String

    public func toJSON() -> JSONMessage {
        return [
            "code": code.rawValue,
            "message": message
        ]
    }

    public func toJSONString() -> String {
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: self.toJSON())
            return String(data: jsonData, encoding: .ascii) ?? ""
        } catch {
            print(error.localizedDescription)
            return ""
        }
    }
}

extension NSError {
    var jsonMessage: CommandError.JSONMessage {
        return [
            "code": code,
            "message": description
        ]
    }
}
