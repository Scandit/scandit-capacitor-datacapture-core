import { CoreDefaults, NativeCaller } from 'scandit-datacapture-frameworks-core';
import { Optional } from '../../definitions';
export interface CapacitorWindow extends Window {
    Scandit: any;
    Capacitor: any;
}
export declare const pluginName = "ScanditCaptureCoreNative";
export declare const Capacitor: {
    pluginName: string;
    defaults: CoreDefaults;
    exec: (success: Optional<Function>, error: Optional<Function>, functionName: string, args: Optional<[
        any
    ]>) => void;
};
export declare const getDefaults: () => Promise<CoreDefaults>;
export declare class CapacitorNativeCaller implements NativeCaller {
    private pluginName;
    constructor(pluginName: string);
    get framework(): string;
    get frameworkVersion(): string;
    callFn(fnName: string, args: object | undefined | null, _meta?: {
        isEventRegistration?: boolean;
    }): Promise<any>;
    registerEvent(evName: string, handler: (args: any) => Promise<void>): Promise<any>;
    unregisterEvent(_evName: string, subscription: any): Promise<void>;
    eventHook(ev: any): any;
}
