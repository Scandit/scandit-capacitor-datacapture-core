package com.scandit.capacitor.datacapture.core.utils

import com.getcapacitor.JSObject
import com.getcapacitor.PluginCall
import com.scandit.datacapture.frameworks.core.result.FrameworksResult
import org.json.JSONObject

class CapacitorResult(private val call: PluginCall) : FrameworksResult {
    override fun success(result: Any?) {
        if (result == null) {
            call.resolve()
            return
        }

        val resultData = if (result is Map<*, *>) {
            JSONObject(result).toString()
        } else {
            result.toString()
        }

        val capacitorPayload = JSObject()
        capacitorPayload.put("data", resultData)

        call.resolve(capacitorPayload)
    }

    override fun error(errorCode: String, errorMessage: String?, errorDetails: Any?) {
        call.reject(errorMessage, errorMessage)
    }
}

class CapacitorNoopResult : FrameworksResult {
    override fun success(result: Any?) {
        // noop
    }

    override fun error(errorCode: String, errorMessage: String?, errorDetails: Any?) {
        // noop
    }
}
