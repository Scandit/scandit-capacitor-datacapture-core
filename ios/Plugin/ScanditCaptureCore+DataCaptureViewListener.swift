/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2023- Scandit AG. All rights reserved.
 */

import ScanditCaptureCore
import Capacitor

extension ScanditCaptureCore: DataCaptureViewListener {
    public func dataCaptureView(_ view: DataCaptureView, didChange size: CGSize, orientation: UIInterfaceOrientation) {
        let listenerEvent = ListenerEvent(name: .didChangeSize, argument: [:])
        self.notifyListeners(listenerEvent.name.rawValue, data: [
                                "size": [
                                    "width": size.width,
                                    "height": size.height
                                ],
                                "orientation": orientation.description])
    }
}
