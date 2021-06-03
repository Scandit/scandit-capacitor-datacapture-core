package com.scandit.capacitor.datacapture.core

import android.Manifest
import android.content.pm.PackageManager
import com.getcapacitor.JSObject
import com.getcapacitor.NativePlugin
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.scandit.capacitor.datacapture.core.communication.CameraPermissionGrantedListener
import com.scandit.capacitor.datacapture.core.communication.ComponentDeserializersProvider
import com.scandit.capacitor.datacapture.core.communication.ModeDeserializersProvider
import com.scandit.capacitor.datacapture.core.data.ResizeAndMoveInfo
import com.scandit.capacitor.datacapture.core.data.SerializablePoint
import com.scandit.capacitor.datacapture.core.data.SerializableViewState
import com.scandit.capacitor.datacapture.core.data.defaults.SerializableAimerViewfinderDefaults
import com.scandit.capacitor.datacapture.core.data.defaults.SerializableBrushDefaults
import com.scandit.capacitor.datacapture.core.data.defaults.SerializableCameraDefaults
import com.scandit.capacitor.datacapture.core.data.defaults.SerializableCameraSettingsDefault
import com.scandit.capacitor.datacapture.core.data.defaults.SerializableCoreDefaults
import com.scandit.capacitor.datacapture.core.data.defaults.SerializableDataCaptureViewDefaults
import com.scandit.capacitor.datacapture.core.data.defaults.SerializableLaserlineViewfinderDefaults
import com.scandit.capacitor.datacapture.core.data.defaults.SerializableRectangularViewfinderDefaults
import com.scandit.capacitor.datacapture.core.deserializers.Deserializers
import com.scandit.capacitor.datacapture.core.deserializers.DeserializersProvider
import com.scandit.capacitor.datacapture.core.errors.CameraPositionDeserializationError
import com.scandit.capacitor.datacapture.core.errors.ContextDeserializationError
import com.scandit.capacitor.datacapture.core.errors.JsonParseError
import com.scandit.capacitor.datacapture.core.errors.NoCameraAvailableError
import com.scandit.capacitor.datacapture.core.errors.NoCameraWithPositionError
import com.scandit.capacitor.datacapture.core.errors.NoViewToConvertPointError
import com.scandit.capacitor.datacapture.core.errors.NoViewToConvertQuadrilateralError
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
import com.scandit.datacapture.core.json.JsonValue
import com.scandit.datacapture.core.source.Camera
import com.scandit.datacapture.core.source.CameraPosition
import com.scandit.datacapture.core.source.CameraPositionDeserializer
import com.scandit.datacapture.core.source.CameraSettings
import com.scandit.datacapture.core.source.FrameSource
import com.scandit.datacapture.core.source.FrameSourceState
import com.scandit.datacapture.core.source.FrameSourceStateDeserializer
import com.scandit.datacapture.core.source.TorchStateDeserializer
import com.scandit.datacapture.core.source.serialization.FrameSourceDeserializer
import com.scandit.datacapture.core.source.serialization.FrameSourceDeserializerListener
import com.scandit.datacapture.core.source.toJson
import com.scandit.datacapture.core.ui.DataCaptureView
import com.scandit.datacapture.core.ui.DataCaptureViewListener
import com.scandit.datacapture.core.ui.style.Brush
import com.scandit.datacapture.core.ui.viewfinder.AimerViewfinder
import com.scandit.datacapture.core.ui.viewfinder.LaserlineViewfinder
import com.scandit.datacapture.core.ui.viewfinder.RectangularViewfinder
import java.util.concurrent.atomic.AtomicBoolean
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

