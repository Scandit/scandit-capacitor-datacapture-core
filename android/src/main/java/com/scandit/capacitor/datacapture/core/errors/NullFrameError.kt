/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2023- Scandit AG. All rights reserved.
 */

package com.scandit.capacitor.datacapture.core.errors

class NullFrameError : ActionError(
    ERROR_CODE,
    "Frame is null, it might've been reused already."
) {
    companion object {
        private const val ERROR_CODE = 10043
    }
}
