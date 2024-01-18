import { VolumeButtonObserverProxy } from './Capacitor/VolumeButtonObserverProxy';
export class VolumeButtonObserver {
    constructor(didChangeVolume) {
        this.didChangeVolume = didChangeVolume;
        this.initialize();
    }
    dispose() {
        if (this.proxy) {
            this.proxy.dispose();
            this.proxy = null;
            this.didChangeVolume = null;
        }
    }
    initialize() {
        if (!this.proxy) {
            this.proxy = VolumeButtonObserverProxy.forVolumeButtonObserver(this);
        }
    }
}
//# sourceMappingURL=VolumeButtonObserver.js.map