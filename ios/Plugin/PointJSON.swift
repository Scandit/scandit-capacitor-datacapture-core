import WebKit

extension CGPoint {
    var json: CommandError.JSONMessage {
        return [
            "x": x,
            "y": y
        ]
    }

    var jsonString: String {
        return String(data: try! JSONSerialization.data(withJSONObject: json), encoding: .utf8)!
    }
}

struct PointJSON: CommandJSONArgument {
    let x: Double
    let y: Double

    var cgPoint: CGPoint {
        return CGPoint(x: x, y: y)
    }
}
