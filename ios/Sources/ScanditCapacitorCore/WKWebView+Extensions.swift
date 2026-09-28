/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2023- Scandit AG. All rights reserved.
 */

import WebKit

public extension WKWebView {
    var adjustedContentInset: UIEdgeInsets {
        scrollView.adjustedContentInset
    }
}
