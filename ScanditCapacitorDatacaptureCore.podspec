require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
version = package["version"]

Pod::Spec.new do |s|
  s.name                   = 'ScanditCapacitorDatacaptureCore'
  s.version                = version
  s.summary                = package["description"]
  s.license                = package["license"]
  s.homepage               = package["homepage"]
  s.author                 = package["author"]
  s.source                 = { :git => package["homepage"], :tag => s.version.to_s }
  s.source_files           = "ios/Sources/**/*.{swift,h,m,c,cc,mm,cpp}"
  s.public_header_files    = "ios/Sources/ScanditCapacitorCoreObjC/**/*.h"
  s.ios.deployment_target  = "15.0"
  s.swift_version          = "5.7"

  s.dependency "Capacitor"
  s.dependency "scandit-datacapture-frameworks-core", '= 8.1.1'
end
