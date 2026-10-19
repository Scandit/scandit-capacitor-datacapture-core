package com.scandit.capacitor.datacapture.core.utils;

import androidx.annotation.NonNull;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import com.scandit.datacapture.frameworks.core.result.FrameworksResult;
import java.util.Map;
import org.json.JSONObject;

public class CapacitorResult implements FrameworksResult {

  private final PluginCall call;

  public CapacitorResult(PluginCall call) {
    this.call = call;
  }

  @Override
  public void success(Object result) {
    if (result == null) {
      call.resolve();
      return;
    }

    String resultData;
    if (result instanceof Map) {
      resultData = new JSONObject((Map<?, ?>) result).toString();
    } else {
      resultData = result.toString();
    }

    JSObject capacitorPayload = new JSObject();
    capacitorPayload.put("data", resultData);

    call.resolve(capacitorPayload);
  }

  @Override
  public void error(@NonNull String errorCode, String errorMessage, Object errorDetails) {
    call.reject(errorMessage, errorMessage);
  }

  @Override
  public void unregisterViewSpecificCallback(
      int viewId, @NonNull java.util.List<String> eventNames) {
    // noop for Capacitor
  }

  @Override
  public void registerViewSpecificCallback(int viewId, @NonNull java.util.List<String> eventNames) {
    // noop for Capacitor
  }

  @Override
  public void registerModeSpecificCallback(int modeId, @NonNull java.util.List<String> eventNames) {
    // noop for Capacitor
  }

  @Override
  public void unregisterModeSpecificCallback(
      int modeId, @NonNull java.util.List<String> eventNames) {
    // noop for Capacitor
  }

  @Override
  public void registerCallbackForEvents(@NonNull java.util.List<String> eventNames) {
    // noop for Capacitor
  }

  @Override
  public void unregisterCallbackForEvents(@NonNull java.util.List<String> eventNames) {
    // noop for Capacitor
  }

  @Override
  public void successAndKeepCallback(Object result) {
    success(result);
  }
}

class CapacitorNoopResult implements FrameworksResult {

  @Override
  public void success(Object result) {
    // noop
  }

  @Override
  public void error(@NonNull String errorCode, String errorMessage, Object errorDetails) {
    // noop
  }

  @Override
  public void unregisterViewSpecificCallback(
      int viewId, @NonNull java.util.List<String> eventNames) {
    // noop
  }

  @Override
  public void registerViewSpecificCallback(int viewId, @NonNull java.util.List<String> eventNames) {
    // noop
  }

  @Override
  public void registerModeSpecificCallback(int modeId, @NonNull java.util.List<String> eventNames) {
    // noop
  }

  @Override
  public void unregisterModeSpecificCallback(
      int modeId, @NonNull java.util.List<String> eventNames) {
    // noop
  }

  @Override
  public void registerCallbackForEvents(@NonNull java.util.List<String> eventNames) {
    // noop
  }

  @Override
  public void unregisterCallbackForEvents(@NonNull java.util.List<String> eventNames) {
    // noop
  }

  @Override
  public void successAndKeepCallback(Object result) {
    // noop
  }
}
