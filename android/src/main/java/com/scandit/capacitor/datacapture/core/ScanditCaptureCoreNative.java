package com.scandit.capacitor.datacapture.core;

import android.Manifest;
import android.util.Log;
import androidx.annotation.NonNull;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.scandit.capacitor.datacapture.core.data.ResizeAndMoveInfo;
import com.scandit.capacitor.datacapture.core.errors.JsonParseError;
import com.scandit.capacitor.datacapture.core.handlers.DataCaptureViewHandler;
import com.scandit.capacitor.datacapture.core.utils.CapacitorMethodCall;
import com.scandit.capacitor.datacapture.core.utils.CapacitorResult;
import com.scandit.datacapture.core.source.FrameSourceState;
import com.scandit.datacapture.core.source.FrameSourceStateDeserializer;
import com.scandit.datacapture.core.ui.DataCaptureView;
import com.scandit.datacapture.frameworks.core.CoreModule;
import com.scandit.datacapture.frameworks.core.errors.ParameterNullError;
import com.scandit.datacapture.frameworks.core.events.Emitter;
import com.scandit.datacapture.frameworks.core.lifecycle.ActivityLifecycleDispatcher;
import com.scandit.datacapture.frameworks.core.lifecycle.DefaultActivityLifecycle;
import com.scandit.datacapture.frameworks.core.locator.DefaultServiceLocator;
import com.scandit.datacapture.frameworks.core.result.NoopFrameworksResult;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.jetbrains.annotations.NotNull;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(
    name = "ScanditCaptureCoreNative",
    permissions = {
      @Permission(
          strings = {Manifest.permission.CAMERA},
          alias = "camera")
    })
public class ScanditCaptureCoreNative extends Plugin implements Emitter {

  private static final List<String> SCANDIT_PLUGINS =
      Arrays.asList(
          "ScanditBarcodeNative", "ScanditParserNative", "ScanditIdNative", "ScanditTextNative");

  private final ActivityLifecycleDispatcher lifecycleDispatcher;
  private final DataCaptureViewHandler captureViewHandler;
  private final CoreModule coreModule;
  private final List<Plugin> plugins;
  private FrameSourceState lastFrameSourceState;

  public ScanditCaptureCoreNative() {
    this.lifecycleDispatcher = DefaultActivityLifecycle.Companion.getInstance();
    this.captureViewHandler = new DataCaptureViewHandler();
    this.coreModule = CoreModule.create(this);
    this.lastFrameSourceState = FrameSourceState.OFF;
    this.plugins = new ArrayList<>();

    DefaultServiceLocator.getInstance().register(coreModule);
  }

  public void registerPluginInstance(Plugin instance) {
    plugins.add(instance);
  }

  @Override
  public void load() {
    super.load();

    List<String> registeredPlugins = new ArrayList<>();
    for (Plugin plugin : plugins) {
      registeredPlugins.add(plugin.getPluginHandle().getId());
    }

    for (String pluginName : SCANDIT_PLUGINS) {
      if (!registeredPlugins.contains(pluginName)) {
        com.getcapacitor.PluginHandle unregisteredPlugin = getBridge().getPlugin(pluginName);

        if (unregisteredPlugin != null) {
          registerPluginInstance(unregisteredPlugin.getInstance());
        } else {
          Log.e("Registering:", pluginName + " not found");
        }
      }
    }
    coreModule.onCreate(getContext());
  }

  @Override
  protected void handleOnStart() {
    if (checkCameraPermission()) {
      coreModule.switchToDesiredCameraState(lastFrameSourceState);
    }
    coreModule.subscribeContextListener(new NoopFrameworksResult());
    coreModule.registerTopmostDataCaptureViewListener();
    coreModule.registerFrameSourceListener(new NoopFrameworksResult());
    lifecycleDispatcher.dispatchOnStart();
  }

  @Override
  protected void handleOnStop() {
    lifecycleDispatcher.dispatchOnStop();
    FrameSourceState currentState = coreModule.getCurrentCameraDesiredState();
    lastFrameSourceState = currentState != null ? currentState : FrameSourceState.OFF;
    coreModule.switchToDesiredCameraState(FrameSourceState.OFF);
    coreModule.unsubscribeContextListener(new NoopFrameworksResult());
    coreModule.unregisterTopmostDataCaptureViewListener();
    coreModule.unregisterFrameSourceListener(new NoopFrameworksResult());
  }

  @Override
  protected void handleOnDestroy() {
    lifecycleDispatcher.dispatchOnDestroy();
    coreModule.onDestroy();
    captureViewHandler.disposeCurrentWebView();
  }

  @Override
  protected void handleOnResume() {
    lifecycleDispatcher.dispatchOnResume();
  }

  @Override
  protected void handleOnPause() {
    lifecycleDispatcher.dispatchOnPause();
  }

  private boolean checkCameraPermission() {
    return getPermissionState("camera") == PermissionState.GRANTED;
  }

  private void checkOrRequestCameraPermissions(PluginCall call) {
    if (!checkCameraPermission()) {
      requestPermissionForAlias("camera", call, "onCameraPermissionResult");
    } else {
      onCameraPermissionResult(call);
    }
  }

