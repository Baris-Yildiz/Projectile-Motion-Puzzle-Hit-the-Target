import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { ObjectMover } from './ObjectMover.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { FirstPersonCamera } from './fps.js';
import { CharacterMovement } from './characterMovement.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { ThirdPersonCamera } from './tps.js';
import { AnimationControls } from './animationControls.js';
import { ZombieControls } from './zombieControls.js';
import { ShadedPlane } from './shaderTest.js';
import { PlayerLoader } from './CharacterLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { add } from 'three/webgpu';
import { Game } from './game.js';

class TextAdder {
    textMesh = undefined;
    textGeometry = undefined;
    boundingBox = undefined;
    centerOffSet = undefined;

    constructor(text, font, size, depth, curveSegments, bevelEnabled, bevelThickness, bevelSize, bevelOffset, bevelSegments, material) {
        this.scene = scene;
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
        this.light = null;
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
        this.centerOffSet = -0.5 * (this.boundingBox.max.x - this.boundingBox.min.x);
        //this.group = new THREE.Group();
        //this.group.add(this.textMesh, this.light, spotlightHelper);
    }

    setPosition(x, y, z) {
        this.textMesh.position.set(x, y, z);
    }
}





const selectionScene = new THREE.Scene();
const selectionCamera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 4000);
selectionCamera.position.set(0,-100,1700);
selectionScene.background = new THREE.Color(0x0);

let options = undefined;
let fontLoader = new FontLoader();
let font = fontLoader.load('src/Assets/fonts/helvetiker_bold.typeface.json' , function(response){
    font = response;
    options = {
        'font' : font,
        'size' : 100/2,
        'depth' : 8/2,
        'curveSegments' : 12/2  ,
        'bevelEnabled' : true,
        'bevelThickness' : 10/2,
        'bevelSize' : 8/2,
        'bevelOffset' : 0,
        'bevelSegments' : 8/2,
    }
});



const scene = new THREE.Scene();
scene.background = new THREE.Color(0x88888);

const camera = new THREE.PerspectiveCamera(120, window.innerWidth / window.innerHeight, 0.1, 800);
camera.position.z = 800;
camera.position.y = 0;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
//let controls = new OrbitControls(selectionCamera, renderer.domElement);
let cube = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial({color: 0xff0000}));
let objectMover = new ObjectMover(selectionScene, selectionCamera, renderer);
document.addEventListener('click', (event) => {
    objectMover.onMouseClick(event);
});
document.addEventListener('keydown', (event) => {
    objectMover.transformModeControls(event);
});

const gltfLoader = new GLTFLoader();
const modelPath = 'src/Assets/conceptual_building_shapes/scene.gltf';
const gunPath = 'src/Assets/gun/scene.gltf';
const soldierPath = 'src/Assets/olmusolsunlutfen/swat.gltf';
const char1Path = 'src/Assets/char1/char1.gltf';
const char2Path = 'src/Assets/char2/char2.gltf';
const char3Path = 'src/Assets/char5/teset.gltf';
const char4Path = 'src/Assets/olmusolsunlutfen/swat.gltf';

let char1 = undefined;
let char2 = undefined;
let char3 = undefined;
let char4 = undefined;
let char1Mixer = undefined;
let char2Mixer = undefined;
let char3Mixer = undefined;
let char4Mixer = undefined;

gltfLoader.load(char1Path, (gltf) => {
    char1 = gltf.scene;
    char1.position.set(0,0,0);
    char1.scale.set(800,800,800);
    
    char1Mixer = new THREE.AnimationMixer(char1);
    gltf.animations.forEach(animation => {
        if(animation.name.includes('Idle')){
            char1Mixer.clipAction(animation).setLoop(THREE.LoopRepeat);
            char1Mixer.clipAction(animation).play();
        }
    });

    char1.traverse( function ( object ) {
        if ( object.isMesh ) object.castShadow = true;
     } );
});

gltfLoader.load(char2Path, (gltf) => {
    char2 = gltf.scene;
    char2.position.set(0,0,0);
    char2.scale.set(800,800,800);
    char2Mixer = new THREE.AnimationMixer(char2);
    gltf.animations.forEach(animation => {
        if(animation.name.includes('Idle')){
            char2Mixer.clipAction(animation).setLoop(THREE.LoopRepeat);
            char2Mixer.clipAction(animation).play();
        }
    });

    char2.traverse( function ( object ) {
        if ( object.isMesh ) object.castShadow = true;
     } );

});

gltfLoader.load(char3Path, (gltf) => {
    char3 = gltf.scene;
    char3.position.set(0,0,0);
    char3.scale.set(80,80,80);
    

    char3Mixer = new THREE.AnimationMixer(char3);
    gltf.animations.forEach(animation => {
        if(animation.name.includes('Idle')){
            char3Mixer.clipAction(animation).setLoop(THREE.LoopRepeat);
            char3Mixer.clipAction(animation).play();
        }
    });
    //selectionScene.add(char3);
    char3.traverse( function ( object ) {
        if ( object.isMesh ) object.castShadow = true;
     } );

});

