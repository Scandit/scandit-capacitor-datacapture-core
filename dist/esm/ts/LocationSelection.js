var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { SizeWithUnitAndAspect } from './Common';
import { DefaultSerializeable, nameForSerialization } from './Serializeable';
// tslint:disable-next-line:variable-name
export const NoneLocationSelection = { type: 'none' };
export class RadiusLocationSelection extends DefaultSerializeable {
    get radius() {
        return this._radius;
    }
    constructor(radius) {
        super();
        this.type = 'radius';
        this._radius = radius;
    }
}
__decorate([
    nameForSerialization('radius')
], RadiusLocationSelection.prototype, "_radius", void 0);
export class RectangularLocationSelection extends DefaultSerializeable {
    constructor() {
        super(...arguments);
        this.type = 'rectangular';
    }
    get sizeWithUnitAndAspect() {
        return this._sizeWithUnitAndAspect;
    }
    static withSize(size) {
        const locationSelection = new RectangularLocationSelection();
        locationSelection._sizeWithUnitAndAspect = SizeWithUnitAndAspect.sizeWithWidthAndHeight(size);
        return locationSelection;
    }
    static withWidthAndAspectRatio(width, heightToWidthAspectRatio) {
        const locationSelection = new RectangularLocationSelection();
        locationSelection._sizeWithUnitAndAspect = SizeWithUnitAndAspect
            .sizeWithWidthAndAspectRatio(width, heightToWidthAspectRatio);
        return locationSelection;
    }
    static withHeightAndAspectRatio(height, widthToHeightAspectRatio) {
        const locationSelection = new RectangularLocationSelection();
        locationSelection._sizeWithUnitAndAspect = SizeWithUnitAndAspect
            .sizeWithHeightAndAspectRatio(height, widthToHeightAspectRatio);
        return locationSelection;
    }
}
__decorate([
    nameForSerialization('size')
], RectangularLocationSelection.prototype, "_sizeWithUnitAndAspect", void 0);
//# sourceMappingURL=LocationSelection.js.map