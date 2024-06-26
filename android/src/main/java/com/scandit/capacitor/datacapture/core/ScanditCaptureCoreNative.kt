package com.scandit.capacitor.datacapture.core

import android.Manifest
import android.util.Log
import com.getcapacitor.*
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import com.scandit.capacitor.datacapture.core.communication.CameraPermissionGrantedListener
import com.scandit.capacitor.datacapture.core.data.ResizeAndMoveInfo
import com.scandit.capacitor.datacapture.core.data.defaults.*
import com.scandit.capacitor.datacapture.core.errors.*
import com.scandit.capacitor.datacapture.core.handlers.DataCaptureViewHandler
import com.scandit.capacitor.datacapture.core.utils.CapacitorResult
import com.scandit.datacapture.core.source.*
import com.scandit.datacapture.core.ui.DataCaptureView
import com.scandit.datacapture.frameworks.core.CoreModule
import com.scandit.datacapture.frameworks.core.deserialization.DefaultDeserializationLifecycleObserver
import com.scandit.datacapture.frameworks.core.deserialization.DeserializationLifecycleObserver
import com.scandit.datacapture.frameworks.core.events.Emitter
import com.scandit.datacapture.frameworks.core.listeners.FrameworksDataCaptureContextListener
import com.scandit.datacapture.frameworks.core.listeners.FrameworksDataCaptureViewListener
import com.scandit.datacapture.frameworks.core.listeners.FrameworksFrameSourceDeserializer
import com.scandit.datacapture.frameworks.core.listeners.FrameworksFrameSourceListener
import com.scandit.datacapture.frameworks.core.utils.DefaultLastFrameData
import com.scandit.datacapture.frameworks.core.utils.DefaultMainThread
import com.scandit.datacapture.frameworks.core.utils.LastFrameData
import com.scandit.datacapture.frameworks.core.utils.MainThread
import org.json.JSONException
import org.json.JSONObject

