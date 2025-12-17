package com.scandit.capacitor.datacapture.core.utils

import com.getcapacitor.PluginCall
import com.scandit.datacapture.frameworks.core.context.data.toMap
import com.scandit.datacapture.frameworks.core.method.FrameworksMethodCall

class CapacitorMethodCall(
    private val call: PluginCall
) : FrameworksMethodCall {
    override val method: String
        get() = call.data.getString("methodName") ?: "unknown"

    @Suppress("UNCHECKED_CAST")
    override fun <T> argument(key: String): T {
        val value = call.data.opt(key)
        return value as T
    }

    override fun hasArgument(key: String): Boolean = call.data.has(key)

    override fun arguments(): Map<String, Any?> = call.data.toMap()
}
