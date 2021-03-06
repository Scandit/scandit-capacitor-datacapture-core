/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.capacitor.datacapture.core.data

import org.json.JSONObject

interface SerializableData {
    fun toJson(): JSONObject
}
