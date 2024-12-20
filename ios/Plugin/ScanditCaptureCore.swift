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
                if oldValue.superview != nil {
                    oldValue.removeFromSuperview()
                }
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
        self.coreModule.registerDataCaptureContextListener()
        call.resolve()
    }

    @objc(unsubscribeContextListener:)
    func unsubscribeContextListener(_ call: CAPPluginCall) {
        self.coreModule.unregisterDataCaptureContextListener()
        call.resolve()
    }

    @objc(subscribeContextFrameListener:)
    func subscribeContextFrameListener(_ call: CAPPluginCall) {
        self.coreModule.registerFrameSourceListener()
        call.resolve()
    }

    @objc(subscribeViewListener:)
    func subscribeViewListener(_ call: CAPPluginCall) {
        self.coreModule.registerDataCaptureViewListener()
        call.resolve()
    }

    @objc(unsubscribeViewListener:)
    func unsubscribeViewListener(_ call: CAPPluginCall) {
        self.coreModule.unregisterDataCaptureViewListener()
        call.resolve()
    }

    @objc(subscribeVolumeButtonObserver:)
    func subscribeVolumeButtonObserver(_ call: CAPPluginCall) {
        volumeButtonObserver = VolumeButtonObserver(handler: { [weak self] in
            guard let self = self else {
                call.resolve()
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
        guard let jsonString = call.getValue("point") as? String else {
            call.reject(CommandError.invalidJSON.toJSONString())
            return
        }
        coreModule.viewPointForFramePoint(json: jsonString, result: CapacitorResult(call))
    }

    @objc(viewQuadrilateralForFrameQuadrilateral:)
    func viewQuadrilateralForFrameQuadrilateral(_ call: CAPPluginCall) {
        guard let jsonString = call.getValue("point") as? String else {
            call.reject(CommandError.invalidJSON.toJSONString())
            return
        }
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

    @objc(registerListenerForCameraEvents:)
    func registerListenerForCameraEvents(_ call: CAPPluginCall) {
        coreModule.registerFrameSourceListener()
        call.resolve()
    }

    @objc(unregisterListenerForCameraEvents:)
    func unregisterListenerForCameraEvents(_ call: CAPPluginCall) {
        coreModule.unregisterFrameSourceListener()
        call.resolve()
    }

    @objc(switchCameraToDesiredState:)
    func switchCameraToDesiredState(_ call: CAPPluginCall) {
        guard let desiredStateJson = call.getString("desiredState") else {
            call.reject(CommandError.invalidJSON.toJSONString())
            return
        }
        coreModule.switchCameraToDesiredState(stateJson: desiredStateJson, result: CapacitorResult(call))
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

    @objc(getFrame:)
    func getFrame(_ call: CAPPluginCall) {
        guard let frameId = call.getString("frameId") else {
            call.reject(CommandError.invalidJSON.toJSONString())
            return
        }
        
        coreModule.getLastFrameAsJson(frameId: frameId, result: CapacitorResult(call))
    }

    @objc(addModeToContext:)
    func addModeToContext(_ call: CAPPluginCall) {
        guard let modeJson = call.getString("modeJson") else {
            call.reject(CommandError.invalidJSON.toJSONString())
            return
        }
        coreModule.addModeToContext(modeJson: modeJson, result: CapacitorResult(call))
    }

    @objc(removeModeFromContext:)
    func removeModeFromContext(_ call: CAPPluginCall) {
         guard let modeJson = call.getString("modeJson") else {
            call.reject(CommandError.invalidJSON.toJSONString())
            return
        }
        coreModule.removeModeFromContext(modeJson: modeJson, result: CapacitorResult(call))
    }

    @objc(removeAllModes:)
    func removeAllModes(_ call: CAPPluginCall) {
        coreModule.removeAllModes(result: CapacitorResult(call))
    }

    @objc(createDataCaptureView:)
    func createDataCaptureView(_ call: CAPPluginCall) {
        guard let viewJson = call.getString("viewJson") else {
            call.reject(CommandError.invalidJSON.toJSONString())
            return
        }
        dispatchMainSync {
            captureView = coreModule.createDataCaptureView(viewJson: viewJson, result: CapacitorResult(call))
        }
    }

    @objc(removeDataCaptureView:)
    func removeDataCaptureView(_ call: CAPPluginCall) {
        dispatchMainSync {
            if let dcView = captureView {
                coreModule.dataCaptureViewDisposed(dcView)
            }
            captureView = nil
            call.resolve()
        }
    }

    @objc(updateDataCaptureView:)
    func updateDataCaptureView(_ call: CAPPluginCall) {
        guard let viewJson = call.getString("viewJson") else {
            call.reject(CommandError.invalidJSON.toJSONString())
            return
        }
        coreModule.updateDataCaptureView(viewJson: viewJson, result: CapacitorResult(call))
    }

    @objc(getOpenSourceSoftwareLicenseInfo:)
    func getOpenSourceSoftwareLicenseInfo(_ call: CAPPluginCall) {
        coreModule.getOpenSourceSoftwareLicenseInfo(result: CapacitorResult(call))
    }
}

extension ScanditCapacitorCore: DeserializationLifeCycleObserver {
    public func dataCaptureContext(deserialized context: DataCaptureContext?) {
        self.context = context
    }
    
    public func didDisposeDataCaptureContext() {
        captureView = nil
    }
}
