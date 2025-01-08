import {THREE , FontLoader , TextGeometry} from './LibImports.js'
export class TextAdder {
    textMesh = undefined;
    textGeometry = undefined;
    boundingBox = undefined;
    centerOffSet = undefined;
    totalGroup = undefined;
    lookAtObject = undefined;
    spotLight = undefined;
    spotLightHelper = undefined;

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
        this.centerOffSetX = -0.5 * (this.boundingBox.max.x - this.boundingBox.min.x);
        this.centerOffSetY = 0.5 * (this.boundingBox.max.y - this.boundingBox.min.y);
        this.totalGroup.add(this.textMesh );
        this.totalGroup.position.set(0,0,0);
    }
    setPosition(x, y, z) {
        this.totalGroup.position.set(x, y, z);

    }
}

let fontLoader = new FontLoader();
let fontGroup = new THREE.Group();
let mat = new THREE.MeshBasicMaterial({color: 0x00ffff});
let font = fontLoader.load('resources/assets/fonts/helvetiker_bold.typeface.json' , function(response){
    font = response;
    let bar = new TextAdder('Baris Yildiz', font, 100, 8, 12, true, 4, 8, -2, 8, mat);
    let me = new TextAdder('Said Cetin', font, 100, 8, 12, true, 4, 8, -2, 8, mat);
    let muzo = new TextAdder('Berke Savas', font, 100, 8, 12, true, 4, 8, -2, 8, mat);
    let emre = new TextAdder('Emre Erdogan', font, 100, 8, 12, true, 4, 8, -2, 8, mat);
    bar.setPosition(-bar.boundingBox.max.x + bar.centerOffSet, 0, -1000);
    me.setPosition(bar.totalGroup.position.x + bar.boundingBox.max.x + 1000 - me.centerOffSet, 0, 0);
    muzo.setPosition(me.totalGroup.position.x + me.boundingBox.max.x - muzo.centerOffSet + 500, 0, -1000);
    emre.setPosition(muzo.totalGroup.position.x + muzo.boundingBox.max.x - emre.centerOffSet, 0, 0);
    fontGroup.add(bar.totalGroup, me.totalGroup, muzo.totalGroup, emre.totalGroup);
    console.log('font loaded');
});









