/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2023- Scandit AG. All rights reserved.
 */

import Capacitor
import Foundation
import ScanditCaptureCore
import ScanditFrameworksCore
import WebKit

#if !COCOAPODS
import ScanditCapacitorDatacaptureCoreObjC
#endif

public protocol ContextChangeListener: AnyObject {
    func context(didChange context: DataCaptureContext?)
}

@objc(ScanditCapacitorCore)
// swiftlint:disable:next type_body_length
public class ScanditCapacitorCore: CAPPlugin, CAPBridgedPlugin, DeserializationLifeCycleObserver {
    public let identifier = "ScanditCapacitorCore"
    public let jsName = "ScanditCaptureCoreNative"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "subscribeVolumeButtonObserver", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "unsubscribeVolumeButtonObserver", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setDataCaptureViewPositionAndSize", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showDataCaptureView", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hideDataCaptureView", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getDefaults", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "executeCore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "createDataCaptureView", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeDataCaptureView", returnType: CAPPluginReturnPromise),
    ]

    private var coreModule: CoreModule!
    private var touchHandler: DataCaptureViewTouchHandler?

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

            // Setup touch handler for forwarding touches when WebView is on top
            if let webView = webView {
                touchHandler = DataCaptureViewTouchHandler(
                    webView: webView,
                    dataCaptureViewContainer: captureView
                )
            }
        }
    }

    private var volumeButtonObserver: VolumeButtonObserver?

    private lazy var captureViewConstraints: DataCaptureViewConstraints = {
        guard let webView = webView else {
            fatalError("WebView must be available for DataCaptureView initialization")
        }
        return DataCaptureViewConstraints(relativeTo: webView)
    }()

    public override func load() {
        super.load()
        let emitter = CapacitorEventEmitter(with: self)
        coreModule = CoreModule.create(emitter: emitter)
        DefaultServiceLocator.shared.register(module: coreModule)
        coreModule.didStart()
        DeserializationLifeCycleDispatcher.shared.attach(observer: self)
    }

    @objc
    func onReset() {
        coreModule.didStop()
        DeserializationLifeCycleDispatcher.shared.detach(observer: self)
        coreModule.unsubscribeContextListener(result: NoopFrameworksResult())
        coreModule.unregisterTopmostDataCaptureViewListener()
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

    // MARK: - DataCaptureViewProxy

    @objc(setDataCaptureViewPositionAndSize:)
    func setDataCaptureViewPositionAndSize(_ call: CAPPluginCall) {
        dispatchMain {
            let top = call.getDouble("top", 0)
            let left = call.getDouble("left", 0)
            let width = call.getDouble("width", 0)
            let height = call.getDouble("height", 0)
            let shouldBeUnderWebView = call.getBool("shouldBeUnderWebView", false)
            let viewPositionAndSizeJSON = ViewPositionAndSizeJSON.init(
                top: top,
                left: left,
                width: width,
                height: height,
                shouldBeUnderWebView: shouldBeUnderWebView
            )

            self.captureViewConstraints.updatePositionAndSize(fromJSON: viewPositionAndSizeJSON)

            // Update touch handler with layering information
            self.touchHandler?.updateLayering(shouldBeUnderWebView: viewPositionAndSizeJSON.shouldBeUnderWebView)

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

    @objc(showDataCaptureView:)
    func showDataCaptureView(_ call: CAPPluginCall) {
        dispatchMain {
            guard let captureView = self.captureView else {
                call.reject(CommandError.noViewToBeShown.toJSONString())
                return
            }

            captureView.isHidden = false

            call.resolve()
        }
    }

    @objc(hideDataCaptureView:)
    func hideDataCaptureView(_ call: CAPPluginCall) {
        dispatchMain {
            guard let captureView = self.captureView else {
                call.reject(CommandError.noViewToBeHidden.toJSONString())
                return
            }

            captureView.isHidden = true

            call.resolve()
        }
    }

    // MARK: - Defaults

    @objc(getDefaults:)
    func getDefaults(_ call: CAPPluginCall) {
        let defaults = coreModule.getDefaults()
        call.resolve(defaults as PluginCallResultData)
    }

    @objc(createDataCaptureView:)
    func createDataCaptureView(_ call: CAPPluginCall) {
        guard let viewJson = call.getString("viewJson") else {
            call.reject(CommandError.invalidJSON.toJSONString())
            return
        }
        self.coreModule.createDataCaptureView(viewJson: viewJson, result: CapacitorResult(call)) { [weak self] dcView in
            // The completion handler is already called on the main thread from CoreModule.
            // No need to dispatch again to avoid race conditions where JS receives the promise
            // resolution before captureView is set.
            self?.captureView = dcView
        }
    }

    @objc(removeDataCaptureView:)
    func removeDataCaptureView(_ call: CAPPluginCall) {
        dispatchMain {
            if let dcView = self.captureView {
                self.coreModule.dataCaptureViewDisposed(dcView)
            }
            self.touchHandler?.cleanup()
            self.touchHandler = nil
            self.captureView = nil
            call.resolve()
        }
    }

    /// Single entry point for all Core operations.
    /// Routes method calls to the appropriate command via the shared command factory.
    @objc(executeCore:)
    func executeCore(_ call: CAPPluginCall) {
        let handled = coreModule.execute(
            CapacitorMethodCall(call),
            result: CapacitorResult(call),
            module: coreModule
        )
        if !handled {
            let methodName = call.getString("methodName") ?? "unknown"
            call.reject("Unknown Core method: \(methodName)")
        }
    }

    public func didDisposeDataCaptureContext() {
        captureView = nil
    }
}
