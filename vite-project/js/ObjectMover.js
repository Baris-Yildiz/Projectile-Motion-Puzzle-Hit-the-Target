import {THREE} from "./LibImports.js"
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

export class ObjectMover {
    movedObjects = [];
    selectedObject = null;
    constructor(game,scene , camera , renderer) {
        this.game = game;
        this.scene = scene;
        this.camera = camera
        this.renderer = renderer;
        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.rayCastableObjects = new THREE.Group();
        //this.scene.add(this.transformControls.getHelper());
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
        if (intersects.length > 0 && this.selectedObject !== intersects[0].object) {
            this.selectedObject = intersects[0].object;
            let rb = intersects[0].object.userData.rb;
            console.log(rb);
            if(rb && rb.info){
                this.movedObjects.push({mesh: rb.mesh, mass: rb.mass});
                this.game.physics.removeRigidBody(rb);
            }
        
            this.transformControls.detach();
            this.transformControls.attach(intersects[0].object)
        }
        else if(intersects.length === 0 && this.selectedObject){
            this.transformControls.detach();
            this.selectedObject = null;
        }
    }
    hideControls(){
        this.transformControls.showX = !this.transformControls.showX;
        this.transformControls.showY = !this.transformControls.showY;
        this.transformControls.showZ = !this.transformControls.showZ;
    }
    transformModeControls(e) {

        switch (e.key.toLowerCase()) {
            case 'r':
                this.transformControls.setMode('rotate');
                moveState = true;
                document.getElementById('moveState').style.display = "block";
                document.getElementById('moveState').innerText = "rotate";
                this.setControls(true);
                document.exitPointerLock();
                break;
            case 'c':
                this.transformControls.setMode('translate');
                this.transformControls.setSpace('world');
                moveState = true;
                document.getElementById('moveState').style.display = "block";
                document.getElementById('moveState').innerText = "translate";
                this.setControls(true);
                document.exitPointerLock();
                break;
            case 'l':
                moveState = true;
                this.scene.add(this.transformControls.getHelper());
                this.transformControls.setSpace('local');
                
                document.getElementById('moveState').style.display = "block";
                document.getElementById('moveState').innerText = "local";
                this.setControls(true);

                document.exitPointerLock();
                break;
            case 'h':
                this.setControls(uiState);
                break;
            case 'n':
                moveState = false;
                this.movedObjects.forEach(rb => {
                    console.log(rb);

                    this.game.physics.createBoxRigidBody(rb.mesh ,rb.mass);
                });
                this.movedObjects = [];
                document.getElementById('moveState').style.display = "none";
                document.body.requestPointerLock();
                this.setControls(false);
                this.scene.remove(this.transformControls.getHelper());
                break;
        }
    }
    setControls(on){
        this.transformControls.showX = on;
        this.transformControls.showY = on;
        this.transformControls.showZ =on;
    }
   
}