/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.capacitor.datacapture.core.handlers

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.MotionEvent
import android.view.View
import android.view.View.OnTouchListener
import android.view.ViewGroup
import android.widget.FrameLayout
import com.getcapacitor.Bridge
import com.scandit.capacitor.datacapture.core.data.ResizeAndMoveInfo
import com.scandit.capacitor.datacapture.core.utils.pxFromDp
import com.scandit.capacitor.datacapture.core.utils.removeFromParent
import com.scandit.datacapture.core.ui.DataCaptureView
import com.scandit.datacapture.frameworks.core.utils.DefaultFrameworksLog
import com.scandit.datacapture.frameworks.core.utils.FrameworksLog
import java.lang.ref.WeakReference
import java.util.Locale

class DataCaptureViewHandler(
    private val logger: FrameworksLog = DefaultFrameworksLog.getInstance()
) {
    companion object {
        private const val TOUCH_EVALUATION_TIMEOUT_MS = 20L
        private const val MAX_PENDING_TOUCH_EVENTS = 40
    }

    private var latestInfo: ResizeAndMoveInfo = ResizeAndMoveInfo(0f, 0f, 0f, 0f, false)
    private var isVisible: Boolean = false
    private var dataCaptureViewReference: WeakReference<DataCaptureView?> = WeakReference(null)
    private var webViewReference: WeakReference<View?> = WeakReference(null)
    private var webViewTouchForwarder: OnTouchListener? = null
    private val pendingTouchEvents: MutableList<MotionEvent> = mutableListOf()
    private var shouldForwardTouchEvents: Boolean = false
    private var isEvaluatingTouchTarget: Boolean = false
    private var currentTouchEvaluationToken: Int = 0
    private val evaluationTimeoutHandler = Handler(Looper.getMainLooper())
    private var evaluationTimeoutRunnable: Runnable? = null
    private var evaluationStartElapsedMs: Long = 0L

    private val webView: View?
        get() = webViewReference.get()

    val dataCaptureView: DataCaptureView?
        get() = dataCaptureViewReference.get()

    fun setVisible() {
        isVisible = true
        render()
    }

    fun setInvisible() {
        isVisible = false
        render()
    }

    fun setResizeAndMoveInfo(info: ResizeAndMoveInfo) {
        latestInfo = info
        render()
    }

    fun disposeCurrentWebView() {
        clearWebViewTouchForwarder()
        webViewReference = WeakReference(null)
    }

    @SuppressLint("ClickableViewAccessibility")
    fun addDataCaptureView(dataCaptureView: DataCaptureView, bridge: Bridge) {
        dataCaptureViewReference = WeakReference(dataCaptureView)

        bridge.executeOnMainThread {
            val dcContainer = FrameLayout(bridge.context)
            dcContainer.minimumHeight = bridge.webView.height
            dcContainer.minimumWidth = bridge.webView.width
            dcContainer.setBackgroundColor(Color.TRANSPARENT)

            // Add DataCaptureView to the container
            dcContainer.addView(dataCaptureView)

            val parent = bridge.webView.parent as ViewGroup
            val layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
            // Add container to the same parent of the WebView
            parent.addView(dcContainer, layoutParams)

            // create touch listener
            val touchForwarder = OnTouchListener {
                    _, event ->
                when (event.actionMasked) {
                    MotionEvent.ACTION_DOWN -> handleActionDown(event, bridge, dcContainer)
                    MotionEvent.ACTION_UP,
                    MotionEvent.ACTION_CANCEL -> handleActionUp(event, dcContainer)

                    else -> handleOtherActions(event, dcContainer)
                }

                false
            }

            bridge.webView.setOnTouchListener(touchForwarder)
            webViewTouchForwarder = touchForwarder

            bridge.webView.bringToFront()
            bridge.webView.setBackgroundColor(Color.TRANSPARENT)

            webViewReference = WeakReference(bridge.webView)
        }
    }

    private fun handleActionUp(
        event: MotionEvent,
        dcViewParent: FrameLayout
    ) {
        handleOtherActions(event, dcViewParent)

        if (!isEvaluatingTouchTarget) {
            resetTouchForwardingState()
        }
    }

    private fun handleOtherActions(
        event: MotionEvent,
        dcViewParent: FrameLayout
    ) {
        if (isEvaluatingTouchTarget) {
            addPendingTouchEvent(event)
        } else if (shouldForwardTouchEvents) {
            forwardEventToDataCaptureView(dcViewParent, event)
        }
    }

    private fun handleActionDown(
        event: MotionEvent,
        bridge: Bridge,
        dcViewParent: FrameLayout
    ) {
        currentTouchEvaluationToken += 1
        val evaluationToken = currentTouchEvaluationToken
        shouldForwardTouchEvents = false
        isEvaluatingTouchTarget = true
        evaluationStartElapsedMs = SystemClock.elapsedRealtime()
        clearPendingTouchEvents()
        addPendingTouchEvent(event)
        evaluateTouchTarget(event, bridge, evaluationToken, dcViewParent)
    }

    fun removeDataCaptureView(dataCaptureView: DataCaptureView) {
        if (this.dataCaptureView == dataCaptureView) {
            dataCaptureViewReference = WeakReference(null)
        }
        clearWebViewTouchForwarder()
        removeView(dataCaptureView)
    }

    private fun removeView(view: View) {
        view.post {
            view.removeFromParent()
        }
    }

    // Update the view visibility, position and size.
    private fun render() {
        val view = dataCaptureView ?: return
        val dcViewParent = view.parent as? FrameLayout

        view.post {
            view.visibility = if (isVisible) View.VISIBLE else View.GONE
            view.x = latestInfo.left.pxFromDp()
            view.y = latestInfo.top.pxFromDp()
            view.layoutParams.apply {
                width = latestInfo.width.pxFromDp().toInt()
                height = latestInfo.height.pxFromDp().toInt()
            }

            if (latestInfo.shouldBeUnderWebView) {
                webView?.bringToFront()
                webView?.translationZ = 2F
                dcViewParent?.translationZ = 1F
            } else {
                dcViewParent?.bringToFront()
                dcViewParent?.translationZ = 2F
                webView?.translationZ = 1F
            }

            view.requestLayout()
        }
    }

    private fun evaluateTouchTarget(
        event: MotionEvent,
        bridge: Bridge,
        evaluationToken: Int,
        dcViewParent: FrameLayout,
    ) {
        val rawX = formatCoordinate(event.x)
        val rawY = formatCoordinate(event.y)
        val webViewScale = formatCoordinate(1f)

        val js = """
            (function() {
                var rawX = $rawX;
                var rawY = $rawY;
                var webViewScale = $webViewScale;
                var dpr = window.devicePixelRatio || 1;
                var viewportScale = (window.visualViewport && window.visualViewport.scale) ? window.visualViewport.scale : 1;

                var cssX = rawX / (dpr * viewportScale / webViewScale);
                var cssY = rawY / (dpr * viewportScale / webViewScale);

                var container = document.querySelector('.data-capture-view');
                if (!container) { return true; }

                var rect = container.getBoundingClientRect();
                var x = cssX;
                var y = cssY;

                if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                    return true;
                }

                var el = document.elementFromPoint(x, y);
                if (!el) { return true; }
                
                if (el.classList.contains('data-capture-view') || el.closest('.data-capture-view') === container) {
                    return false;
                }

                return true;
            })();
        """.trimIndent()

        scheduleEvaluationTimeout(evaluationToken, dcViewParent)

        try {
            bridge.webView.evaluateJavascript(js) { value ->
                if (evaluationToken != currentTouchEvaluationToken) {
                    return@evaluateJavascript
                }

                val durationMs = SystemClock.elapsedRealtime() - evaluationStartElapsedMs
                if (durationMs > TOUCH_EVALUATION_TIMEOUT_MS) {
                    logger.info("Touch evaluation resolved in ${durationMs}ms")
                }

                val shouldForward = parseShouldForwardValue(value)
                handleTouchEvaluationResult(shouldForward, dcViewParent)
            }
        } catch (e: Exception) {
            if (evaluationToken == currentTouchEvaluationToken) {
                logger.error("Touch evaluation failed", e)
                handleTouchEvaluationResult(false, dcViewParent)
            }
        }
    }

    private fun handleTouchEvaluationResult(shouldForward: Boolean, dcViewParent: FrameLayout) {
        isEvaluatingTouchTarget = false
        shouldForwardTouchEvents = shouldForward
        cancelEvaluationTimeout()

        if (shouldForward) {
            pendingTouchEvents.forEach {
                dcViewParent.dispatchTouchEvent(it)
                it.recycle()
            }
        } else {
            pendingTouchEvents.forEach { it.recycle() }
        }

        pendingTouchEvents.clear()
    }

    private fun forwardEventToDataCaptureView(dcViewParent: FrameLayout, event: MotionEvent) {
        val eventCopy = MotionEvent.obtain(event)
        dcViewParent.dispatchTouchEvent(eventCopy)
        eventCopy.recycle()
    }

    private fun clearPendingTouchEvents() {
        pendingTouchEvents.forEach { it.recycle() }
        pendingTouchEvents.clear()
    }

    private fun addPendingTouchEvent(event: MotionEvent) {
        if (pendingTouchEvents.size >= MAX_PENDING_TOUCH_EVENTS) {
            val oldest = pendingTouchEvents.removeAt(0)
            oldest.recycle()
        }

        pendingTouchEvents.add(MotionEvent.obtain(event))
    }

    private fun resetTouchForwardingState() {
        shouldForwardTouchEvents = false
        isEvaluatingTouchTarget = false
        clearPendingTouchEvents()
        currentTouchEvaluationToken += 1
        cancelEvaluationTimeout()
    }

    private fun clearWebViewTouchForwarder() {
        webViewReference.get()?.setOnTouchListener(null)
        webViewTouchForwarder = null
        resetTouchForwardingState()
    }

    private fun scheduleEvaluationTimeout(
        evaluationToken: Int,
        dcViewParent: FrameLayout
    ) {
        cancelEvaluationTimeout()

        val runnable = Runnable {
            if (evaluationToken != currentTouchEvaluationToken || !isEvaluatingTouchTarget) {
                return@Runnable
            }

            logger.info("Touch evaluation timed out after ${TOUCH_EVALUATION_TIMEOUT_MS}ms")
            handleTouchEvaluationResult(false, dcViewParent)
        }

        evaluationTimeoutRunnable = runnable
        evaluationTimeoutHandler.postDelayed(runnable, TOUCH_EVALUATION_TIMEOUT_MS)
    }

    private fun cancelEvaluationTimeout() {
        evaluationTimeoutRunnable?.let {
            evaluationTimeoutHandler.removeCallbacks(it)
        }
        evaluationTimeoutRunnable = null
    }

    private fun parseShouldForwardValue(value: String?): Boolean {
        val normalized = value?.trim()?.removeSurrounding("\"", "\"")?.lowercase(Locale.US)
        if (normalized == null) {
            logger.error("Touch evaluation returned null result")
            return false
        }

        return when (normalized) {
            "true" -> false
            "false" -> true
            else -> {
                logger.error("Touch evaluation returned unexpected value: $normalized")
                false
            }
        }
    }

    private fun formatCoordinate(value: Float): String =
        String.format(Locale.US, "%.4f", value)
}
