/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.capacitor.datacapture.core.errors;

import java.util.HashMap;
import java.util.Map;
import org.json.JSONObject;

public abstract class ActionError extends Exception {

  private static final String KEY_CODE = "Code";
  private static final String KEY_MESSAGE = "Message";

  private final int errorCode;
  private final String errorMessage;

  public ActionError(int errorCode, String errorMessage) {
    super(errorMessage);
    this.errorCode = errorCode;
    this.errorMessage = errorMessage;
  }

  public JSONObject serializeContent() {
    Map<String, Object> data = new HashMap<>();
    data.put(KEY_CODE, errorCode);
    data.put(KEY_MESSAGE, errorMessage);
    return new JSONObject(data);
  }
}
