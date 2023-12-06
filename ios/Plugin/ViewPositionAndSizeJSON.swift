/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2023- Scandit AG. All rights reserved.
 */

import WebKit

struct ViewPositionAndSizeJSON: CommandJSONArgument {
    let top: Double
    let left: Double
    let width: Double
    let height: Double
    let shouldBeUnderWebView: Bool

    var position: CGPoint {
        return CGPoint(x: left, y: top)
    }

    var size: CGSize {
        return CGSize(width: width, height: height)
    }
}