@CapacitorPlugin(
    name = "ScanditCaptureCoreNative",
    permissions = [
        Permission(strings = [Manifest.permission.CAMERA], alias = "camera")
    ]
)
class ScanditCaptureCoreNative :
    Plugin(),
    DeserializationLifecycleObserver.Observer,
    Emitter {

    companion object {
        private const val EMPTY_STRING_ERROR = "Empty strings are not allowed."

        private val SCANDIT_PLUGINS = listOf(
            "ScanditBarcodeNative",
            "ScanditParserNative",
            "ScanditIdNative",
            "ScanditTextNative"
        )
    }

    private val captureViewHandler = DataCaptureViewHandler()
    private val frameSourceListener = FrameworksFrameSourceListener(this)
    private val coreModule = CoreModule(
        frameSourceListener,
        FrameworksDataCaptureContextListener(this),
        FrameworksDataCaptureViewListener(this),
        FrameworksFrameSourceDeserializer(frameSourceListener)
    )
    private val mainThread: MainThread = DefaultMainThread.getInstance()
    private val lastFrameData: LastFrameData = DefaultLastFrameData.getInstance()
    private val deserializationLifecycleObserver: DeserializationLifecycleObserver =
        DefaultDeserializationLifecycleObserver.getInstance()

    private var lastFrameSourceState: FrameSourceState = FrameSourceState.OFF

    private val plugins = mutableListOf<Plugin>()
    fun registerPluginInstance(instance: Plugin) {
        plugins.add(instance)
    }

    override fun load() {
        super.load()

        val registeredPlugins = plugins.map {
            it.pluginHandle.id
        }

        SCANDIT_PLUGINS.forEach {
            if (!registeredPlugins.contains(it)) {
                val unregisteredPlugin = bridge.getPlugin(it)

                if (unregisteredPlugin != null) {
                    registerPluginInstance(unregisteredPlugin.instance)
                } else {
                    Log.e("Registering:", "$it not found")
                }
            }
        }

        captureViewHandler.attachWebView(bridge.webView, bridge.activity)
        coreModule.onCreate(this.context)
        deserializationLifecycleObserver.attach(this)
    }

    override fun handleOnStart() {
        if (checkCameraPermission()) {
            coreModule.switchToDesiredCameraState(lastFrameSourceState)
        }
        coreModule.registerDataCaptureContextListener()
        coreModule.registerDataCaptureViewListener()
        coreModule.registerFrameSourceListener()
    }

    override fun handleOnStop() {
        lastFrameSourceState = coreModule.getCurrentCameraDesiredState() ?: FrameSourceState.OFF
        coreModule.switchToDesiredCameraState(FrameSourceState.OFF)
        coreModule.unregisterDataCaptureContextListener()
        coreModule.unregisterDataCaptureViewListener()
        coreModule.unregisterFrameSourceListener()
    }

    override fun handleOnDestroy() {
        deserializationLifecycleObserver.detach(this)
        coreModule.onDestroy()
    }

    override fun onDataCaptureViewDeserialized(dataCaptureView: DataCaptureView?) {
        if (dataCaptureView == null) {
            captureViewHandler.disposeCurrentDataCaptureView()
            return
        }
        captureViewHandler.attachDataCaptureView(dataCaptureView, this.activity)
    }

    private fun checkCameraPermission(): Boolean =
        getPermissionState("camera") == PermissionState.GRANTED

    private fun checkOrRequestInitialCameraPermission(call: PluginCall) {
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            requestPermissionForAlias("camera", call, "initialCameraPermsCallback")
        } else {
            updateContext(call)
        }
    }

    private fun checkOrRequestUpdateCameraPermission(call: PluginCall) {
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            requestPermissionForAlias("camera", call, "updateCameraPermsCallback")
        } else {
            updateContext(call)
        }
    }

    @Suppress("unused")
    @PermissionCallback
    private fun initialCameraPermsCallback(call: PluginCall) {
        if (getPermissionState("camera") == PermissionState.GRANTED) {
            notifyCameraPermissionGrantedToPlugins()
        }
        updateContext(call)
    }

    @Suppress("unused")
    @PermissionCallback
    private fun updateCameraPermsCallback(call: PluginCall) {
        if (getPermissionState("camera") == PermissionState.GRANTED) {
            notifyCameraPermissionGrantedToPlugins()
        }
        updateContext(call)
    }

    private fun notifyCameraPermissionGrantedToPlugins() =
        plugins.filterIsInstance(CameraPermissionGrantedListener::class.java).forEach {
            it.onCameraPermissionGranted()
        }

    //region CameraProxy
    @PluginMethod
    fun getCurrentCameraState(call: PluginCall) =
        coreModule.getCurrentCameraState(CapacitorResult(call))

    @PluginMethod
    fun getIsTorchAvailable(call: PluginCall) {
        val positionJson = call.data.getString("position") ?: return
        coreModule.isTorchAvailable(positionJson, CapacitorResult(call))
    }

    @PluginMethod
    fun registerListenerForCameraEvents(call: PluginCall) {
        coreModule.registerFrameSourceListener()
        call.resolve()
    }

    @PluginMethod
    fun unregisterListenerForCameraEvents(call: PluginCall) {
        coreModule.unregisterFrameSourceListener()
        call.resolve()
    }

    @PluginMethod
    fun switchCameraToDesiredState(call: PluginCall) {
        val desiredStateJson = call.data.getString("desiredState") ?: return
        coreModule.switchCameraToDesiredState(desiredStateJson, CapacitorResult(call))
    }
    //endregion

    //region DataCaptureContextProxy
    @PluginMethod
    fun contextFromJSON(call: PluginCall) {
        initializeContextFromJson(call)
        checkOrRequestInitialCameraPermission(call)
    }

    private fun initializeContextFromJson(call: PluginCall) {
        val jsonString = call.data.getString("context")
            ?: return call.reject(EMPTY_STRING_ERROR)
        coreModule.createContextFromJson(jsonString, CapacitorResult(call))
    }

    @PluginMethod
    fun disposeContext(call: PluginCall) {
        coreModule.disposeContext()
        removeAllListeners(call)
        plugins.forEach {
            it.removeAllListeners(call)
        }
    }

    @PluginMethod
    fun updateContextFromJSON(call: PluginCall) = checkOrRequestUpdateCameraPermission(call)

    private fun updateContext(call: PluginCall) {
        val jsonString = call.data.getString("context")
            ?: return call.reject(EMPTY_STRING_ERROR)

        mainThread.runOnMainThread {
            coreModule.updateContextFromJson(jsonString, CapacitorResult(call))
        }
    }

    //endregion

    //region DataCaptureViewProxy
    @PluginMethod
    fun setViewPositionAndSize(call: PluginCall) {
        try {
            val positionJson = call.data.getString("position")
                ?: return call.reject(EMPTY_STRING_ERROR)
            val info = JSONObject(positionJson)
            captureViewHandler.setResizeAndMoveInfo(ResizeAndMoveInfo(info))
            call.resolve()
        } catch (e: JSONException) {
            call.reject(JsonParseError(e.message).toString())
        }
    }

    @PluginMethod
    fun showView(call: PluginCall) {
        captureViewHandler.setVisible()
        call.resolve()
    }

    @PluginMethod
    fun hideView(call: PluginCall) {
        captureViewHandler.setInvisible()
        call.resolve()
    }

    @PluginMethod
    fun viewPointForFramePoint(call: PluginCall) {
        val pointJson = call.data.getString("point")
            ?: return call.reject(EMPTY_STRING_ERROR)

        coreModule.viewPointForFramePoint(pointJson, CapacitorResult(call))
    }

    @PluginMethod
    fun viewQuadrilateralForFrameQuadrilateral(call: PluginCall) {
        val pointJson = call.data.getString("point")
            ?: return call.reject(EMPTY_STRING_ERROR)

        coreModule.viewQuadrilateralForFrameQuadrilateral(pointJson, CapacitorResult(call))
    }
    //endregion

    //region Feedback
    @PluginMethod
    fun emitFeedback(call: PluginCall) {
        call.data.getString("feedback")?.let {
            coreModule.emitFeedback(it, CapacitorResult(call))
        }
    }
    //endregion

    @PluginMethod
    fun getDefaults(call: PluginCall) {
        val defaults = coreModule.getDefaults()
        call.resolve(JSObject.fromJSONObject(JSONObject(defaults)))
    }

    @PluginMethod
    fun subscribeContextListener(call: PluginCall) {
        coreModule.registerDataCaptureContextListener()
        call.resolve()
    }

    @PluginMethod
    fun unsubscribeContextListener(call: PluginCall) {
        coreModule.unregisterDataCaptureContextListener()
        call.resolve()
    }

    @PluginMethod
    fun subscribeViewListener(call: PluginCall) {
        coreModule.registerDataCaptureViewListener()
        call.resolve()
    }

    @PluginMethod
    fun unsubscribeViewListener(call: PluginCall) {
        coreModule.unregisterDataCaptureViewListener()
        call.resolve()
    }

    @PluginMethod
    fun getLastFrame(call: PluginCall) {
        lastFrameData.getLastFrameDataJson {
            if (it == null) {
                call.reject(NullFrameError().serializeContent().toString())
                return@getLastFrameDataJson
            }
            CapacitorResult(call).success(it)
        }
    }

    @PluginMethod
    fun getLastFrameOrNull(call: PluginCall) {
        lastFrameData.getLastFrameDataJson {
            CapacitorResult(call).success(it)
        }
    }

    @PluginMethod
    fun subscribeVolumeButtonObserver(call: PluginCall) = call.resolve()

    @PluginMethod
    fun unsubscribeVolumeButtonObserver(call: PluginCall) = call.resolve()

    //endregion

    @PluginMethod
    fun addModeToContext(call: PluginCall) {
        val modeJson = call.data.getString("modeJson")
            ?: return call.reject(EMPTY_STRING_ERROR)
        coreModule.addModeToContext(modeJson, CapacitorResult(call))
    }

    @PluginMethod
    fun removeModeFromContext(call: PluginCall) {
        val modeJson = call.data.getString("modeJson")
            ?: return call.reject(EMPTY_STRING_ERROR)
        coreModule.removeModeFromContext(modeJson, CapacitorResult(call))
    }

    @PluginMethod
    fun removeAllModesFromContext(call: PluginCall) {
        coreModule.removeAllModes(CapacitorResult(call))
    }

    @PluginMethod
    fun createDataCaptureView(call: PluginCall) {
        val viewJson = call.data.getString("viewJson")
            ?: return call.reject(EMPTY_STRING_ERROR)
        coreModule.createDataCaptureView(viewJson, CapacitorResult(call))
    }

    @PluginMethod
    fun updateDataCaptureView(call: PluginCall) {
        val viewJson = call.data.getString("viewJson")
            ?: return call.reject(EMPTY_STRING_ERROR)
        coreModule.updateDataCaptureView(viewJson, CapacitorResult(call))
    }

    @PluginMethod
    fun addOverlay(call: PluginCall) {
        val overlayJson = call.data.getString("overlayJson")
            ?: return call.reject(EMPTY_STRING_ERROR)
        coreModule.addOverlayToView(overlayJson, CapacitorResult(call))
    }

    @PluginMethod
    fun removeOverlay(call: PluginCall) {
        val overlayJson = call.data.getString("overlayJson")
            ?: return call.reject(EMPTY_STRING_ERROR)
        coreModule.removeOverlayFromView(overlayJson, CapacitorResult(call))
    }

    @PluginMethod
    fun removeAllOverlays(call: PluginCall) {
        coreModule.removeAllOverlays(CapacitorResult(call))
    }

    override fun emit(eventName: String, payload: MutableMap<String, Any?>) {
        payload["name"] = eventName
        notifyListeners(eventName, JSObject.fromJSONObject(JSONObject(payload)))
    }

    override fun hasListenersForEvent(eventName: String): Boolean = this.hasListeners(eventName)
}
