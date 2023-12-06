export class CapacitorError {
    constructor(code, message) {
        this.code = code;
        this.message = message;
    }
    static fromJSON(json) {
        if (json && json.code && json.message) {
            return new CapacitorError(json.code, json.message);
        }
        else {
            return null;
        }
    }
}
export const capacitorExec = (successCallback, errorCallback, pluginName, functionName, args) => {
    if (window.Scandit && window.Scandit.DEBUG) {
        // tslint:disable-next-line:no-console
        console.log(`Called native function: ${functionName}`, args, { success: successCallback, error: errorCallback });
    }
    const extendedSuccessCallback = (message) => {
        const shouldCallback = message && message.shouldNotifyWhenFinished;
        const finishCallbackID = shouldCallback ? message.finishCallbackID : null;
        const started = Date.now();
        let callbackResult;
        if (successCallback) {
            callbackResult = successCallback(message);
        }
        if (shouldCallback) {
            const maxCallbackDuration = 50;
            const callbackDuration = Date.now() - started;
            if (callbackDuration > maxCallbackDuration) {
                // tslint:disable-next-line:no-console
                console.log(`[SCANDIT WARNING] Took ${callbackDuration}ms to execute callback that's blocking native execution. You should keep this duration short, for more information, take a look at the documentation.`);
            }
            window.Capacitor.Plugins[pluginName].finishCallback([{
                    finishCallbackID,
                    result: callbackResult,
                }]);
        }
    };
    const extendedErrorCallback = (error) => {
        if (errorCallback) {
            const capacitorError = CapacitorError.fromJSON(error);
            if (capacitorError !== null) {
                error = capacitorError;
            }
            errorCallback(error);
        }
    };
    window.Capacitor.Plugins[pluginName][functionName](args).then(extendedSuccessCallback, extendedErrorCallback);
};
export const doReturnWithFinish = (finishCallbackID, result) => {
    if (window.Capacitor.Plugins.ScanditBarcodeNative) {
        window.Capacitor.Plugins.ScanditBarcodeNative.finishCallback({ result: Object.assign({ finishCallbackID }, result) });
    }
    else if (window.Capacitor.Plugins.ScanditIdNative) {
        window.Capacitor.Plugins.ScanditIdNative.finishCallback({ result: Object.assign({ finishCallbackID }, result) });
    }
    return result;
};
//# sourceMappingURL=CommonCapacitor.js.map