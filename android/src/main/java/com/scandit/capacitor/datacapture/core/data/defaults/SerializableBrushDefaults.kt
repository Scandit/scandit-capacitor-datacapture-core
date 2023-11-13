/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.capacitor.datacapture.core.data.defaults

import com.scandit.capacitor.datacapture.core.data.SerializableData
import com.scandit.capacitor.datacapture.core.testing.OpenForTesting
import com.scandit.capacitor.datacapture.core.utils.hexString
import com.scandit.datacapture.core.ui.style.Brush
import org.json.JSONObject

@OpenForTesting
data class SerializableBrushDefaults(
    private val fillColor: String?,
    private val strokeColor: String?,
    private val strokeWidth: Float?
) : SerializableData {

    constructor(brush: Brush?) : this(
        fillColor = brush?.fillColor?.hexString,
        strokeColor = brush?.strokeColor?.hexString,
        strokeWidth = brush?.strokeWidth
    )

    override fun toJson(): JSONObject = JSONObject(
        mapOf(
            FIELD_FILL_COLOR to fillColor,
            FIELD_STROKE_COLOR to strokeColor,
            FIELD_STROKE_WIDTH to strokeWidth
        )
    )

    fun toJSONObject(): JSONObject {
        val data = JSONObject()

        data.put(FIELD_FILL_COLOR, fillColor)
        data.put(FIELD_STROKE_COLOR, strokeColor)
        data.put(FIELD_STROKE_WIDTH, strokeWidth?.toDouble() ?: 0.0)

        return data
    }

    companion object {
        private const val FIELD_FILL_COLOR = "fillColor"
        private const val FIELD_STROKE_COLOR = "strokeColor"
        private const val FIELD_STROKE_WIDTH = "strokeWidth"
    }
}
