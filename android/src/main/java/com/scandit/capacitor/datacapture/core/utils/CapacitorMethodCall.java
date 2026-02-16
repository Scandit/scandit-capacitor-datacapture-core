package com.scandit.capacitor.datacapture.core.utils;

import androidx.annotation.NonNull;
import com.getcapacitor.PluginCall;
import com.scandit.datacapture.frameworks.core.method.FrameworksMethodCall;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import org.json.JSONObject;

public class CapacitorMethodCall implements FrameworksMethodCall {

  private final PluginCall call;

  public CapacitorMethodCall(PluginCall call) {
    this.call = call;
  }

  @NonNull
  @Override
  public String getMethod() {
    String methodName = call.getData().getString("methodName");
    return methodName != null ? methodName : "unknown";
  }

  @Override
  @SuppressWarnings("unchecked")
  public <T> T argument(@NonNull String key) {
    // Check if key exists and is explicitly null
    if (!call.getData().has(key) || call.getData().isNull(key)) {
      return null;
    }

    return (T) call.getData().opt(key);
  }

  @Override
  public boolean hasArgument(@NonNull String key) {
    return call.getData().has(key);
  }

  @NonNull
  @Override
  public Map<String, Object> arguments() {
    return jsonObjectToMap(call.getData());
  }

  private Map<String, Object> jsonObjectToMap(JSONObject json) {
    Map<String, Object> map = new HashMap<>();
    Iterator<String> keys = json.keys();
    while (keys.hasNext()) {
      String key = keys.next();
      map.put(key, json.opt(key));
    }
    return map;
  }
}
