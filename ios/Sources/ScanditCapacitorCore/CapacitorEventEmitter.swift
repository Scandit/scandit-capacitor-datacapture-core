/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2023- Scandit AG. All rights reserved.
 */

import Capacitor
import ScanditFrameworksCore

public struct CapacitorEventEmitter: Emitter {
    weak var plugin: CAPPlugin?

    public init(with plugin: CAPPlugin) {
        self.plugin = plugin
    }

    public func emit(name: String, payload: [String: Any?]) {
        guard let plugin = plugin else { return }
        guard let data = try? JSONSerialization.data(withJSONObject: payload),
              let jsonString = String(data: data, encoding: .utf8) else { return }

        let capacitorPayload: [String: Any] = [
            "name": name,
            "data": jsonString
        ]

        plugin.notifyListeners(name, data: capacitorPayload)
    }

    public func hasListener(for event: String) -> Bool {
        plugin?.hasListeners(event) ?? false
    }

    public func hasViewSpecificListenersForEvent(_ viewId: Int, for event: String) -> Bool {
        plugin?.hasListeners(event) ?? false
    }

    public func hasModeSpecificListenersForEvent(_ modeId: Int, for event: String) -> Bool {
        plugin?.hasListeners(event) ?? false
    }
}
