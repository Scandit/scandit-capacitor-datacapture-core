/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.capacitor.datacapture.core.utils

import android.view.View
import android.view.ViewGroup
import com.scandit.datacapture.core.internal.sdk.AppAndroidEnvironment

fun Int.pxFromDp(): Float {
    val context = AppAndroidEnvironment.applicationContext
    val displayDensity = context.resources.displayMetrics.density
    return (this * displayDensity + 0.5f)
}

fun Float.pxFromDp(): Float {
    val context = AppAndroidEnvironment.applicationContext
    val displayDensity = context.resources.displayMetrics.density
    return (this * displayDensity + 0.5f)
}

fun View.removeFromParent() {
    val parent = parent as? ViewGroup ?: return
    parent.removeView(this)
}
