/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2023- Scandit AG. All rights reserved.
 */

public protocol CommandJSONArgument: Decodable {
    static func fromJSONObject(_ jsonObject: Any) throws -> Self
}

public extension CommandJSONArgument {
    static func fromJSONObject(_ jsonObject: Any) throws -> Self {
        let data = try JSONSerialization.data(withJSONObject: jsonObject)
        return try JSONDecoder().decode(Self.self, from: data)
    }
}
