/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2023- Scandit AG. All rights reserved.
 */

import ScanditCaptureCore

// TODO: use SDK serializer/deserializer: https://jira.scandit.com/browse/SDK-11699

struct QuadrilateralJSON: CommandJSONArgument {
    let topLeft: PointJSON
    let topRight: PointJSON
    let bottomRight: PointJSON
    let bottomLeft: PointJSON

    var quadrilateral: Quadrilateral {
        return Quadrilateral(topLeft: topLeft.cgPoint,
                             topRight: topRight.cgPoint,
                             bottomRight: bottomRight.cgPoint,
                             bottomLeft: bottomLeft.cgPoint)
    }
}
