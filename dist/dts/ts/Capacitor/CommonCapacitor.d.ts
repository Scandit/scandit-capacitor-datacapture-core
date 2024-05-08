import { Optional } from '../../definitions';
export declare class CapacitorError {
    code: number;
    message: string;
    static fromJSON(json: any): Optional<CapacitorError>;
    constructor(code: number, message: string);
}
export interface BlockingModeListenerResult {
    enabled: boolean;
}
export declare const capacitorExec: (successCallback: Optional<Function>, errorCallback: Optional<Function>, pluginName: string, functionName: string, args: Optional<[
    any
]>) => void;
export declare const doReturnWithFinish: (finishCallbackID: string, result: any) => any;
