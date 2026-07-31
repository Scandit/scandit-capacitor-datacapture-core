/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.capacitor.datacapture.core.errors;

public class JsonParseError extends ActionError {

  private static final int ERROR_CODE = 10001;

  public JsonParseError(String error) {
    super(
        ERROR_CODE,
        "Invalid or no JSON passed for command: " + (error != null ? error : "No additional info"));
  }
}
