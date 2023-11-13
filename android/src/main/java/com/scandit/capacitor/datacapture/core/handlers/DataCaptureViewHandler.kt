/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.capacitor.datacapture.core.handlers

import android.app.Activity
import android.graphics.Color
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.app.AppCompatActivity
import com.scandit.capacitor.datacapture.core.data.ResizeAndMoveInfo
import com.scandit.capacitor.datacapture.core.testing.OpenForTesting
import com.scandit.capacitor.datacapture.core.utils.pxFromDp
import com.scandit.capacitor.datacapture.core.utils.removeFromParent
import com.scandit.capacitor.datacapture.core.workers.Worker
import com.scandit.datacapture.core.ui.DataCaptureView
import com.scandit.datacapture.core.ui.DataCaptureViewListener
import java.lang.ref.WeakReference

@OpenForTesting
class DataCaptureViewHandler(
    private val viewListener: DataCaptureViewListener,
    private val uiWorker: Worker
) {
    private var latestInfo: ResizeAndMoveInfo = ResizeAndMoveInfo(0, 0, 0, 0, false)
    private var isVisible: Boolean = false
    private var dataCaptureViewReference: WeakReference<DataCaptureView>? = null
    private var webViewReference: WeakReference<View>? = null

    val dataCaptureView: DataCaptureView?
        get() = dataCaptureViewReference?.get()
    private val webView: View?
        get() = webViewReference?.get()

    fun attachDataCaptureView(dataCaptureView: DataCaptureView, activity: AppCompatActivity) {
        if (this.dataCaptureView != dataCaptureView) {
            disposeCurrentDataCaptureView()
            addDataCaptureView(dataCaptureView, activity)
        }
    }

    fun attachWebView(webView: View, @Suppress("UNUSED_PARAMETER") activity: AppCompatActivity) {
        if (this.webView != webView) {
            webViewReference = WeakReference(webView)
            uiWorker.post {
                webView.bringToFront()
                webView.setBackgroundColor(Color.TRANSPARENT)
            }
        }
    }

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

    // Remove current dataCaptureView from hierarchy, and clear all references.
    fun disposeCurrent() {
        disposeCurrentDataCaptureView()
        disposeCurrentWebView()
    }

    private fun disposeCurrentDataCaptureView() {
        val dataCaptureView = dataCaptureView ?: return
        removeDataCaptureView(dataCaptureView)
    }

    private fun disposeCurrentWebView() {
        webViewReference = null
    }

    private fun addDataCaptureView(dataCaptureView: DataCaptureView, activity: Activity) {
        dataCaptureViewReference = WeakReference(dataCaptureView)
        dataCaptureView.addListener(viewListener)

        uiWorker.post {
            activity.addContentView(
                dataCaptureView,
                ViewGroup.LayoutParams(
                    latestInfo.width.pxFromDp().toInt(),
                    latestInfo.height.pxFromDp().toInt()
                )
            )
            render()
        }
    }

    private fun removeDataCaptureView(dataCaptureView: DataCaptureView) {
        dataCaptureViewReference = null
        removeView(dataCaptureView) {
            dataCaptureView.removeListener(viewListener)
        }
    }

    private fun removeView(view: View, uiBlock: (() -> Unit)? = null) {
        uiWorker.post {
            view.removeFromParent()
            uiBlock?.invoke()
        }
    }

    // Update the view visibility, position and size.
    private fun render() {
        val view = dataCaptureView ?: return
        renderNoAnimate(view)
    }

    private fun renderNoAnimate(dataCaptureView: DataCaptureView) {
        dataCaptureView.post {
            dataCaptureView.visibility = if (isVisible) View.VISIBLE else View.GONE
            dataCaptureView.x = latestInfo.left.pxFromDp()
            dataCaptureView.y = latestInfo.top.pxFromDp()
            dataCaptureView.layoutParams.apply {
                width = latestInfo.width.pxFromDp().toInt()
                height = latestInfo.height.pxFromDp().toInt()
            }
            if (latestInfo.shouldBeUnderWebView) {
                webView?.bringToFront()
                (webView?.parent as? View)?.translationZ = 1F
            } else {
                dataCaptureView.bringToFront()
                (webView?.parent as? View)?.translationZ = -1F
            }
            dataCaptureView.requestLayout()
        }
    }
}
