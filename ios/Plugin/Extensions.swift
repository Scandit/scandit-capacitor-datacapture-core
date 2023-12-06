/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2023- Scandit AG. All rights reserved.
 */

import Foundation

public extension NSDictionary {
    var jsonString: String {
        guard let theJSONData = try? JSONSerialization.data(withJSONObject: self,
                                                            options: []) else {
            return ""
        }

        return String(data: theJSONData, encoding: .utf8) ?? ""
    }
}