gltfLoader.load(char4Path, (gltf) => {
    char4 = gltf.scene;
    char4.position.set(0,0,0);
    char4.scale.set(800,800,800);
    char4Mixer = new THREE.AnimationMixer(char4);
    gltf.animations.forEach(animation => {
        if(animation.name.includes('Idle')){
            char4Mixer.clipAction(animation).setLoop(THREE.LoopRepeat);
            char4Mixer.clipAction(animation).play();
        }
    });
    char4.traverse( function ( object ) {
        if ( object.isMesh ) object.castShadow = true;
     } );
});





const shadedPlane = new ShadedPlane(window.innerWidth, window.innerHeight, 0.03, 50);
scene.add(shadedPlane.mesh);
let test1 = new ShadedPlane(window.innerWidth, window.innerHeight, 50, 50);

//scene.add(test1.mesh);
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000),
    new THREE.ShadowMaterial({ opacity: 0.5 })
);
ground.position.set(0,1,0);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
//scene.add(ground);

const directionalLight = new THREE.DirectionalLight(0x404040, 5);
directionalLight.position.set(-600, 260, 0);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 1000;
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x404040, 100);
scene.add(ambientLight);
//let player = new PlayerLoader(gltfLoader, char1Path, gunPath, renderer.domElement, camera, new THREE.Vector3(0, 2, -5), new THREE.Vector3(-0.3, 1.35, -1.2), new THREE.Vector3(1 / 20, 0, 1 / 20), new THREE.Vector3(0, 25 / 20, 250 / 20), shadedPlane);
//const player1 = new PlayerLoader(gltfLoader, soldierPath, gunPath, renderer.domElement, camera, new THREE.Vector3(0, 2, -5), new THREE.Vector3(-0.3, 1.35, -1.2), new THREE.Vector3(1 / 20, 0, 1 / 20), new THREE.Vector3(0, 25 / 20, 250 / 20), shadedPlane);
//scene.add(player.parent);

