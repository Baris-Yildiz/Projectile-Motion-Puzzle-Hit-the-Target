import {THREE , FontLoader , TextGeometry} from './LibImports.js'
export class TextAdder {
    textMesh = undefined;
    textGeometry = undefined;
    boundingBox = undefined;
    centerOffSet = undefined;
    totalGroup = undefined;

    constructor(text, font, size, depth, curveSegments, bevelEnabled, bevelThickness, bevelSize, bevelOffset, bevelSegments, material) {
        this.text = text;
        this.font = font;
        this.size = size;
        this.depth = depth;
        this.curveSegments = curveSegments;
        this.bevelEnabled = bevelEnabled;
        this.bevelThickness = bevelThickness;
        this.bevelSize = bevelSize;
        this.bevelOffset = bevelOffset;
        this.bevelSegments = bevelSegments;
        this.material = material;
        this.totalGroup = new THREE.Group();
        this.addText();
    }

    addText() {
        this.textGeometry = new TextGeometry(this.text, {
            font: this.font,
            size: this.size,
            depth: this.depth,
            curveSegments: this.curveSegments,
            bevelEnabled: this.bevelEnabled,
            bevelThickness: this.bevelThickness,
            bevelSize: this.bevelSize,
            bevelOffset: this.bevelOffset,
            bevelSegments: this.bevelSegments,
        });
        this.textMesh = new THREE.Mesh(this.textGeometry, this.material);
        this.textMesh.castShadow = true;
        this.boundingBox = new THREE.Box3().setFromObject(this.textMesh);
        this.totalGroup.add(this.textMesh );
        this.totalGroup.position.set(0,0,0);
    }
    setPosition(x, y, z) {
        this.totalGroup.position.set(x, y, z);

    }
}

