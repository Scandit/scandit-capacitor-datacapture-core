require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
version = package["version"]

Pod::Spec.new do |s|
  s.name                   = "ScanditCapacitorDatacaptureCore"
  s.version                = version
  s.summary                = package["description"]
  s.license                = package["license"]
  s.homepage               = package["homepage"]
  s.author                 = package["author"]
  s.source                 = { :git => package["homepage"], :tag => s.version.to_s }
  s.source_files           = "ios/Plugin/**/*.{swift,h,m,c,cc,mm,cpp}"
  s.ios.deployment_target  = "14.0"
  s.swift_version          = "5.7"

  s.dependency "Capacitor"
  s.dependency "scandit-datacapture-frameworks-core", '= 7.4.1'
end
