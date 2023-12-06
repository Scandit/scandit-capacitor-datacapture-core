/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2023- Scandit AG. All rights reserved.
 */

import WebKit
import Foundation
import Capacitor

import ScanditCaptureCore

public protocol DataCapturePlugin where Self: CAPPlugin {
    var modeDeserializers: [DataCaptureModeDeserializer] { get }
    var componentDeserializers: [DataCaptureComponentDeserializer] { get }
    var components: [DataCaptureComponent] { get }
}

@objc(ScanditCaptureCore)
// swiftlint:disable:next type_body_length
public class ScanditCaptureCore: CAPPlugin {

    public static var dataCapturePlugins = [DataCapturePlugin]()

    public var context: DataCaptureContext?

    var captureView: DataCaptureView? {
        didSet {
            guard oldValue != captureView else { return }

            if let oldValue = oldValue {
                captureViewConstraints.captureView = nil
                oldValue.removeFromSuperview()
            }

            guard let captureView = captureView else {
                return
            }

            captureView.addListener(self)

            captureView.isHidden = true
            captureView.translatesAutoresizingMaskIntoConstraints = false

            webView?.addSubview(captureView)
            captureViewConstraints.captureView = captureView
        }
    }

    public static var lastFrame: FrameData?

    private var volumeButtonObserver: VolumeButtonObserver?

    private lazy var captureViewConstraints = DataCaptureViewConstraints(relativeTo: webView!)

    private lazy var viewDeserializer: DataCaptureViewDeserializer = {
        let deserializer = DataCaptureViewDeserializer(modeDeserializers: modeDeserializers)
        deserializer.delegate = self
        return deserializer
    }()

    private lazy var frameSourceDeserializer: FrameSourceDeserializer = {
        let deserializer = FrameSourceDeserializer(modeDeserializers: modeDeserializers)
        deserializer.delegate = self
        return deserializer
    }()

    private lazy var modeDeserializers: [DataCaptureModeDeserializer] = {
        return ScanditCaptureCore.dataCapturePlugins.reduce(into: []) { deserializers, plugin in
            deserializers.append(contentsOf: plugin.modeDeserializers)
        }
    }()

    private lazy var componentDeserializers: [DataCaptureComponentDeserializer] = {
        return ScanditCaptureCore.dataCapturePlugins.reduce(into: []) { deserializers, plugin in
            deserializers.append(contentsOf: plugin.componentDeserializers)
        }
    }()

    private lazy var components: [DataCaptureComponent] = {
        return ScanditCaptureCore.dataCapturePlugins.reduce(into: []) { components, plugin in
            components.append(contentsOf: plugin.components)
        }
    }()

    public lazy var deserializer: DataCaptureContextDeserializer = {
        let deserializer = DataCaptureContextDeserializer(frameSourceDeserializer: self.frameSourceDeserializer,
                                                          viewDeserializer: viewDeserializer,
                                                          modeDeserializers: modeDeserializers,
                                                          componentDeserializers: componentDeserializers)
        deserializer.avoidThreadDependencies = true
        return deserializer
    }()

    public func onReset() {
        // Remove the data capture view
        captureView = nil

        // Dispose of the context
        context?.dispose()
        context = nil

        volumeButtonObserver = nil
    }

    // MARK: - DataCaptureContextProxy

    // MARK: Context deserialization

