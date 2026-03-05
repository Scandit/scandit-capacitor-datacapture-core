/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.capacitor.datacapture.core.handlers;

import static com.scandit.capacitor.datacapture.core.utils.CapacitorExtensions.*;

import android.annotation.SuppressLint;
import android.graphics.Color;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import com.getcapacitor.Bridge;
import com.scandit.capacitor.datacapture.core.data.ResizeAndMoveInfo;
import com.scandit.datacapture.core.ui.DataCaptureView;
import com.scandit.datacapture.frameworks.core.utils.DefaultFrameworksLog;
import com.scandit.datacapture.frameworks.core.utils.FrameworksLog;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class DataCaptureViewHandler {

  private static final long TOUCH_EVALUATION_TIMEOUT_MS = 20L;
  private static final int MAX_PENDING_TOUCH_EVENTS = 40;

  private final FrameworksLog logger;
  private ResizeAndMoveInfo latestInfo;
  private boolean isVisible;
  private WeakReference<DataCaptureView> dataCaptureViewReference;
  private WeakReference<View> webViewReference;
  private View.OnTouchListener webViewTouchForwarder;
  private final List<MotionEvent> pendingTouchEvents;
  private boolean shouldForwardTouchEvents;
  private boolean isEvaluatingTouchTarget;
  private int currentTouchEvaluationToken;
  private final Handler evaluationTimeoutHandler;
  private Runnable evaluationTimeoutRunnable;
  private long evaluationStartElapsedMs;

  public DataCaptureViewHandler() {
    this(DefaultFrameworksLog.getInstance());
  }

  public DataCaptureViewHandler(FrameworksLog logger) {
    this.logger = logger;
    this.latestInfo = new ResizeAndMoveInfo(0f, 0f, 0f, 0f, false);
    this.isVisible = false;
    this.dataCaptureViewReference = new WeakReference<>(null);
    this.webViewReference = new WeakReference<>(null);
    this.webViewTouchForwarder = null;
    this.pendingTouchEvents = new ArrayList<>();
    this.shouldForwardTouchEvents = false;
    this.isEvaluatingTouchTarget = false;
    this.currentTouchEvaluationToken = 0;
    this.evaluationTimeoutHandler = new Handler(Looper.getMainLooper());
    this.evaluationTimeoutRunnable = null;
    this.evaluationStartElapsedMs = 0L;
  }

  private View getWebView() {
    return webViewReference.get();
  }

  public DataCaptureView getDataCaptureView() {
    return dataCaptureViewReference.get();
  }

  public void setVisible() {
    isVisible = true;
    render();
  }

  public void setInvisible() {
    isVisible = false;
    render();
  }

  public void setResizeAndMoveInfo(ResizeAndMoveInfo info) {
    latestInfo = info;
    render();
  }

  public void disposeCurrentWebView() {
    clearWebViewTouchForwarder();
    webViewReference = new WeakReference<>(null);
  }

  @SuppressLint("ClickableViewAccessibility")
  public void addDataCaptureView(DataCaptureView dataCaptureView, Bridge bridge) {
    dataCaptureViewReference = new WeakReference<>(dataCaptureView);

    bridge.executeOnMainThread(
        new Runnable() {
          @Override
          public void run() {
            FrameLayout dcContainer = new FrameLayout(bridge.getContext());
            dcContainer.setMinimumHeight(bridge.getWebView().getHeight());
            dcContainer.setMinimumWidth(bridge.getWebView().getWidth());
            dcContainer.setBackgroundColor(Color.TRANSPARENT);

            // Add DataCaptureView to the container
            dcContainer.addView(dataCaptureView);

            ViewGroup parent = (ViewGroup) bridge.getWebView().getParent();
            ViewGroup.LayoutParams layoutParams =
                new ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
            // Add container to the same parent of the WebView
            parent.addView(dcContainer, layoutParams);

            // create touch listener
            View.OnTouchListener touchForwarder =
                new View.OnTouchListener() {
                  @Override
                  public boolean onTouch(View v, MotionEvent event) {
                    switch (event.getActionMasked()) {
                      case MotionEvent.ACTION_DOWN:
                        handleActionDown(event, bridge, dcContainer);
                        break;
                      case MotionEvent.ACTION_UP:
                      case MotionEvent.ACTION_CANCEL:
                        handleActionUp(event, dcContainer);
                        break;
                      default:
                        handleOtherActions(event, dcContainer);
                        break;
                    }
                    return false;
                  }
                };

            bridge.getWebView().setOnTouchListener(touchForwarder);
            webViewTouchForwarder = touchForwarder;

            bridge.getWebView().bringToFront();
            bridge.getWebView().setBackgroundColor(Color.TRANSPARENT);

            webViewReference = new WeakReference<>(bridge.getWebView());
          }
        });
  }

  private void handleActionUp(MotionEvent event, FrameLayout dcViewParent) {
    handleOtherActions(event, dcViewParent);

    if (!isEvaluatingTouchTarget) {
      resetTouchForwardingState();
    }
  }

  private void handleOtherActions(MotionEvent event, FrameLayout dcViewParent) {
    if (isEvaluatingTouchTarget) {
      addPendingTouchEvent(event);
    } else if (shouldForwardTouchEvents) {
      forwardEventToDataCaptureView(dcViewParent, event);
    }
  }

  private void handleActionDown(MotionEvent event, Bridge bridge, FrameLayout dcViewParent) {
    currentTouchEvaluationToken += 1;
    int evaluationToken = currentTouchEvaluationToken;
    shouldForwardTouchEvents = false;
    isEvaluatingTouchTarget = true;
    evaluationStartElapsedMs = SystemClock.elapsedRealtime();
    clearPendingTouchEvents();
    addPendingTouchEvent(event);
    evaluateTouchTarget(event, bridge, evaluationToken, dcViewParent);
  }

  public void removeDataCaptureView(DataCaptureView dataCaptureView) {
    if (getDataCaptureView() == dataCaptureView) {
      dataCaptureViewReference = new WeakReference<>(null);
    }
    clearWebViewTouchForwarder();
    removeView(dataCaptureView);
  }

  private void removeView(View view) {
    view.post(
        new Runnable() {
          @Override
          public void run() {
            removeFromParent(view);
          }
        });
  }

  // Update the view visibility, position and size.
  private void render() {
    DataCaptureView view = getDataCaptureView();
    if (view == null) {
      return;
    }
    FrameLayout dcViewParent = (FrameLayout) view.getParent();

    view.post(
        new Runnable() {
          @Override
          public void run() {
            view.setVisibility(isVisible ? View.VISIBLE : View.GONE);
            view.setX(pxFromDp(latestInfo.getLeft()));
            view.setY(pxFromDp(latestInfo.getTop()));
            ViewGroup.LayoutParams params = view.getLayoutParams();
            params.width = (int) pxFromDp(latestInfo.getWidth());
            params.height = (int) pxFromDp(latestInfo.getHeight());

            View webView = getWebView();
            if (latestInfo.getShouldBeUnderWebView()) {
              if (webView != null) {
                webView.bringToFront();
                webView.setTranslationZ(2F);
              }
              if (dcViewParent != null) {
                dcViewParent.setTranslationZ(1F);
              }
            } else {
              if (dcViewParent != null) {
                dcViewParent.bringToFront();
                dcViewParent.setTranslationZ(2F);
              }
              if (webView != null) {
                webView.setTranslationZ(1F);
              }
            }

            view.requestLayout();
          }
        });
  }

  private void evaluateTouchTarget(
      MotionEvent event, Bridge bridge, int evaluationToken, FrameLayout dcViewParent) {
    String rawX = formatCoordinate(event.getX());
    String rawY = formatCoordinate(event.getY());
    String webViewScale = formatCoordinate(1f);

    String js =
        "(function() {\n"
            + "    var rawX = "
            + rawX
            + ";\n"
            + "    var rawY = "
            + rawY
            + ";\n"
            + "    var webViewScale = "
            + webViewScale
            + ";\n"
            + "    var dpr = window.devicePixelRatio || 1;\n"
            + "    var viewportScale = (window.visualViewport && window.visualViewport.scale) ? window.visualViewport.scale : 1;\n"
            + "\n"
            + "    var cssX = rawX / (dpr * viewportScale / webViewScale);\n"
            + "    var cssY = rawY / (dpr * viewportScale / webViewScale);\n"
            + "\n"
            + "    var container = document.querySelector('.data-capture-view');\n"
            + "    if (!container) { return true; }\n"
            + "\n"
            + "    var rect = container.getBoundingClientRect();\n"
            + "    var x = cssX;\n"
            + "    var y = cssY;\n"
            + "\n"
            + "    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {\n"
            + "        return true;\n"
            + "    }\n"
            + "\n"
            + "    var el = document.elementFromPoint(x, y);\n"
            + "    if (!el) { return true; }\n"
            + "    \n"
            + "    if (el.classList.contains('data-capture-view') || el.closest('.data-capture-view') === container) {\n"
            + "        return false;\n"
            + "    }\n"
            + "\n"
            + "    return true;\n"
            + "})();";

    scheduleEvaluationTimeout(evaluationToken, dcViewParent);

    try {
      bridge
          .getWebView()
          .evaluateJavascript(
              js,
              new android.webkit.ValueCallback<String>() {
                @Override
                public void onReceiveValue(String value) {
                  if (evaluationToken != currentTouchEvaluationToken) {
                    return;
                  }

                  long durationMs = SystemClock.elapsedRealtime() - evaluationStartElapsedMs;
                  if (durationMs > TOUCH_EVALUATION_TIMEOUT_MS) {
                    logger.info("Touch evaluation resolved in " + durationMs + "ms");
                  }

                  boolean shouldForward = parseShouldForwardValue(value);
                  handleTouchEvaluationResult(shouldForward, dcViewParent);
                }
              });
    } catch (Exception e) {
      if (evaluationToken == currentTouchEvaluationToken) {
        logger.error("Touch evaluation failed", e);
        handleTouchEvaluationResult(false, dcViewParent);
      }
    }
  }

  private void handleTouchEvaluationResult(boolean shouldForward, FrameLayout dcViewParent) {
    isEvaluatingTouchTarget = false;
    shouldForwardTouchEvents = shouldForward;
    cancelEvaluationTimeout();

    if (shouldForward) {
      for (MotionEvent event : pendingTouchEvents) {
        dcViewParent.dispatchTouchEvent(event);
        event.recycle();
      }
    } else {
      for (MotionEvent event : pendingTouchEvents) {
        event.recycle();
      }
    }

    pendingTouchEvents.clear();
  }

  private void forwardEventToDataCaptureView(FrameLayout dcViewParent, MotionEvent event) {
    MotionEvent eventCopy = MotionEvent.obtain(event);
    dcViewParent.dispatchTouchEvent(eventCopy);
    eventCopy.recycle();
  }

  private void clearPendingTouchEvents() {
    for (MotionEvent event : pendingTouchEvents) {
      event.recycle();
    }
    pendingTouchEvents.clear();
  }

  private void addPendingTouchEvent(MotionEvent event) {
    if (pendingTouchEvents.size() >= MAX_PENDING_TOUCH_EVENTS) {
      MotionEvent oldest = pendingTouchEvents.remove(0);
      oldest.recycle();
    }

    pendingTouchEvents.add(MotionEvent.obtain(event));
  }

  private void resetTouchForwardingState() {
    shouldForwardTouchEvents = false;
    isEvaluatingTouchTarget = false;
    clearPendingTouchEvents();
    currentTouchEvaluationToken += 1;
    cancelEvaluationTimeout();
  }

  private void clearWebViewTouchForwarder() {
    View webView = webViewReference.get();
    if (webView != null) {
      webView.setOnTouchListener(null);
    }
    webViewTouchForwarder = null;
    resetTouchForwardingState();
  }

  private void scheduleEvaluationTimeout(int evaluationToken, FrameLayout dcViewParent) {
    cancelEvaluationTimeout();

    Runnable runnable =
        new Runnable() {
          @Override
          public void run() {
            if (evaluationToken != currentTouchEvaluationToken || !isEvaluatingTouchTarget) {
              return;
            }

            logger.info("Touch evaluation timed out after " + TOUCH_EVALUATION_TIMEOUT_MS + "ms");
            handleTouchEvaluationResult(false, dcViewParent);
          }
        };

    evaluationTimeoutRunnable = runnable;
    evaluationTimeoutHandler.postDelayed(runnable, TOUCH_EVALUATION_TIMEOUT_MS);
  }

  private void cancelEvaluationTimeout() {
    if (evaluationTimeoutRunnable != null) {
      evaluationTimeoutHandler.removeCallbacks(evaluationTimeoutRunnable);
    }
    evaluationTimeoutRunnable = null;
  }

  private boolean parseShouldForwardValue(String value) {
    String normalized =
        value != null ? value.trim().replace("\"", "").toLowerCase(Locale.US) : null;
    if (normalized == null) {
      logger.error("Touch evaluation returned null result");
      return false;
    }

    switch (normalized) {
      case "true":
        return false;
      case "false":
        return true;
      default:
        logger.error("Touch evaluation returned unexpected value: " + normalized);
        return false;
    }
  }

  private String formatCoordinate(float value) {
    return String.format(Locale.US, "%.4f", value);
  }
}