const clock = new THREE.Clock();
let unadded = true;
//let game = new Game(selectionScene, selectionCamera, renderer);
let clock2 = new THREE.Clock();
let mat = new THREE.MeshPhongMaterial({color: 0xff0000});
//let sp = new ShadedPlane(window.innerWidth, window.innerHeight, 0.03, 50);
function selectionFrame(){
    requestAnimationFrame(selectionFrame);
    if (char1 !== undefined && char2 !== undefined && char3 !== undefined && char4 !== undefined && options !== undefined && unadded) {
        let bar = new TextAdder('Baris Yildiz', font, 100, 8, 12, true, 4, 8, -2, 8, mat);
        let me = new TextAdder('Said Cetin', font, 100, 8, 12, true, 4, 8, -2, 8, mat);
        let muzo = new TextAdder('Berke Savas', font, 100, 8, 12, true, 4, 8, -2, 8, mat);
        let emre = new TextAdder('Emre Erdogan', font, 100, 8, 12, true, 4, 8, -2, 8, mat);
        bar.setPosition(-bar.boundingBox.max.x + bar.centerOffSet, 0, -1000);
        me.setPosition(bar.textMesh.position.x + bar.boundingBox.max.x + 1000 - me.centerOffSet, 0, 0);
        muzo.setPosition(me.textMesh.position.x + me.boundingBox.max.x - muzo.centerOffSet + 500, 0, -1000);
        emre.setPosition(muzo.textMesh.position.x + muzo.boundingBox.max.x - emre.centerOffSet, 0, 0);
        
        char1.position.copy(bar.textMesh.position);
        char1.position.x -= bar.centerOffSet;
        char1.position.y -= 1500;
   
        char2.position.copy(emre.textMesh.position);
        char2.position.x -= emre.centerOffSet;
        char2.position.y -= 1500;
        char3.position.copy(muzo.textMesh.position);
        char3.position.x -= muzo.centerOffSet;
        char3.position.y -= 1500;
        
        char4.position.copy(me.textMesh.position);
        char4.position.x -= me.centerOffSet;
        char4.position.y -= 1500;
        //baris spotlight ayarları
        let dirLight = new THREE.SpotLight(0xffffff, 10);
        dirLight.penumbra = 0.9;
        dirLight.decay = .1;
        dirLight.distance = 1000;
        dirLight.target = bar.textMesh;
        bar.textMesh.attach(dirLight);
        dirLight.position.set(bar.boundingBox.max.x+100 , bar.boundingBox.max.y + 100, 100);
        let dirLightHelper = new THREE.SpotLightHelper(dirLight, 15, 0x252525);
        selectionScene.add(dirLightHelper);

        //said spotlight ayarları
        let dirLight2 = new THREE.SpotLight(0xffffff, 10);
        dirLight2.penumbra = 0.9;
        dirLight2.decay = 0.1;
        dirLight2.distance = 1000; //1000 orijinal  2500 -3000 spotlight distance
        dirLight2.target = me.textMesh;
        me.textMesh.attach(dirLight2);
        dirLight2.position.set(me.boundingBox.max.x+300 , me.boundingBox.max.y + 100, 100);
        let dirLightHelper2 = new THREE.SpotLightHelper(dirLight2, 15, 0x252525);
        selectionScene.add(dirLightHelper2);

        // muzo spotlight ayarları
        let dirLight3 = new THREE.SpotLight(0xffffff, 10);
        dirLight3.penumbra = 0.9;
        dirLight3.decay = .1;
        dirLight3.distance = 1500;
        dirLight3.target = muzo.textMesh;
        muzo.textMesh.attach(dirLight3);
        dirLight3.position.set(muzo.boundingBox.max.x , muzo.boundingBox.max.y + 100, 300);//muzo orijinal z = 300
        let dirLightHelper3 = new THREE.SpotLightHelper(dirLight3, 15, 0x252525);
        selectionScene.add(dirLightHelper3);


        //emre spotlight ayarları
        let dirLight4 = new THREE.SpotLight(0x404040, 100);
        dirLight4.penumbra = 0.7;
        dirLight4.decay = .1;
        dirLight4.distance = 1500;//orijinal 1500 
        dirLight4.target = emre.textMesh;
        emre.textMesh.attach(dirLight4);
        dirLight4.position.set(emre.boundingBox.max.x+200 , emre.boundingBox.max.y + 300, 100);
        let dirLightHelper4 = new THREE.SpotLightHelper(dirLight4, 15, 0x252525);
        selectionScene.add(dirLightHelper4);
        objectMover.addRayCastObject(char1);
        objectMover.addRayCastObject(char2);
        objectMover.addRayCastObject(char3);
        objectMover.addRayCastObject(char4);
        let totalGroup = new THREE.Group(); 
        totalGroup.position.add(new THREE.Vector3(-2500, 0, -300));
        objectMover.rayCastableObjects.position.add(new THREE.Vector3(-2500, 0, -300));
        totalGroup.add(bar.textMesh, me.textMesh, muzo.textMesh, emre.textMesh);
        //selectionScene.add(totalGroup);
        selectionScene.add(objectMover.rayCastableObjects);
        selectionScene.add(totalGroup);
        console.log(totalGroup);
        console.log(objectMover.rayCastableObjects);
        console.log(char1);
        console.log(char2);
        console.log(char3);
        console.log(char4);
        unadded = false;
        console.log('added');
    }
    if(char1Mixer !== undefined && char2Mixer !== undefined && char3Mixer !== undefined && char4Mixer !== undefined){
        let delta = clock.getDelta();
        char1Mixer.update(delta);
        char2Mixer.update(delta);
        char3Mixer.update(delta);
        char4Mixer.update(delta);
    }
    objectMover.transformControls.update();
    //controls.update();
    renderer.render(selectionScene, selectionCamera);
}
selectionFrame();



function frame() {
    requestAnimationFrame(frame);
    if (player.tps !== undefined) {
        player.characterMixer.update(clock.getDelta());
        player.animationControls.movementUpdate();
        player.tps.update(scene);
        player.tps.movementUpdate();
    } 
    if(options !== undefined   && unadded ){
        let textAdder = new TextAdder('Baris Yildiz', options , font);
        selectionScene.add(textAdder.textMesh);
        unadded = false;
        console.log('added');
    }
    test1.update(clock.getElapsedTime());
    shadedPlane.update(clock.getElapsedTime());
   // renderer.render(selectionScene, selectionCamera);
    //renderer.render(scene, camera);
}

//frame();

window.addEventListener('resize', () => {
    shadedPlane.resize(window.innerWidth, window.innerHeight);
});

let building = undefined;

gltfLoader.load(modelPath, (gltf) => {
    building = gltf.scene;
    building.position.set(0,0,0);
    building.scale.set(300,300,300);
    scene.add(building); 
    building.traverse( function ( object ) {
      if ( object.isMesh ) object.castShadow = true;

   } );
    const ambientLight = new THREE.AmbientLight(0x404040, 100);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0x404040, 5); 
    directionalLight.position.set(-600 , 260 , 0);
    let targetObject = new THREE.Object3D();
    targetObject.position.set(-550,0,0);
    directionalLight.target = targetObject;
    let lightHelper = new THREE.DirectionalLightHelper(directionalLight , 15 , 0x252525);
    scene.add(directionalLight , lightHelper);
}, (xhr) => {
    const percentComplete = xhr.loaded / xhr.total * 100;
    console.log(`Loading model... ${Math.round(percentComplete)}% complete`);
}, (error) => {
    console.error('An error occurred while loading the model:', error);
});