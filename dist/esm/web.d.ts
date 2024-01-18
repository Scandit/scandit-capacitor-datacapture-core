import { ScanditCaptureCorePluginInterface } from './definitions';
export * from './definitions';
export declare class ScanditCaptureCorePluginImplementation implements ScanditCaptureCorePluginInterface {
    initializePlugins(): Promise<any>;
}
export declare const ScanditCaptureCorePlugin: ScanditCaptureCorePluginImplementation;
