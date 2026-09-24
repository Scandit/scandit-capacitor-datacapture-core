/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2023- Scandit AG. All rights reserved.
 */

import WebKit

public struct ViewPositionAndSizeJSON: CommandJSONArgument {
    public let top: Double
    public let left: Double
    public let width: Double
    public let height: Double
    public let shouldBeUnderWebView: Bool

    public init(top: Double, left: Double, width: Double, height: Double, shouldBeUnderWebView: Bool) {
        self.top = top
        self.left = left
        self.width = width
        self.height = height
        self.shouldBeUnderWebView = shouldBeUnderWebView
    }

    public var position: CGPoint {
        return CGPoint(x: left, y: top)
    }

    public var size: CGSize {
        return CGSize(width: width, height: height)
    }
}
