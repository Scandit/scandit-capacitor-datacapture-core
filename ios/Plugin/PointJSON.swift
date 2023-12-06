/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2023- Scandit AG. All rights reserved.
 */

import WebKit

extension CGPoint {
    var json: CommandError.JSONMessage {
        return [
            "x": x,
            "y": y
        ]
    }

    var jsonString: String {
        return String(data: try! JSONSerialization.data(withJSONObject: json), encoding: .utf8)!
    }
}

struct PointJSON: CommandJSONArgument {
    let x: Double
    let y: Double

    var cgPoint: CGPoint {
        return CGPoint(x: x, y: y)
    }
}
