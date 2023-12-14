import { Capacitor } from './Capacitor';
import { doReturnWithFinish } from './CommonCapacitor';
var VolumeButtonObserverEvent;
(function (VolumeButtonObserverEvent) {
    VolumeButtonObserverEvent["DidChangeVolume"] = "didChangeVolume";
})(VolumeButtonObserverEvent || (VolumeButtonObserverEvent = {}));
export class VolumeButtonObserverProxy {
    static forVolumeButtonObserver(volumeButtonObserver) {
        const proxy = new VolumeButtonObserverProxy();
        proxy.volumeButtonObserver = volumeButtonObserver;
        proxy.subscribe();
        return proxy;
    }
    dispose() {
        this.unsubscribe();
    }
    subscribe() {
        this.subscriber = window.Capacitor.Plugins[Capacitor.pluginName]
            .addListener(VolumeButtonObserverEvent.DidChangeVolume, this.notifyListeners.bind(this));
    }
    unsubscribe() {
        this.subscriber.remove();
    }
    notifyListeners(event) {
        if (!event) {
            // The event could be undefined/null in case the plugin result did not pass a "message",
            // which could happen e.g. in case of "ok" results, which could signal e.g. successful
            // listener subscriptions.
            return doReturnWithFinish('', null);
        }
        if (this.volumeButtonObserver.didChangeVolume && event.name === VolumeButtonObserverEvent.DidChangeVolume) {
            this.volumeButtonObserver.didChangeVolume();
            return doReturnWithFinish(event.name, null);
        }
    }
}
//# sourceMappingURL=VolumeButtonObserverProxy.js.map