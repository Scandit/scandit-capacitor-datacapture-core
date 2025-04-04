/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2023- Scandit AG. All rights reserved.
 */

import Capacitor
import ScanditFrameworksCore

public struct CapacitorResult: FrameworksResult {
    private let pluginCall: CAPPluginCall

    public init(_ call: CAPPluginCall) {
        pluginCall = call
    }

    public func success(result: Any?) {
        if let result = result as? [String: Any] {
            pluginCall.resolve(result)
        } else if let result = result {
            pluginCall.resolve(["data": result])
        } else {
            pluginCall.resolve()
        }
    }
    
    public func reject(code: String, message: String?, details: Any?) {
        pluginCall.reject(message!, code)
    }
    
    public func reject(error: Error) {
        let message = String(describing: error)
        let nsError = error as NSError
        pluginCall.reject(message, "\(nsError.code)", error)
    }
}
