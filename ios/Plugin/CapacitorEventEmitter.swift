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
        var payload = payload as [String: Any]
        payload["name"] = name
        plugin.notifyListeners(name, data: payload)
    }
    
    public func hasListener(for event: String) -> Bool {
        plugin?.hasListeners(event) ?? false
    }
}
