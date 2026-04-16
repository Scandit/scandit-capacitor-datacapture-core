/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2023- Scandit AG. All rights reserved.
 */

import Foundation
import Capacitor

public extension NSDictionary {
    var jsonString: String {
        guard let theJSONData = try? JSONSerialization.data(withJSONObject: self,
                                                            options: []) else {
            return ""
        }

        return String(data: theJSONData, encoding: .utf8) ?? ""
    }
}

public extension Dictionary {
    var jsonString: String? {
        guard let data = try? JSONSerialization.data(withJSONObject: self, options: []) else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }
}
