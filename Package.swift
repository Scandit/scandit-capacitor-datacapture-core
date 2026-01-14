// swift-tools-version: 5.9
import PackageDescription
import Foundation

// Read version from package.json
func getVersion() -> String {
    let packageJSONPath = Context.packageDirectory + "/package.json"
    guard let data = try? Data(contentsOf: URL(fileURLWithPath: packageJSONPath)),
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
          let version = json["version"] as? String else {
        fatalError("Could not read version from package.json at \(packageJSONPath)")
    }
    return version
}

let version = getVersion()

let package = Package(
    name: "ScanditCapacitorDatacaptureCore",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "ScanditCapacitorDatacaptureCore",
            targets: ["ScanditCapacitorDatacaptureCore"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "7.0.0"),
        .package(url: "https://github.com/Scandit/scandit-datacapture-frameworks-core.git", exact: Version(stringLiteral: version))
    ],
    targets: [
        // Objective-C target for VolumeButtonObserver
        .target(
            name: "ScanditCapacitorDatacaptureCoreObjC",
            dependencies: [
                .product(name: "ScanditFrameworksCore", package: "scandit-datacapture-frameworks-core")
            ],
            path: "ios/Sources/ScanditCapacitorCoreObjC",
            publicHeadersPath: "."),
        // Swift target that depends on the Objective-C target
        .target(
            name: "ScanditCapacitorDatacaptureCore",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "ScanditFrameworksCore", package: "scandit-datacapture-frameworks-core"),
                "ScanditCapacitorDatacaptureCoreObjC"
            ],
            path: "ios/Sources/ScanditCapacitorCore"),
        .testTarget(
            name: "ScanditCapacitorDatacaptureCoreTests",
            dependencies: ["ScanditCapacitorDatacaptureCore"],
            path: "ios/Tests/ScanditCapacitorCoreTests")
    ]
)
