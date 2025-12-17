/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2025- Scandit AG. All rights reserved.
 */

import Foundation
import OSLog
import UIKit
import WebKit

private var dataCaptureViewContainerKey: UInt8 = 0
private var shouldBeUnderWebViewKey: UInt8 = 0

private enum DataCaptureViewTouchLogging {
    static let log = OSLog(subsystem: "com.scandit.capacitor.datacapture", category: "DataCaptureViewTouch")
}

extension WKWebView {
    var dataCaptureViewContainer: UIView? {
        get {
            objc_getAssociatedObject(self, &dataCaptureViewContainerKey) as? UIView
        }
        set {
            objc_setAssociatedObject(self, &dataCaptureViewContainerKey, newValue, .OBJC_ASSOCIATION_ASSIGN)
        }
    }

    var shouldBeUnderWebView: Bool {
        get {
            (objc_getAssociatedObject(self, &shouldBeUnderWebViewKey) as? Bool) ?? false
        }
        set {
            objc_setAssociatedObject(
                self,
                &shouldBeUnderWebViewKey,
                newValue as NSNumber,
                .OBJC_ASSOCIATION_RETAIN_NONATOMIC
            )
        }
    }

    // Override hitTest to make WebView transparent for DataCaptureView touches
    override open func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        guard shouldBeUnderWebView, let container = dataCaptureViewContainer else {
            return super.hitTest(point, with: event)
        }

        // No WebView content found, check if touch is in DataCaptureView area
        let convertedPoint = self.convert(point, to: container)
        guard container.bounds.contains(convertedPoint) else {
            // Outside DataCaptureView area
            return super.hitTest(point, with: event)
        }

        // Touch is in DataCaptureView area - evaluate with JavaScript synchronously
        let shouldForward = evaluateIfShouldPassThroughSync(at: point)

        // If we should pass through to native, return native view
        if shouldForward {
            if let nativeView = container.hitTest(convertedPoint, with: event) {
                return nativeView
            }
        }

        // Otherwise let WebView handle it
        return super.hitTest(point, with: event)
    }

    private func evaluateIfShouldPassThroughSync(at point: CGPoint) -> Bool {
        let scale = UIScreen.main.scale
        let rawX = formatCoordinate(point.x * scale)
        let rawY = formatCoordinate(point.y * scale)
        let webViewScale = formatCoordinate(self.scrollView.zoomScale)

        let js = """
                (function() {
                    var rawX = \(rawX);
                    var rawY = \(rawY);
                    var webViewScale = \(webViewScale);

                    var dpr = window.devicePixelRatio || 1;
                    var viewportScale = (window.visualViewport && window.visualViewport.scale) ? window.visualViewport.scale : 1;

                    var cssX = rawX / (dpr * viewportScale / webViewScale);
                    var cssY = rawY / (dpr * viewportScale / webViewScale);

                    var container = document.querySelector('.data-capture-view');
                    if (!container) { return false; }

                    var rect = container.getBoundingClientRect();

                    if (cssX < rect.left || cssX > rect.right || cssY < rect.top || cssY > rect.bottom) {
                        return false;
                    }

                    var el = document.elementFromPoint(cssX, cssY);
                    if (!el) { return false; }

                    if (el.classList.contains('data-capture-view') || el.closest('.data-capture-view') === container) {
                        return true;
                    }

                    return false;
                })();
            """

        var evaluationResult: Bool?
        var shouldKeepRunning = true
        let runLoop = RunLoop.current
        let deadline = CACurrentMediaTime() + 0.02

        self.evaluateJavaScript(js) { result, error in
            if let error {
                os_log(
                    "DataCaptureView touch evaluation failed: %{public}@",
                    log: DataCaptureViewTouchLogging.log,
                    type: .error,
                    String(describing: error)
                )
                evaluationResult = false
                shouldKeepRunning = false
                return
            }

            if let result = result as? Bool {
                evaluationResult = result
            } else if let result = result as? String {
                evaluationResult = (result == "true")
            } else {
                os_log(
                    "DataCaptureView touch evaluation returned unexpected result: %{public}@",
                    log: DataCaptureViewTouchLogging.log,
                    type: .error,
                    String(describing: result)
                )
                evaluationResult = false
            }
            shouldKeepRunning = false
        }

        while shouldKeepRunning && CACurrentMediaTime() < deadline {
            let nextDate = Date().addingTimeInterval(0.002)
            if !runLoop.run(mode: .default, before: nextDate) {
                break
            }
        }

        if shouldKeepRunning {
            shouldKeepRunning = false
            os_log("DataCaptureView touch evaluation timed out", log: DataCaptureViewTouchLogging.log, type: .info)
        }

        return evaluationResult ?? false
    }

    private func formatCoordinate(_ value: CGFloat) -> String {
        String(format: "%.4f", value)
    }
}
