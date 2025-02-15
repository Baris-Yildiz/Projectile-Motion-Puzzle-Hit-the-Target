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
    }

    addRayCastObject(object){
        this.rayCastableObjects.add(object);
    }
    onMouseClick(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.rayCastableObjects.children , true);
        if (intersects.length > 0 && this.selectedObject !== intersects[0].object) {
            this.selectedObject = intersects[0].object;
            let rb = intersects[0].object.userData.rb;
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

    transformModeControls(e) {
        switch (e.key.toLowerCase()) {
            case 'r':
                this.transformControls.setMode('rotate');
                //moveState = true;
                document.getElementById('moveState').style.display = "block";
                document.getElementById('moveState').innerText = "rotate";
                this.setControls(true);
                document.exitPointerLock();
                break;
            case 'c':
                this.transformControls.setMode('translate');
                this.transformControls.setSpace('world');
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
                    this.game.physics.createBoxRigidBody(rb.mesh ,rb.mass);
                });
                this.movedObjects = [];
                this.transformControls.detach();
                this.selectedObject = null;
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