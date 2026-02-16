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
        if let resultDict = result as? [String: Any] {
            do {
                let jsonData = try JSONSerialization.data(withJSONObject: resultDict, options: [])
                if let jsonString = String(data: jsonData, encoding: .utf8) {
                    pluginCall.resolve(["data": jsonString])
                }
            } catch {
                reject(code: "JSON_ERROR", message: "Failed to convert to JSON", details: error)
            }
        } else if let unwrappedResult = result {
            let resultAsString = String(describing: unwrappedResult)
            pluginCall.resolve(["data": resultAsString])
        } else {
            pluginCall.resolve()
        }
    }

    public func successAndKeepCallback(result: Any?) {
        success(result: result)
    }

    public func reject(code: String, message: String?, details: Any?) {
        pluginCall.reject(message ?? code, code)
    }

    public func reject(error: Error) {
        let message = String(describing: error)
        let nsError = error as NSError
        pluginCall.reject(message, "\(nsError.code)", error)
    }
}
