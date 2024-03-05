package com.scandit.capacitor.datacapture.core.utils

import com.getcapacitor.JSObject
import com.getcapacitor.PluginCall
import com.scandit.datacapture.frameworks.core.result.FrameworksResult
import org.json.JSONObject

class CapacitorResult(private val call: PluginCall) : FrameworksResult {
    override fun success(result: Any?) {
        if (result is Map<*, *>) {
            call.resolve(JSObject.fromJSONObject(JSONObject(result)))
        } else if (result != null) {
            call.resolve(JSObject().putSafe("data", result))
        } else {
            call.resolve()
        }
    }

    override fun error(errorCode: String, errorMessage: String?, errorDetails: Any?) {
        call.reject(errorMessage, errorMessage)
    }
}
