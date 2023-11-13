import { PrivateFrameData } from '../Camera+Related';
import { Capacitor, CapacitorFunction } from './Capacitor';
export class CameraProxy {
    static forCamera(camera) {
        const proxy = new CameraProxy();
        proxy.camera = camera;
        return proxy;
    }
    static getLastFrame() {
        return new Promise(resolve => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.GetLastFrame]().then((frameDataJSONString) => {
            let parsedData;
            if (frameDataJSONString.data) {
                parsedData = JSON.parse(frameDataJSONString.data);
            }
            else {
                parsedData = frameDataJSONString;
            }
            resolve(PrivateFrameData.fromJSON(parsedData));
        }));
    }
    static getLastFrameOrNull() {
        return new Promise(resolve => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.GetLastFrameOrNull]()
            .then((frameDataJSONString) => {
            if (!frameDataJSONString) {
                return resolve(null);
            }
            resolve(PrivateFrameData.fromJSON(JSON.parse(frameDataJSONString)));
        }));
    }
    getCurrentState() {
        return new Promise((resolve, reject) => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.GetCurrentCameraState]()
            .then(resolve, reject));
    }
    getIsTorchAvailable() {
        return new Promise((resolve, reject) => window.Capacitor.Plugins[Capacitor.pluginName][CapacitorFunction.GetIsTorchAvailable]({
            position: this.camera.position,
        }).then(resolve, reject));
    }
}
//# sourceMappingURL=CameraProxy.js.map