  @SuppressWarnings("unused")
  @PermissionCallback
  private void onCameraPermissionResult(PluginCall call) {
    if (checkCameraPermission()) {
      coreModule.switchToDesiredCameraState(lastFrameSourceState);
      call.resolve();
      return;
    }

    call.reject("Camera permissions not granted.");
  }

  // region DataCaptureViewProxy
  @PluginMethod
  public void setDataCaptureViewPositionAndSize(PluginCall call) {
    try {
      double top = call.getData().getDouble("top");
      double left = call.getData().getDouble("left");
      double width = call.getData().getDouble("width");
      double height = call.getData().getDouble("height");
      boolean shouldBeUnderWebView = call.getData().getBoolean("shouldBeUnderWebView");

      captureViewHandler.setResizeAndMoveInfo(
          new ResizeAndMoveInfo(
              (float) top, (float) left, (float) width, (float) height, shouldBeUnderWebView));
      call.resolve();
    } catch (JSONException e) {
      call.reject(new JsonParseError(e.getMessage()).toString());
    }
  }

  @PluginMethod
  public void showDataCaptureView(PluginCall call) {
    captureViewHandler.setVisible();
    call.resolve();
  }

  @PluginMethod
  public void hideDataCaptureView(PluginCall call) {
    captureViewHandler.setInvisible();
    call.resolve();
  }

  // endregion

  @PluginMethod
  public void getDefaults(PluginCall call) {
    try {
      Map<String, Object> defaults = coreModule.getDefaults();
      call.resolve(JSObject.fromJSONObject(new JSONObject(defaults)));
    } catch (JSONException e) {
      call.reject("Failed to get defaults: " + e.getMessage());
    }
  }

  @PluginMethod
  public void subscribeVolumeButtonObserver(PluginCall call) {
    call.resolve();
  }

  @PluginMethod
  public void unsubscribeVolumeButtonObserver(PluginCall call) {
    call.resolve();
  }

  @PluginMethod
  public void createDataCaptureView(PluginCall call) {
    String viewJson = call.getData().getString("viewJson");
    if (viewJson == null) {
      call.reject(new ParameterNullError("viewJson").getMessage());
      return;
    }

    DataCaptureView view = coreModule.createDataCaptureView(viewJson, new CapacitorResult(call));
    if (view != null) {
      DataCaptureView existingView = captureViewHandler.getDataCaptureView();
      if (existingView != null) {
        // Remove existing view and add the new one.
        coreModule.dataCaptureViewDisposed(existingView);
        captureViewHandler.removeDataCaptureView(existingView);
      }

      captureViewHandler.addDataCaptureView(view, getBridge());
    }
  }

  @PluginMethod
  public void removeDataCaptureView(PluginCall call) {
    try {
      int viewId = call.getData().getInt("viewId");
      // In capacitor we just show 1 datacapture view at a time
      DataCaptureView dcViewToRemove = coreModule.getDataCaptureViewById(viewId);
      if (dcViewToRemove != null) {
        dcViewToRemove.post(
            () -> {
              coreModule.dataCaptureViewDisposed(dcViewToRemove);
              captureViewHandler.removeDataCaptureView(dcViewToRemove);
            });
      }
      call.resolve();
    } catch (JSONException e) {
      call.reject("Failed to remove view: " + e.getMessage());
    }
  }

  @Override
  public void emit(@NotNull String eventName, @NotNull Map<String, Object> payload) {
    JSObject capacitorPayload = new JSObject();
    capacitorPayload.put("name", eventName);
    capacitorPayload.put("data", new JSONObject(payload).toString());

    notifyListeners(eventName, capacitorPayload);
  }

  @Override
  public boolean hasListenersForEvent(@NonNull String eventName) {
    return this.hasListeners(eventName);
  }

  @Override
  public boolean hasViewSpecificListenersForEvent(int viewId, @NonNull String eventName) {
    return this.hasListenersForEvent(eventName);
  }

  @Override
  public boolean hasModeSpecificListenersForEvent(int modeId, @NonNull String eventName) {
    return this.hasListenersForEvent(eventName);
  }

  /**
   * Single entry point for all Core operations. Routes method calls to the appropriate command via
   * the shared command factory.
   */
  @PluginMethod
  public void executeCore(PluginCall call) {
    String methodName = call.getData().getString("methodName");

    // Special handling for switchCameraToDesiredState: check camera permissions
    if ("switchCameraToDesiredState".equals(methodName)) {
      handleSwitchCameraToDesiredState(call);
      return;
    }

    boolean handled =
        coreModule.execute(new CapacitorMethodCall(call), new CapacitorResult(call), coreModule);
    if (!handled) {
      call.reject("Unknown Core method: " + (methodName != null ? methodName : "unknown"));
    }
  }

  private void handleSwitchCameraToDesiredState(PluginCall call) {
    String stateJson = call.getData().getString("stateJson");
    if (stateJson == null) {
      call.reject(new ParameterNullError("stateJson").getMessage());
      return;
    }

    if (checkCameraPermission()) {
      coreModule.execute(new CapacitorMethodCall(call), new CapacitorResult(call), coreModule);
      FrameSourceState currentState = coreModule.getCurrentCameraDesiredState();
      lastFrameSourceState = currentState != null ? currentState : FrameSourceState.OFF;
      return;
    }

    lastFrameSourceState = FrameSourceStateDeserializer.fromJson(stateJson);
    checkOrRequestCameraPermissions(call);
  }
}
