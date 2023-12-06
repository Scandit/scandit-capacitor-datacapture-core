import { ContextStatus } from '../DataCaptureContext+Related';
import { Capacitor, CapacitorFunction } from './Capacitor';
import { doReturnWithFinish } from './CommonCapacitor';
var DataCaptureContextListenerEvent;
(function (DataCaptureContextListenerEvent) {
    DataCaptureContextListenerEvent["DidChangeContextStatus"] = "didChangeStatus";
    DataCaptureContextListenerEvent["DidStartObservingContext"] = "didStartObservingContext";
})(DataCaptureContextListenerEvent || (DataCaptureContextListenerEvent = {}));
// TODO: adjust when readding framedata to the api https://jira.scandit.com/browse/SDC-1159
// enum DataCaptureContextFrameListenerEvent {
//   WillProcessFrame = 'willProcessFrame',
//   DidProcessFrame = 'didProcessFrame',
// }
export class DataCaptureContextProxy {
    static forDataCaptureContext(context) {
        const contextProxy = new DataCaptureContextProxy();
        contextProxy.context = context;
        contextProxy.initialize();
        return contextProxy;
    }
    updateContextFromJSON() {
        return new Promise((resolve, reject) => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.UpdateContextFromJSON]({
            context: JSON.stringify(this.context.toJSON()),
        }).then(resolve.bind(this), reject.bind(this)));
    }
    dispose() {
        window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.DisposeContext]();
    }
    initialize() {
        this.subscribeListener();
        // TODO: adjust when readding framedata to the api https://jira.scandit.com/browse/SDC-1159
        // this.subscribeFrameListener();
        this.initializeContextFromJSON();
    }
    initializeContextFromJSON() {
        return new Promise((resolve, reject) => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.ContextFromJSON]({
            context: JSON.stringify(this.context.toJSON()),
        }).then(resolve.bind(this), reject.bind(this)));
    }
    subscribeListener() {
        window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.SubscribeContextListener]();
        window.Capacitor.Plugins[Capacitor.pluginName]
            .addListener(DataCaptureContextListenerEvent.DidChangeContextStatus, this.notifyListeners.bind(this));
        window.Capacitor.Plugins[Capacitor.pluginName]
            .addListener(DataCaptureContextListenerEvent.DidStartObservingContext, this.notifyListeners.bind(this));
    }
    // TODO: adjust when readding framedata to the api https://jira.scandit.com/browse/SDC-1159
    // private subscribeFrameListener() {
    //     window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.SubscribeContextFrameListener]()
    //     .then(this.notifyFrameListeners.bind(this), null)
    // }
    notifyListeners(event) {
        if (!event) {
            // The event could be undefined/null in case the plugin result did not pass a "message",
            // which could happen e.g. in case of "ok" results, which could signal e.g. successful
            // listener subscriptions.
            return doReturnWithFinish('', null);
        }
        event = Object.assign(Object.assign(Object.assign({}, event), event.argument), { argument: undefined });
        this.context.listeners.forEach((listener) => {
            switch (event.name) {
                case DataCaptureContextListenerEvent.DidChangeContextStatus:
                    if (listener.didChangeStatus) {
                        const contextStatus = ContextStatus.fromJSON(event.context);
                        listener.didChangeStatus(this.context, contextStatus);
                    }
                    break;
                case DataCaptureContextListenerEvent.DidStartObservingContext:
                    if (listener.didStartObservingContext) {
                        listener.didStartObservingContext(this.context);
                    }
                    break;
            }
        });
        return doReturnWithFinish(event.name, null);
    }
}
//# sourceMappingURL=DataCaptureContextProxy.js.map