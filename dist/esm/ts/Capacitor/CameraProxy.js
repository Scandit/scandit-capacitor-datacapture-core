import { PrivateFrameData } from '../Camera+Related';
import { Capacitor, CapacitorFunction } from './Capacitor';
export class CameraProxy {
    static forCamera(camera) {
        const proxy = new CameraProxy();
        proxy.camera = camera;
        return proxy;
    }
    static getLastFrame() {
        return new Promise(resolve => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.GetLastFrame]().then((result) => {
            resolve(PrivateFrameData.fromJSON(JSON.parse(result.data)));
        }));
    }
    static getLastFrameOrNull() {
        return new Promise(resolve => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.GetLastFrameOrNull]()
            .then((frameDataJSONString) => {
            if (!frameDataJSONString) {
                return resolve(null);
            }
            resolve(PrivateFrameData.fromJSON(JSON.parse(frameDataJSONString.data)));
        }));
    }
    getCurrentState() {
        return new Promise((resolve, reject) => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.GetCurrentCameraState]()
            .then((result) => {
            resolve(result.data);
        }, reject));
    }
    getIsTorchAvailable() {
        return new Promise((resolve, reject) => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.GetIsTorchAvailable]({
            position: this.camera.position,
        }).then((result) => { resolve(result.data); }, reject));
    }
}
//# sourceMappingURL=CameraProxy.js.map