@NativePlugin(
    requestCodes = [
        ScanditCaptureCoreNative.CODE_CAMERA_PERMISSIONS
    ],
    permissions = [
        Manifest.permission.CAMERA
    ]
)
class ScanditCaptureCoreNative : Plugin(),
    CoreActions,
    DeserializersProvider,
    DataCaptureContextListener,
    DataCaptureViewListener,
    FrameSourceDeserializerListener {

    companion object {
        const val CODE_CAMERA_PERMISSIONS = 200

        private const val ACTION_STATUS_CHANGED = "didChangeStatus"
        private const val ACTION_CONTEXT_OBSERVATION_STARTED = "didStartObservingContext"
        private const val ACTION_VIEW_SIZE_CHANGED = "didChangeSizeOrientation"
    }

    private val uiWorker = UiWorker()

    private val cameraPermissionsGranted: AtomicBoolean = AtomicBoolean(false)
    private val cameraPermissionsRequested: AtomicBoolean = AtomicBoolean(false)

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
        captureViewHandler.attachWebView(bridge.webView, bridge.activity)
        checkOrRequestCameraPermission()
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

    private fun checkCameraPermission(): Boolean {
        val hasPermission = hasRequiredPermissions()
        if (hasPermission) {
            cameraPermissionsGranted.set(true)
            cameraPermissionsRequested.set(false)
        }
        return hasPermission
    }

    private fun checkOrRequestCameraPermission() {
        if (checkCameraPermission().not()) {
            pluginRequestPermissions(arrayOf(
                Manifest.permission.CAMERA
            ), CODE_CAMERA_PERMISSIONS)
        }
    }

    override fun handleRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>?,
        grantResults: IntArray?
    ) {
        super.handleRequestPermissionsResult(requestCode, permissions, grantResults)

        for (result in grantResults!!) {
            if (result == PackageManager.PERMISSION_DENIED) {
                cameraPermissionsRequested.set(false)
                return
            }
        }

        if (requestCode == CODE_CAMERA_PERMISSIONS) {
            cameraPermissionsGranted.set(true)
            cameraPermissionsRequested.set(false)
            notifyCameraPermissionGrantedToPlugins()
        }
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
                switchToDesiredState(FrameSourceStateDeserializer.fromJson(
                    json.requireByKeyAsString("desiredState")
                ))
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
        ev.put("argument", JSONArray().apply {
            put(
                SerializableViewState(width, height, screenRotation).toJson()
            )
        })
    }
    //endregion

    //region CameraProxy
    @PluginMethod
    override fun getCurrentCameraState(call: PluginCall) {
        captureContextHandler.camera?.let {
            call.success(JSObject(it.currentState.toJson()))
        } ?: kotlin.run {
            call.reject(NoCameraAvailableError().serializeContent().toString())
        }
    }

    @PluginMethod
    override fun getIsTorchAvailable(call: PluginCall) {
        captureContextHandler.camera?.let {
            val cameraPosition = try {
                CameraPositionDeserializer.fromJson(call.data.getString("position"))
            } catch (e: Exception) {
                call.reject(
                    CameraPositionDeserializationError("GetIsTorchAvailable")
                        .serializeContent()
                        .toString())
                return
            }

            if (cameraPosition != it.position) {
                call.reject(
                    NoCameraWithPositionError(cameraPosition.toString())
                        .serializeContent()
                        .toString())
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
        try {
            val jsonString = call.data.getString("context")
            val deserializationResult = deserializers.dataCaptureContextDeserializer
                .contextFromJson(jsonString)
            val view = deserializationResult.view
            val dataCaptureContext = deserializationResult.dataCaptureContext
            val dataCaptureComponents = deserializationResult.components

            captureContextHandler.attachDataCaptureContext(dataCaptureContext)
            captureViewHandler.attachDataCaptureView(view!!, bridge.activity)
            captureComponentsHandler.attachDataCaptureComponents(dataCaptureComponents)
            call.success()
        } catch (e: JSONException) {
            e.printStackTrace()
            call.reject(JsonParseError(e.message).toString())
        } catch (e: RuntimeException) { // TODO SDC-1851 fine-catch deserializer exceptions
            e.printStackTrace()
            call.reject(JsonParseError(e.message).toString())
        } catch (e: Exception) {
            e.printStackTrace()
            call.reject(ContextDeserializationError(e.message).toString())
        }
    }

    @PluginMethod
    override fun disposeContext(call: PluginCall) {
        captureContextHandler.disposeCurrent()
        captureComponentsHandler.disposeCurrent()
        captureViewHandler.disposeCurrent()
        call.success()
    }

    @PluginMethod
    override fun updateContextFromJSON(call: PluginCall) {
        try {
            if (captureContextHandler.dataCaptureContext == null) {
                captureContextHandler.attachDataCaptureContext(
                    captureContextHandler.dataCaptureContext!!
                )
                captureViewHandler.attachDataCaptureView(
                    captureViewHandler.dataCaptureView!!, bridge.activity
                )
                captureComponentsHandler.attachDataCaptureComponents(
                    captureComponentsHandler.dataCaptureComponents
                )
                call.success()
            } else {
                val jsonString = call.data.getString("context")
                uiWorker.post {
                    val deserializationResult =
                        deserializers.dataCaptureContextDeserializer.updateContextFromJson(
                            captureContextHandler.dataCaptureContext!!,
                            captureViewHandler.dataCaptureView,
                            captureComponentsHandler.dataCaptureComponents,
                            jsonString
                        )
                    val view = deserializationResult.view
                    val dataCaptureContext = deserializationResult.dataCaptureContext
                    val dataCaptureComponents = deserializationResult.components

                    captureContextHandler.attachDataCaptureContext(dataCaptureContext)
                    captureViewHandler.attachDataCaptureView(view!!, bridge.activity)
                    captureComponentsHandler.attachDataCaptureComponents(dataCaptureComponents)

                    call.success()
                }
            }
        } catch (e: JSONException) {
            e.printStackTrace()
            call.reject(JsonParseError(e.message).toString())
        } catch (e: RuntimeException) { // TODO SDC-1851 fine-catch deserializer exceptions
            e.printStackTrace()
            call.reject(JsonParseError(e.message).toString())
        } catch (e: Exception) {
            e.printStackTrace()
            call.reject(ContextDeserializationError(e.message).toString())
        }
    }

    //endregion

    //region DataCaptureViewProxy
    @PluginMethod
    override fun setViewPositionAndSize(call: PluginCall) {
        try {
            val info = JSONObject(call.data.getString("position"))
            captureViewHandler.setResizeAndMoveInfo(ResizeAndMoveInfo(info))
            call.success()
        } catch (e: JSONException) {
            e.printStackTrace()
            call.reject(JsonParseError(e.message).toString())
        }
    }

    @PluginMethod
    override fun showView(call: PluginCall) {
        captureViewHandler.setVisible()
        call.success()
    }

    @PluginMethod
    override fun hideView(call: PluginCall) {
        captureViewHandler.setInvisible()
        call.success()
    }

    @PluginMethod
    override fun viewPointForFramePoint(call: PluginCall) {
        try {
            if (captureViewHandler.dataCaptureView == null) {
                call.reject(NoViewToConvertPointError().serializeContent().toString())
            } else {
                val point = SerializablePoint(
                    JSONObject(
                        call.data.getString("point")
                    )
                ).toScanditPoint()
                val mappedPoint = captureViewHandler.dataCaptureView!!
                    .mapFramePointToView(point)
                    .dpFromPx()
                call.success(JSObject(mappedPoint.toJson()))
            }
        } catch (e: Exception) { // TODO SDC-1851 fine-catch deserializer exceptions
            e.printStackTrace()
            call.reject(JsonParseError(e.message).toString())
        }
    }

    @PluginMethod
    override fun viewQuadrilateralForFrameQuadrilateral(call: PluginCall) {
        try {
            if (captureViewHandler.dataCaptureView == null) {
                call.reject(NoViewToConvertQuadrilateralError().serializeContent().toString())
            } else {
                val quadrilateral = QuadrilateralDeserializer.fromJson(
                    call.data.getString("point")
                )
                val mappedQuadrilateral = captureViewHandler.dataCaptureView!!
                    .mapFrameQuadrilateralToView(quadrilateral)
                    .dpFromPx()
                call.success(JSObject(mappedQuadrilateral.toJson()))
            }
        } catch (e: Exception) { // TODO SDC-1851 fine-catch deserializer exceptions
            e.printStackTrace()
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

            call.success()
        } catch (e: JSONException) {
            e.printStackTrace()
            call.reject(JsonParseError(e.message).toString())
        } catch (e: RuntimeException) { // TODO [SDC-1851] - fine-catch deserializer exceptions
            e.printStackTrace()
            call.reject(JsonParseError(e.message).toString())
        }
    }
    //endregion

    @PluginMethod
    override fun getDefaults(call: PluginCall) {
        try {
            val cameraSettings = CameraSettings()
            val dataCaptureView = DataCaptureView.newInstance(context, null)
            val laserViewfinder = LaserlineViewfinder()
            val laserViewfinders = LaserlineViewfinder()
            val rectangularViewfinder = RectangularViewfinder()
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
            e.printStackTrace()
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