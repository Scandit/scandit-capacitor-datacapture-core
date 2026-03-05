/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.capacitor.datacapture.core.data;

public class ResizeAndMoveInfo {
  private final float top;
  private final float left;
  private final float width;
  private final float height;
  private final boolean shouldBeUnderWebView;

  public ResizeAndMoveInfo(
      float top, float left, float width, float height, boolean shouldBeUnderWebView) {
    this.top = top;
    this.left = left;
    this.width = width;
    this.height = height;
    this.shouldBeUnderWebView = shouldBeUnderWebView;
  }

  public float getTop() {
    return top;
  }

  public float getLeft() {
    return left;
  }

  public float getWidth() {
    return width;
  }

  public float getHeight() {
    return height;
  }

  public boolean getShouldBeUnderWebView() {
    return shouldBeUnderWebView;
  }
}
