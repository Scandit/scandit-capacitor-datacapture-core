/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2023- Scandit AG. All rights reserved.
 */

import ScanditCaptureCore

extension ScanditCaptureCore: DataCaptureContextListener {
    public func context(_ context: DataCaptureContext, didChange frameSource: FrameSource?) {
        // ignored in Cordova
    }

    public func context(_ context: DataCaptureContext, didAdd mode: DataCaptureMode) {
        // ignored in Cordova
    }

    public func context(_ context: DataCaptureContext, didRemove mode: DataCaptureMode) {
        // ignored in Cordova
    }

    public func context(_ context: DataCaptureContext, didChange contextStatus: ContextStatus) {
        guard let contextStatusData = contextStatus.jsonString.data(using: .utf8),
            let contextStatusObject = try? JSONSerialization.jsonObject(with: contextStatusData),
            let contextStatusJSON = contextStatusObject as? CommandError.JSONMessage else {
                return
        }
        let event = ListenerEvent(name: .didChangeContextStatus,
                                  argument: contextStatusJSON)
        self.notifyListeners(event.name.rawValue, data: ["argument": event.argument])
    }

    public func didStartObserving(_ context: DataCaptureContext) {
        let event = ListenerEvent(name: .didStartObservingContext,
                                  argument: [:])
//        commandDelegate.send(.listenerCallback(event), callbackId: callback.id)
        self.notifyListeners(event.name.rawValue, data: [:])
    }

    public func didStopObserving(_ context: DataCaptureContext) {
        // ignored in Cordova
    }
}
