/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.capacitor.datacapture.core.utils;

import java.util.concurrent.atomic.AtomicBoolean;

// Used as a base class for all the callback. Suppressed the warning because import
// doesn't contain any abstract members but we keep it abstract to avoid someone
// creating an instance of the class.
public abstract class Callback {

  protected final AtomicBoolean disposed = new AtomicBoolean(false);

  public void dispose() {
    disposed.set(true);
  }
}
