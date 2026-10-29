declare type VolumeButtonObserver = any;
export declare class VolumeButtonObserverProxy {
    private volumeButtonObserver;
    private subscriber;
    static forVolumeButtonObserver(volumeButtonObserver: VolumeButtonObserver): VolumeButtonObserverProxy;
    dispose(): void;
    private subscribe;
    private unsubscribe;
    private notifyListeners;
}
export {};
