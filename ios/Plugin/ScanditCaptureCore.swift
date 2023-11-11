/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2023- Scandit AG. All rights reserved.
 */

import WebKit
import Foundation
import Capacitor

import ScanditCaptureCore
import ScanditFrameworksCore

public protocol ContextChangeListener: AnyObject {
    func context(didChange context: DataCaptureContext?)
}

@objc(ScanditCapacitorCore)
// swiftlint:disable:next type_body_length
public class ScanditCapacitorCore: CAPPlugin {

    private var coreModule: CoreModule!

    public var context: DataCaptureContext? {
        didSet {
            Self.context = context
            os_unfair_lock_lock(&Self.contextListenersLock)
            defer { os_unfair_lock_unlock(&Self.contextListenersLock) }
            Self.contextListeners.compactMap { $0 as? ContextChangeListener }.forEach {
                $0.context(didChange: context)
            }
        }
    }

    private static var context: DataCaptureContext?

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

            captureView.isHidden = true
            captureView.translatesAutoresizingMaskIntoConstraints = false

            webView?.addSubview(captureView)
            captureViewConstraints.captureView = captureView
        }
    }

    public static func registerModeDeserializer(_ modeDeserializer: DataCaptureModeDeserializer) {
        Deserializers.Factory.add(modeDeserializer)
    }

    public static func unregisterModeDeserializer(_ modeDeserialzer: DataCaptureModeDeserializer) {
        Deserializers.Factory.remove(modeDeserialzer)
    }

    public static func registerComponentDeserializer(_ componentDeserializer: DataCaptureComponentDeserializer) {
        Deserializers.Factory.add(componentDeserializer)
    }

    public static func unregisterComponentDeserializer(_ componentDeserializer: DataCaptureComponentDeserializer) {
        Deserializers.Factory.remove(componentDeserializer)
    }

    private static var contextListenersLock = os_unfair_lock()
    private static var contextListeners = NSMutableSet()

    public static func registerContextChangeListener(listener: ContextChangeListener) {
        if Self.contextListeners.contains(listener) {
            return
        }
        Self.contextListeners.add(listener)
        listener.context(didChange: context)
    }

    public static func unregisterContextChangeListener(listener: ContextChangeListener) {
        if Self.contextListeners.contains(listener) {
            Self.contextListeners.remove(listener)
        }
    }

    public static var lastFrame: FrameData? {
        get {
            LastFrameData.shared.frameData
        }
        set {
            LastFrameData.shared.frameData = newValue
        }
    }

    private var volumeButtonObserver: VolumeButtonObserver?

    private lazy var captureViewConstraints = DataCaptureViewConstraints(relativeTo: webView!)

    public override func load() {
        super.load()
        let emitter = CapacitorEventEmitter(with: self)
        let frameSourceListener = FrameworksFrameSourceListener(eventEmitter: emitter)
        let framesourceDeserializer = FrameworksFrameSourceDeserializer(
            frameSourceListener: frameSourceListener,
            torchListener: frameSourceListener
        )
        let contextDeserializer = FrameworksDataCaptureContextListener(eventEmitter: emitter)
        let viewListener = FrameworksDataCaptureViewListener(eventEmitter: emitter)
        coreModule = CoreModule(frameSourceDeserializer: framesourceDeserializer,
                                frameSourceListener: frameSourceListener,
                                dataCaptureContextListener: contextDeserializer,
                                dataCaptureViewListener: viewListener)
        coreModule.didStart()
        DeserializationLifeCycleDispatcher.shared.attach(observer: self)
        coreModule.registerDataCaptureContextListener()
        coreModule.registerDataCaptureViewListener()
        coreModule.registerFrameSourceListener()
    }

    @objc
    func onReset() {
        coreModule.didStop()
        DeserializationLifeCycleDispatcher.shared.detach(observer: self)
        coreModule.unregisterDataCaptureContextListener()
        coreModule.unregisterDataCaptureViewListener()
        coreModule.unregisterFrameSourceListener()
    }

    // MARK: Context deserialization

    @objc(contextFromJSON:)
    public func contextFromJSON(_ call: CAPPluginCall) {
        guard let contextJson = call.options["context"] as? String else {
            call.reject(CommandError.invalidJSON.toJSONString())
            return
        }
        coreModule.createContextFromJSON(contextJson, result: CapacitorResult(call))
    }

    @objc(updateContextFromJSON:)
    func updateContextFromJSON(_ call: CAPPluginCall) {
        guard let contextJson = call.options["context"] as? String else {
            call.reject(CommandError.invalidJSON.toJSONString())
            return
        }
        coreModule.updateContextFromJSON(contextJson, result: CapacitorResult(call))
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
        coreModule.disposeContext()
        call.resolve()
    }

    // MARK: - DataCaptureViewProxy

    @objc(setViewPositionAndSize:)
    func setViewPositionAndSize(_ call: CAPPluginCall) {
        dispatchMainSync {
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
        dispatchMainSync {
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
        dispatchMainSync {
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
        guard let pointDict = call.getValue("point") as? [String: Any] else {
            call.reject(CommandError.invalidJSON.toJSONString())
            return
        }
        let jsonString = pointDict.jsonString!
        coreModule.viewPointForFramePoint(json: jsonString, result: CapacitorResult(call))
    }

    @objc(viewQuadrilateralForFrameQuadrilateral:)
    func viewQuadrilateralForFrameQuadrilateral(_ call: CAPPluginCall) {
        guard let pointDict = call.getValue("point") as? [String: Any] else {
            call.reject(CommandError.invalidJSON.toJSONString())
            return
        }
        let jsonString = pointDict.jsonString!
        coreModule.viewQuadrilateralForFrameQuadrilateral(json: jsonString, result: CapacitorResult(call))
    }

    // MARK: - CameraProxy

    @objc(getCurrentCameraState:)
    func getCurrentCameraState(_ call: CAPPluginCall) {
        guard let positionJson = call.getString("position") else {
            call.reject(CommandError.invalidJSON.toJSONString())
            return
        }
        coreModule.getCameraState(cameraPosition: positionJson, result: CapacitorResult(call))
    }

    @objc(getIsTorchAvailable:)
    func getIsTorchAvailable(_ call: CAPPluginCall) {
        guard let positionJson = call.getString("position") else {
            call.reject(CommandError.invalidJSON.toJSONString())
            return
        }
        coreModule.isTorchAvailable(cameraPosition: positionJson, result: CapacitorResult(call))
    }

    // MARK: - Defaults

    @objc(getDefaults:)
    func getDefaults(_ call: CAPPluginCall) {
        let defaults = coreModule.defaults.toEncodable()
        call.resolve(defaults as PluginCallResultData)
    }

    // MARK: - FeedbackProxy

    @objc(emitFeedback:)
    func emitFeedback(_ call: CAPPluginCall) {
        guard let feedbackJson = call.getString("feedback") else {
            call.reject(CommandError.invalidJSON.toJSONString())
            return
        }
        coreModule.emitFeedback(json: feedbackJson, result: CapacitorResult(call))
    }

    @objc(getLastFrame:)
    func getLastFrame(_ call: CAPPluginCall) {
        guard let lastFrame = LastFrameData.shared.frameData else {
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
            "data": LastFrameData.shared.frameData?.jsonString ?? "",
        ])
    }
}

extension ScanditCapacitorCore: DeserializationLifeCycleObserver {
    public func dataCaptureContext(deserialized context: DataCaptureContext?) {
        self.context = context
    }

    public func dataCaptureView(deserialized view: DataCaptureView?) {
        captureView = view
    }
}
