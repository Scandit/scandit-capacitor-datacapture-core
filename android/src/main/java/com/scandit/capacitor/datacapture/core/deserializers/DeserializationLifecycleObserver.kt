package com.scandit.capacitor.datacapture.core.deserializers

import com.scandit.datacapture.core.capture.DataCaptureContext

object DeserializationLifecycleObserver {
    private val observers = mutableListOf<Observer>()

    fun attach(observer: Observer) {
        observers.add(observer)
    }

    fun detach(observer: Observer) {
        observers.remove(observer)
    }

    internal fun dispatchParsersRemoved() {
        for (observer in observers) {
            observer.onParsersRemoved()
        }
    }

    internal fun dispatchDataCaptureContextDeserialized(dataCaptureContext: DataCaptureContext) {
        for (observer in observers) {
            observer.onDataCaptureContextDeserialized(dataCaptureContext)
        }
    }

    interface Observer {
        fun onParsersRemoved() {}
        fun onDataCaptureContextDeserialized(dataCaptureContext: DataCaptureContext) {}
    }
}
