/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2023- Scandit AG. All rights reserved.
 */

import Capacitor

public struct Callback {
    public let id: String

    public init(id: String) {
        self.id = id
    }

    /// We might want to dispose of an already added callback and destroy the corresponding JavaScript
    /// callback as well, e.g. in case a new capture mode is added and the proxy for that mode subscribes to
    /// listeners, in which case we want to destroy the previously existing listener that corresponds to the inactive
    /// capture mode.
    ///
    /// - Parameter commandDelegate: The command delegate to send the dispose command through
    public func dispose(by call: CAPPluginCall) {
        call.resolve()
    }
}
