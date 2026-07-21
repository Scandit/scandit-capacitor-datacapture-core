/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2025- Scandit AG. All rights reserved.
 */

import UIKit
import WebKit

class DataCaptureViewTouchHandler: NSObject {
    private weak var webView: WKWebView?
    private weak var dataCaptureViewContainer: UIView?

    init(webView: WKWebView, dataCaptureViewContainer: UIView) {
        self.webView = webView
        self.dataCaptureViewContainer = dataCaptureViewContainer
        super.init()

        // Set the associated objects on the webView
        webView.dataCaptureViewContainer = dataCaptureViewContainer
    }

    func updateLayering(shouldBeUnderWebView: Bool) {
        webView?.shouldBeUnderWebView = shouldBeUnderWebView
    }

    func cleanup() {
        webView?.dataCaptureViewContainer = nil
        webView?.shouldBeUnderWebView = false
    }
}
