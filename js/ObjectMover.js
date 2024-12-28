import {THREE} from "./LibImports.js"
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

export class ObjectMover {
    constructor(scene , camera , renderer) {
        this.scene = scene;
        this.camera = camera
        this.renderer = renderer;
        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.rayCastableObjects = new THREE.Group();
        this.scene.add(this.transformControls.getHelper());
    }

    addRayCastObject(object){
        this.rayCastableObjects.add(object);
    }
    onMouseClick(event) {
        //mouse pozisyonunun normalize ediyor    
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        //kameradan mouse pozisyonuna raycast atıyor ve raycastable objelere bakıyor
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.rayCastableObjects.children , true);
        //eğer denk gelen obje varsa objeye translation/rotation oklarını ekliyor
        if (intersects.length > 0) {
            this.transformControls.detach();
            this.transformControls.attach(intersects[0].object)
        }
        else{
            this.transformControls.detach();
        }
    }
    hideControls(){
        this.transformControls.showX = !this.transformControls.showX;
        this.transformControls.showY = !this.transformControls.showY;
        this.transformControls.showZ = !this.transformControls.showZ;
    }
    transformModeControls(e) {
        if(e.key === 'r'){
            this.transformControls.setMode('rotate')
        }
        else if(e.key === 'c'){
            this.transformControls.setMode('translate')
        }
        else if(e.key === 'h'){
            this.hideControls(this.transformControls)
        }
        else if(e.key === 'l'){
            this.transformControls.setSpace('local');
        }
    }

   
}