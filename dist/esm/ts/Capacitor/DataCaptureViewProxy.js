import { Point, Quadrilateral, Size, } from '../Common';
import { Capacitor, CapacitorFunction } from './Capacitor';
var DataCaptureViewListenerEvent;
(function (DataCaptureViewListenerEvent) {
    DataCaptureViewListenerEvent["DidChangeSizeOrientation"] = "DataCaptureViewListener.onSizeChanged";
})(DataCaptureViewListenerEvent || (DataCaptureViewListenerEvent = {}));
export class DataCaptureViewProxy {
    static forDataCaptureView(view) {
        const viewProxy = new DataCaptureViewProxy();
        viewProxy.view = view;
        viewProxy.initialize();
        return viewProxy;
    }
    setPositionAndSize(top, left, width, height, shouldBeUnderWebView) {
        return new Promise((resolve, reject) => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.SetViewPositionAndSize]({
            position: { top, left, width, height, shouldBeUnderWebView },
        }).then(resolve.bind(this), reject.bind(this)));
    }
    show() {
        return window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.ShowView]();
    }
    hide() {
        return window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.HideView]();
    }
    viewPointForFramePoint(point) {
        return new Promise((resolve, reject) => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.ViewPointForFramePoint]({
            point: point.toJSON(),
        }).then((result) => resolve(Point.fromJSON(JSON.parse(result.data))), reject.bind(this)));
    }
    viewQuadrilateralForFrameQuadrilateral(quadrilateral) {
        return new Promise((resolve, reject) => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.ViewQuadrilateralForFrameQuadrilateral]({
            point: quadrilateral.toJSON(),
        }).then((result) => {
            const quadrilateral = Quadrilateral
                .fromJSON(JSON.parse(result.data));
            resolve(quadrilateral);
        }, reject.bind(this)));
    }
    subscribeListener() {
        window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.SubscribeViewListener]();
    }
    unregisterListenerForViewEvents() {
        window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.UnsubscribeViewListener]();
    }
    subscribeDidChangeSize() {
        window.Capacitor.Plugins[Capacitor.pluginName]
            .addListener(DataCaptureViewListenerEvent.DidChangeSizeOrientation, this.notifyListeners.bind(this));
    }
    notifyListeners(event) {
        if (!event) {
            // The event could be undefined/null in case the plugin result did not pass a "message",
            // which could happen e.g. in case of "ok" results, which could signal e.g. successful
            // listener subscriptions.
            return;
        }
        event = Object.assign(Object.assign(Object.assign({}, event), event.argument), { argument: undefined });
        this.view.listeners.forEach((listener) => {
            switch (event.name) {
                case DataCaptureViewListenerEvent.DidChangeSizeOrientation:
                    if (listener.didChangeSize) {
                        const size = Size.fromJSON(event.size);
                        const orientation = event.orientation;
                        listener.didChangeSize(this.view, size, orientation);
                    }
                    break;
            }
        });
    }
    initialize() {
        this.subscribeListener();
    }
}
//# sourceMappingURL=DataCaptureViewProxy.js.map