    @objc(contextFromJSON:)
    public func contextFromJSON(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let jsonString = call.options["context"] as! String? else {
                call.reject(CommandError.invalidJSON.toJSONString())
                return
            }

            self.context?.dispose()

            do {
                self.context = try self.deserializer.context(fromJSONString: jsonString).context
            } catch let error {
                call.reject(error.localizedDescription)
                return
            }

            self.context!.addListener(self)

            call.resolve()
        }
    }

    @objc(updateContextFromJSON:)
    func updateContextFromJSON(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let jsonString = call.options["context"] as! String? else {
                call.reject(CommandError.invalidJSON.toJSONString())
                return
            }

            guard let context = self.context else {
                return self.contextFromJSON(call)
            }

            do {
                try self.deserializer.update(context,
                                             view: self.captureView,
                                             components: self.components,
                                             fromJSON: jsonString)
            } catch let error {
                call.reject(error.localizedDescription)
                return
            }

            call.resolve()
        }
    }

    // MARK: Listeners

    @objc(subscribeContextListener:)
    func subscribeContextListener(_ call: CAPPluginCall) {
        call.resolve()
    }

    @objc(subscribeContextFrameListener:)
    func subscribeContextFrameListener(_ call: CAPPluginCall) {
        call.resolve()
    }

    @objc(subscribeViewListener:)
    func subscribeViewListener(_ call: CAPPluginCall) {
        call.resolve()
    }

    @objc(subscribeVolumeButtonObserver:)
    func subscribeVolumeButtonObserver(_ call: CAPPluginCall) {
        volumeButtonObserver = VolumeButtonObserver(handler: { [weak self] in
            guard let self = self else {
                return
            }
            let event = ListenerEvent(name: .didChangeVolume)
            self.notifyListeners(event.name.rawValue, data: [:])
        })
        call.resolve()
    }

    @objc(unsubscribeVolumeButtonObserver:)
    func unsubscribeVolumeButtonObserver(_ call: CAPPluginCall) {
        volumeButtonObserver = nil
        call.resolve()
    }

    // MARK: Context related

    @objc(disposeContext:)
    func disposeContext(_ call: CAPPluginCall) {
        context?.dispose()
        call.resolve()
    }

    // MARK: - DataCaptureViewProxy

    @objc(setViewPositionAndSize:)
    func setViewPositionAndSize(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let jsonObject = call.getObject("position")
            guard let viewPositionAndSizeJSON = try? ViewPositionAndSizeJSON.fromJSONObject(jsonObject as Any) else {
                call.reject(CommandError.invalidJSON.toJSONString())
                return
            }

            self.captureViewConstraints.updatePositionAndSize(fromJSON: viewPositionAndSizeJSON)

            if viewPositionAndSizeJSON.shouldBeUnderWebView {
                // Make the WebView transparent, so we can see views behind
                self.webView?.isOpaque = false
                self.webView?.backgroundColor = .clear
                self.webView?.scrollView.backgroundColor = .clear
            } else {
                self.webView?.isOpaque = true
                self.webView?.backgroundColor = nil
                self.webView?.scrollView.backgroundColor = nil
            }

            call.resolve()
        }
    }

    @objc(showView:)
    func showView(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let captureView = self.captureView else {
                call.reject(CommandError.noViewToBeShown.toJSONString())
                return
            }

            captureView.isHidden = false

            call.resolve()
        }
    }

    @objc(hideView:)
    func hideView(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let captureView = self.captureView else {
                call.reject(CommandError.noViewToBeHidden.toJSONString())
                return
            }

            captureView.isHidden = true

            call.resolve()
        }
    }

    // MARK: View related

    @objc(viewPointForFramePoint:)
    func viewPointForFramePoint(_ call: CAPPluginCall) {
        guard let captureView = captureView else {
            call.reject(CommandError.cantConvertPointWithoutView.toJSONString())
            return
        }

        guard let pointJSON = try? PointJSON.fromJSONObject(call.options["point"] as Any) else {
            call.reject(CommandError.invalidJSON.toJSONString())
            return
        }

        let convertedPoint = captureView.viewPoint(forFramePoint: pointJSON.cgPoint)

        call.resolve([
            "x": convertedPoint.x,
            "y": convertedPoint.y
        ])
    }

    @objc(viewQuadrilateralForFrameQuadrilateral:)
    func viewQuadrilateralForFrameQuadrilateral(_ call: CAPPluginCall) {
        guard let captureView = captureView else {
            call.reject(CommandError.cantConvertQuadrilateralWithoutView.toJSONString())
            return
        }

        guard let jsonString = (call.options["point"] as? NSDictionary)?.jsonString,
              let quad = Quadrilateral(JSONString: jsonString) else {
            call.reject(CommandError.invalidJSON.toJSONString())
            return
        }

        let convertedQuadrilateral = captureView.viewQuadrilateral(forFrameQuadrilateral: quad)

        call.resolve([
            "topLeft": convertedQuadrilateral.topLeft.json,
            "topRight": convertedQuadrilateral.topRight.json,
            "bottomLeft": convertedQuadrilateral.bottomLeft.json,
            "bottomRight": convertedQuadrilateral.bottomRight.json
        ])
    }

    // MARK: - CameraProxy

    @objc(getCurrentCameraState:)
    func getCurrentCameraState(_ call: CAPPluginCall) {
        guard let camera = context?.frameSource as? Camera else {
            call.reject(CommandError.noCamera.toJSONString())
            return
        }

        call.resolve([
            "state": camera.currentState.jsonString
        ])
    }

    @objc(getIsTorchAvailable:)
    func getIsTorchAvailable(_ call: CAPPluginCall) {
        guard let jsonString = (call.options["position"] as? NSDictionary)?.jsonString,
              let cameraPosition = CameraPosition(JSONString: jsonString)
        else {
            call.reject(CommandError.invalidJSON.toJSONString())
            return
        }

        guard let camera = Camera(position: cameraPosition) else {
            call.reject(CommandError.noCamera(withPosition: cameraPosition.jsonString).toJSONString())
            return
        }

        call.resolve([
            "isTorchAvailable": camera.isTorchAvailable
        ])
    }

    // MARK: - Defaults

    @objc(getDefaults:)
    func getDefaults(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let temporaryCameraSettings = CameraSettings()
            let temporaryView = DataCaptureView.init(frame: CGRect.zero)

            let defaults = ScanditCaptureCoreDefaults(cameraSettings: temporaryCameraSettings,
                                                      dataCaptureView: temporaryView,
                                                      laserlineViewfinder: LaserlineViewfinder(),
                                                      rectangularViewfinder: RectangularViewfinder(),
                                                      aimerViewfinder: AimerViewfinder(),
                                                      brush: Brush())
            var defaultsDictionary: [String: Any]? {
                    guard let data = try? JSONEncoder().encode(defaults) else { return nil }
                    guard let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] else {
                        return nil
                    }
                    return json
                }

            call.resolve(defaultsDictionary ?? [:])
        }
    }

    // MARK: - FeedbackProxy

    @objc(emitFeedback:)
    func emitFeedback(_ call: CAPPluginCall) {
        guard let jsonString = (call.options["feedback"] as? NSDictionary)?.jsonString,
              let feedback = try? Feedback(fromJSONString: jsonString)
        else {
            call.reject(CommandError.invalidJSON.toJSONString())
            return
        }

        feedback.emit()
    }

    @objc(getLastFrame:)
    func getLastFrame(_ call: CAPPluginCall) {
        guard let lastFrame = ScanditCaptureCore.lastFrame else {
            call.reject(CommandError.noFrameData.toJSONString())
            return
        }
        call.resolve([
            "data": lastFrame.jsonString
        ])
    }

    @objc(getLastFrameOrNull:)
    func getLastFrameOrNull(_ call: CAPPluginCall) {
        call.resolve([
            "data": ScanditCaptureCore.lastFrame,
        ])
    }
}
