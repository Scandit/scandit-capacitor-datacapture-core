package com.scandit.capacitor.datacapture.core

import android.Manifest
import android.util.Log
import com.getcapacitor.*
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import com.scandit.capacitor.datacapture.core.communication.CameraPermissionGrantedListener
import com.scandit.capacitor.datacapture.core.communication.ComponentDeserializersProvider
import com.scandit.capacitor.datacapture.core.communication.ModeDeserializersProvider
import com.scandit.capacitor.datacapture.core.data.ResizeAndMoveInfo
import com.scandit.capacitor.datacapture.core.data.SerializablePoint
import com.scandit.capacitor.datacapture.core.data.SerializableViewState
import com.scandit.capacitor.datacapture.core.data.defaults.*
import com.scandit.capacitor.datacapture.core.deserializers.DeserializationLifecycleObserver
import com.scandit.capacitor.datacapture.core.deserializers.Deserializers
import com.scandit.capacitor.datacapture.core.deserializers.DeserializersProvider
import com.scandit.capacitor.datacapture.core.errors.*
import com.scandit.capacitor.datacapture.core.handlers.DataCaptureComponentsHandler
import com.scandit.capacitor.datacapture.core.handlers.DataCaptureContextHandler
import com.scandit.capacitor.datacapture.core.handlers.DataCaptureViewHandler
import com.scandit.capacitor.datacapture.core.utils.dpFromPx
import com.scandit.capacitor.datacapture.core.utils.hexString
import com.scandit.capacitor.datacapture.core.workers.UiWorker
import com.scandit.datacapture.core.capture.DataCaptureContext
import com.scandit.datacapture.core.capture.DataCaptureContextListener
import com.scandit.datacapture.core.capture.serialization.DataCaptureModeDeserializer
import com.scandit.datacapture.core.common.ContextStatus
import com.scandit.datacapture.core.common.feedback.Feedback
import com.scandit.datacapture.core.common.geometry.QuadrilateralDeserializer
import com.scandit.datacapture.core.common.geometry.toJson
import com.scandit.datacapture.core.component.serialization.DataCaptureComponentDeserializer
import com.scandit.datacapture.core.data.FrameData
import com.scandit.datacapture.core.data.toJson
import com.scandit.datacapture.core.json.JsonValue
import com.scandit.datacapture.core.source.*
import com.scandit.datacapture.core.source.serialization.FrameSourceDeserializer
import com.scandit.datacapture.core.source.serialization.FrameSourceDeserializerListener
import com.scandit.datacapture.core.ui.DataCaptureView
import com.scandit.datacapture.core.ui.DataCaptureViewListener
import com.scandit.datacapture.core.ui.style.Brush
import com.scandit.datacapture.core.ui.viewfinder.AimerViewfinder
import com.scandit.datacapture.core.ui.viewfinder.LaserlineViewfinder
import com.scandit.datacapture.core.ui.viewfinder.LaserlineViewfinderStyle
import com.scandit.datacapture.core.ui.viewfinder.RectangularViewfinder
import com.scandit.datacapture.core.ui.viewfinder.RectangularViewfinderStyle
import org.json.JSONArray
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
    CoreActions,
    DeserializersProvider,
    DataCaptureContextListener,
    DataCaptureViewListener,
    FrameSourceDeserializerListener {

    companion object {
        private const val ACTION_STATUS_CHANGED = "didChangeStatus"
        private const val ACTION_CONTEXT_OBSERVATION_STARTED = "didStartObservingContext"
        private const val ACTION_VIEW_SIZE_CHANGED = "didChangeSizeOrientation"
        private const val EMPTY_STRING_ERROR = "Empty strings are not allowed."

        private val SCANDIT_PLUGINS = listOf(
            "ScanditBarcodeNative",
            "ScanditParserNative",
            "ScanditIdNative",
            "ScanditTextNative"
        )

        var lastFrame: FrameData? = null
    }

    private val uiWorker = UiWorker()

    private val captureContextHandler = DataCaptureContextHandler(this)
    private val captureComponentsHandler = DataCaptureComponentsHandler()
    private val captureViewHandler = DataCaptureViewHandler(this, uiWorker)

    private var lastFrameSourceState: FrameSourceState = FrameSourceState.OFF

    private var latestFeedback: Feedback? = null

    private val plugins = mutableListOf<Plugin>()

    override val deserializers: Deserializers by lazy {
        Deserializers(
            bridge.context,
            retrieveAllModeDeserializers(),
            retrieveAllComponentDeserializers(),
            this
        )
    }

    fun registerPluginInstance(instance: Plugin) {
        plugins.add(instance)
    }

    override fun handleOnStart() {
        super.handleOnStart()
        if (checkCameraPermission()) {
            captureContextHandler.camera?.switchToDesiredState(lastFrameSourceState)
        }
    }

    override fun handleOnStop() {
        super.handleOnStop()
        lastFrameSourceState = captureContextHandler.camera?.desiredState ?: FrameSourceState.OFF
        captureContextHandler.camera?.switchToDesiredState(FrameSourceState.OFF)
        latestFeedback?.release()
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
    }

    private fun retrieveAllModeDeserializers(): List<DataCaptureModeDeserializer> =
        plugins
            .filterIsInstance(ModeDeserializersProvider::class.java)
            .map { it.provideModeDeserializers() }
            .flatten()

    private fun retrieveAllComponentDeserializers(): List<DataCaptureComponentDeserializer> =
        plugins
            .filterIsInstance(ComponentDeserializersProvider::class.java)
            .map { it.provideComponentDeserializers() }
            .flatten()

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

    private fun notifyCameraPermissionGrantedToPlugins() {
        plugins.filterIsInstance(CameraPermissionGrantedListener::class.java).forEach {
            it.onCameraPermissionGranted()
        }
    }

    //region FrameSourceDeserializerListener
    override fun onFrameSourceDeserializationFinished(
        deserializer: FrameSourceDeserializer,
        frameSource: FrameSource,
        json: JsonValue
    ) {
        (frameSource as? Camera)?.apply {
            if (json.contains("desiredTorchState")) {
                desiredTorchState = TorchStateDeserializer.fromJson(
                    json.requireByKeyAsString("desiredTorchState")
                )
            }

            if (json.contains("desiredState")) {
                switchToDesiredState(
                    FrameSourceStateDeserializer.fromJson(
                        json.requireByKeyAsString("desiredState")
                    )
                )
            }
        }
    }
    //endregion

    //region DataCaptureContextListener
    override fun onStatusChanged(
        dataCaptureContext: DataCaptureContext,
        contextStatus: ContextStatus
    ) {
        val ev = JSObject()
        ev.put("name", ACTION_STATUS_CHANGED)
        ev.put("argument", contextStatus)
        notifyListeners(ACTION_STATUS_CHANGED, ev)
    }

    override fun onObservationStarted(dataCaptureContext: DataCaptureContext) {
        val ev = JSObject()
        ev.put("name", ACTION_CONTEXT_OBSERVATION_STARTED)
        ev.put("argument", dataCaptureContext)
        notifyListeners(ACTION_CONTEXT_OBSERVATION_STARTED, ev)
    }
    //endregion

    //region DataCaptureViewListener
    override fun onSizeChanged(width: Int, height: Int, screenRotation: Int) {
        val ev = JSObject()
        ev.put("name", ACTION_VIEW_SIZE_CHANGED)
        ev.put(
            "argument",
            JSONArray().apply {
                put(
                    SerializableViewState(width, height, screenRotation).toJson()
                )
            }
        )
    }
    //endregion

    //region CameraProxy
    @PluginMethod
    override fun getCurrentCameraState(call: PluginCall) {
        captureContextHandler.camera?.let {
            call.resolve(JSObject(it.currentState.toJson()))
        } ?: kotlin.run {
            call.reject(NoCameraAvailableError().serializeContent().toString())
        }
    }

    @PluginMethod
    override fun getIsTorchAvailable(call: PluginCall) {
        captureContextHandler.camera?.let {
            val positionJson = call.data.getString("position") ?: return

            val cameraPosition = try {
                CameraPositionDeserializer.fromJson(positionJson)
            } catch (e: Exception) {
                println(e)
                call.reject(
                    CameraPositionDeserializationError("GetIsTorchAvailable")
                        .serializeContent()
                        .toString()
                )
                return
            }

            if (cameraPosition != it.position) {
                call.reject(
                    NoCameraWithPositionError(cameraPosition.toString())
                        .serializeContent()
                        .toString()
                )
                return
            }

            call.resolve(JSObject(it.isTorchAvailable.toString()))
        } ?: kotlin.run {
            call.reject(NoCameraAvailableError().serializeContent().toString())
        }
    }
    //endregion

    //region DataCaptureContextProxy
    @PluginMethod
    override fun contextFromJSON(call: PluginCall) {
        initializeContextFromJson(call)
        checkOrRequestInitialCameraPermission(call)
    }

    private fun initializeContextFromJson(call: PluginCall) {
        try {
            val jsonString = call.data.getString("context")
                ?: return call.reject(EMPTY_STRING_ERROR)
            val deserializationResult = deserializers.dataCaptureContextDeserializer
                .contextFromJson(jsonString)
            val view = deserializationResult.view
            val dataCaptureContext = deserializationResult.dataCaptureContext
            val dataCaptureComponents = deserializationResult.components

            captureContextHandler.attachDataCaptureContext(dataCaptureContext)
            if (view != null) {
                captureViewHandler.attachDataCaptureView(view, bridge.activity)
            }
            captureComponentsHandler.attachDataCaptureComponents(dataCaptureComponents)
            call.resolve()
        } catch (e: JSONException) {
            call.reject(JsonParseError(e.message).toString())
        } catch (e: RuntimeException) { // TODO SDC-1851 fine-catch deserializer exceptions
            call.reject(JsonParseError(e.message).toString())
        } catch (e: Exception) {
            call.reject(ContextDeserializationError(e.message).toString())
        }
    }

    @PluginMethod
    override fun disposeContext(call: PluginCall) {
        captureContextHandler.disposeCurrent()
        captureComponentsHandler.disposeCurrent()
        captureViewHandler.disposeCurrent()
        removeAllListeners(call)
        plugins.forEach {
          it.removeAllListeners(call)
        }
    }

    @PluginMethod
    override fun updateContextFromJSON(call: PluginCall) {
        checkOrRequestUpdateCameraPermission(call)
    }

    private fun updateContext(call: PluginCall) {
        val dcContext = captureContextHandler.dataCaptureContext ?: return

        try {
            val jsonString = call.data.getString("context")
                ?: return call.reject(EMPTY_STRING_ERROR)

            DeserializationLifecycleObserver.dispatchParsersRemoved()

            uiWorker.post {
                val deserializationResult =
                    deserializers.dataCaptureContextDeserializer.updateContextFromJson(
                        dcContext,
                        captureViewHandler.dataCaptureView,
                        captureComponentsHandler.dataCaptureComponents,
                        jsonString
                    )
                val view = deserializationResult.view
                val dataCaptureContext = deserializationResult.dataCaptureContext
                val dataCaptureComponents = deserializationResult.components

                captureContextHandler.attachDataCaptureContext(dataCaptureContext)
                if (view != null) {
                    captureViewHandler.attachDataCaptureView(view, bridge.activity)
                }
                captureComponentsHandler.attachDataCaptureComponents(dataCaptureComponents)

                call.resolve()
            }
        } catch (e: JSONException) {
            call.reject(JsonParseError(e.message).toString())
        } catch (e: RuntimeException) { // TODO SDC-1851 fine-catch deserializer exceptions
            call.reject(JsonParseError(e.message).toString())
        } catch (e: Exception) {
            call.reject(ContextDeserializationError(e.message).toString())
        }
    }

    //endregion

    //region DataCaptureViewProxy
    @PluginMethod
    override fun setViewPositionAndSize(call: PluginCall) {
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
    override fun showView(call: PluginCall) {
        captureViewHandler.setVisible()
        call.resolve()
    }

    @PluginMethod
    override fun hideView(call: PluginCall) {
        captureViewHandler.setInvisible()
        call.resolve()
    }

    @PluginMethod
    override fun viewPointForFramePoint(call: PluginCall) {
        try {
            if (captureViewHandler.dataCaptureView == null) {
                call.reject(NoViewToConvertPointError().serializeContent().toString())
            } else {
                val pointJson = call.data.getString("point")
                    ?: return call.reject(EMPTY_STRING_ERROR)
                val point = SerializablePoint(
                    JSONObject(pointJson)
                ).toScanditPoint()
                val mappedPoint = captureViewHandler.dataCaptureView!!
                    .mapFramePointToView(point)
                    .dpFromPx()
                call.resolve(JSObject(mappedPoint.toJson()))
            }
        } catch (e: Exception) { // TODO SDC-1851 fine-catch deserializer exceptions
            call.reject(JsonParseError(e.message).toString())
        }
    }

    @PluginMethod
    override fun viewQuadrilateralForFrameQuadrilateral(call: PluginCall) {
        try {
            if (captureViewHandler.dataCaptureView == null) {
                call.reject(NoViewToConvertQuadrilateralError().serializeContent().toString())
            } else {
                val pointJson = call.data.getString("point")
                    ?: return call.reject(EMPTY_STRING_ERROR)
                val quadrilateral = QuadrilateralDeserializer.fromJson(pointJson)
                val mappedQuadrilateral = captureViewHandler.dataCaptureView!!
                    .mapFrameQuadrilateralToView(quadrilateral)
                    .dpFromPx()
                call.resolve(JSObject(mappedQuadrilateral.toJson()))
            }
        } catch (e: Exception) { // TODO SDC-1851 fine-catch deserializer exceptions
            call.reject(JsonParseError(e.message).toString())
        }
    }
    //endregion

    //region Feedback
    @PluginMethod
    override fun emitFeedback(call: PluginCall) {
        try {
            val jsonObject = call.data.getString("feedback")
            val feedback = Feedback.fromJson(jsonObject.toString())

            latestFeedback?.release()
            feedback.emit()
            latestFeedback = feedback

            call.resolve()
        } catch (e: JSONException) {
            call.reject(JsonParseError(e.message).toString())
        } catch (e: RuntimeException) { // TODO [SDC-1851] - fine-catch deserializer exceptions
            call.reject(JsonParseError(e.message).toString())
        }
    }
    //endregion

    @PluginMethod
    override fun getDefaults(call: PluginCall) {
        try {
            val cameraSettings = CameraSettings()
            val dataCaptureView = DataCaptureView.newInstance(context, null)
            val laserViewfinder = LaserlineViewfinder(LaserlineViewfinderStyle.LEGACY)
            val rectangularViewfinder = RectangularViewfinder(RectangularViewfinderStyle.LEGACY)
            val aimerViewfinder = AimerViewfinder()
            val brush = Brush.transparent()
            val availableCameraPositions = listOfNotNull(
                Camera.getCamera(CameraPosition.USER_FACING)?.position,
                Camera.getCamera(CameraPosition.WORLD_FACING)?.position
            )
            val defaults = SerializableCoreDefaults(
                cameraDefaults = SerializableCameraDefaults(
                    cameraSettingsDefault = SerializableCameraSettingsDefault(
                        settings = cameraSettings
                    ),
                    availablePositions = JSONArray(
                        availableCameraPositions.map { it.toJson() }
                    ),
                    defaultPosition = Camera.getDefaultCamera()?.position?.toJson()
                ),
                dataCaptureViewDefaults = SerializableDataCaptureViewDefaults(
                    scanAreaMargins = dataCaptureView.scanAreaMargins.toJson(),
                    pointOfInterest = dataCaptureView.pointOfInterest.toJson(),
                    logoAnchor = dataCaptureView.logoAnchor.toJson(),
                    logoOffset = dataCaptureView.logoOffset.toJson(),
                    focusGesture = dataCaptureView.focusGesture?.toJson(),
                    zoomGesture = dataCaptureView.zoomGesture?.toJson(),
                    logoStyle = dataCaptureView.logoStyle.toString()
                ),
                laserlineViewfinderDefaults = SerializableLaserlineViewfinderDefaults(
                    viewFinder = laserViewfinder
                ),
                rectangularViewfinderDefaults = SerializableRectangularViewfinderDefaults(
                    viewFinder = rectangularViewfinder
                ),
                aimerViewfinderDefaults = SerializableAimerViewfinderDefaults(
                    frameColor = aimerViewfinder.frameColor.hexString,
                    dotColor = aimerViewfinder.dotColor.hexString
                ),
                brushDefaults = SerializableBrushDefaults(
                    brush = brush
                )
            )
            call.resolve(JSObject.fromJSONObject(defaults.toJson()))
        } catch (e: JSONException) {
            call.reject(JsonParseError(e.message).toString())
        }
    }

    @PluginMethod
    override fun subscribeContextListener(call: PluginCall) {
        call.resolve()
    }

    @PluginMethod
    override fun subscribeViewListener(call: PluginCall) {
        call.resolve()
    }

    @PluginMethod
    fun getLastFrame(call: PluginCall) {
        val lastFrame = ScanditCaptureCoreNative.lastFrame

        if (lastFrame == null) {
            call.reject(NullFrameError().serializeContent().toString())
            return
        }

        call.resolve(JSObject(ScanditCaptureCoreNative.lastFrame?.toJson()))
    }

    @PluginMethod
    fun getLastFrameOrNull(call: PluginCall) {
        call.resolve(JSObject(ScanditCaptureCoreNative.lastFrame?.toJson()))
    }

    //endregion
}

interface CoreActions {
    fun getCurrentCameraState(call: PluginCall)
    fun getIsTorchAvailable(call: PluginCall)

    fun contextFromJSON(call: PluginCall)
    fun disposeContext(call: PluginCall)
    fun updateContextFromJSON(call: PluginCall)

    fun setViewPositionAndSize(call: PluginCall)
    fun showView(call: PluginCall)
    fun hideView(call: PluginCall)
    fun viewPointForFramePoint(call: PluginCall)
    fun viewQuadrilateralForFrameQuadrilateral(call: PluginCall)

    fun emitFeedback(call: PluginCall)

    fun getDefaults(call: PluginCall)

    fun subscribeContextListener(call: PluginCall)
    fun subscribeViewListener(call: PluginCall)
}
