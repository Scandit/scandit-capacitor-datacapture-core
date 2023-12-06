/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.capacitor.datacapture.core.communication

import com.scandit.datacapture.core.capture.serialization.DataCaptureModeDeserializer

interface ModeDeserializersProvider {
    fun provideModeDeserializers(): List<DataCaptureModeDeserializer>
}
