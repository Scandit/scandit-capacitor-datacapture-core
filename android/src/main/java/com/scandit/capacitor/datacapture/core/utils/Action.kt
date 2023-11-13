/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.capacitor.datacapture.core.utils

import com.getcapacitor.PluginCall
import org.json.JSONArray

interface Action {
    fun run(call: PluginCall)
}

interface ActionJsonParseErrorResultListener {
    fun onJsonParseError(error: Throwable, call: PluginCall)
}

interface AdditionalActionRequiredResultListener {
    fun onAdditionalActionRequired(
        actionName: String,
        args: JSONArray,
        call: PluginCall
    )
}
