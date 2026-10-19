/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.capacitor.datacapture.core.utils;

import android.view.View;
import android.view.ViewGroup;
import com.scandit.datacapture.core.internal.sdk.AppAndroidEnvironment;

public final class CapacitorExtensions {

  private CapacitorExtensions() {
    // Private constructor to prevent instantiation
  }

  public static float pxFromDp(float dp) {
    android.content.Context context = AppAndroidEnvironment.INSTANCE.getApplicationContext();
    float displayDensity = context.getResources().getDisplayMetrics().density;
    return (dp * displayDensity + 0.5f);
  }

  public static void removeFromParent(View view) {
    if (view.getParent() instanceof ViewGroup) {
      ViewGroup parent = (ViewGroup) view.getParent();
      parent.removeView(view);
    }
  }
}
