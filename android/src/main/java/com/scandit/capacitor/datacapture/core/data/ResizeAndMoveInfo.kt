/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.capacitor.datacapture.core.data

data class ResizeAndMoveInfo(
    val top: Float,
    val left: Float,
    val width: Float,
    val height: Float,
    val shouldBeUnderWebView: Boolean
)
