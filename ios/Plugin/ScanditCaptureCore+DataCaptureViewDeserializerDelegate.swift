/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2023- Scandit AG. All rights reserved.
 */

import ScanditCaptureCore

extension ScanditCaptureCore: DataCaptureViewDeserializerDelegate {
    public func viewDeserializer(_ deserializer: DataCaptureViewDeserializer,
                                 didStartDeserializingView view: DataCaptureView,
                                 from JSONValue: JSONValue) { }

    public func viewDeserializer(_ deserializer: DataCaptureViewDeserializer,
                                 didFinishDeserializingView view: DataCaptureView,
                                 from JSONValue: JSONValue) {
        captureView = view
    }
}
