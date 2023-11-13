/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2023- Scandit AG. All rights reserved.
 */

#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(ScanditCaptureCore, "ScanditCaptureCoreNative",
           CAP_PLUGIN_METHOD(contextFromJSON, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(updateContextFromJSON, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(subscribeContextListener, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(subscribeContextFrameListener, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(subscribeViewListener, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(subscribeVolumeButtonObserver, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(unsubscribeVolumeButtonObserver, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(disposeContext, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(setViewPositionAndSize, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(showView, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(hideView, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(viewPointForFramePoint, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(viewQuadrilateralForFrameQuadrilateral, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getCurrentCameraState, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getIsTorchAvailable, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getDefaults, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getLastFrame, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getLastFrameOrNull, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(emitFeedback, CAPPluginReturnPromise);)
