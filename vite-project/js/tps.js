import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
import { ShadedPlane } from './shaderTest.js';



export class ThirdPersonCamera{
    movementArray = [false,false,false,false];
    movementDirection = new THREE.Vector3(0,0,0);
    moving = false;
    aiming = false;
    shooting = false;
    canShoot = true;
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    line =undefined;
    mousePosition = new THREE.Vector2();
    lastMousePosition = new THREE.Vector2();
    shakeIntensity = 0.3;
    shakeDecay = 0.1; 
    maxShakeIntensity = 0.5;
    original = new THREE.Vector3(0,0,0);
    aimOriginal = new THREE.Vector3(0,0,0);
    controlOffSet = new THREE.Vector3(0,0,0);
    lastVelocity = new THREE.Vector3(0,0,0);
    constructor(canvas,camera ,target ,offSet,aimOffSet, velocity , lookAtOffset , skeleton , shadedPlane, leftShoulder, rightShoulder){
        this.shadedPlane = shadedPlane;
        this.canvas = canvas;
        this.camera = camera;
        this.target = target;
        this.lookAtOffset = lookAtOffset;
        this.skeleton = skeleton;
        this.offSet = offSet;
        this.aimOffSet = aimOffSet;
        this.original = offSet.clone();
        this.controlOffSet = offSet.clone();
        this.aimOriginal = aimOffSet.clone();
        this.velocity = velocity;
        this.leftShoulder = leftShoulder;
        this.rightShoulder = rightShoulder;
        this.phi = 0;
        this.theta = 0;
        this.up = new THREE.Vector3(0,1,0);
        this.side = new THREE.Vector3(1,0,0);
        this.test = new THREE.Vector3(0,0,0);
        this.camera.position.copy(this.target.position);
        this.camera.position.add(this.offSet);
        this.camera.lookAt(this.target.position);
        this.camera.updateMatrix();
        this.shadedPlane.mesh.visible = false;
    }

    onMouseMoveTest(event,xSensitivity = 1,ySensitivity = 1){
        this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.lastMousePosition.copy(this.mousePosition);
        this.phi -= event.movementX * xSensitivity * 0.0005;
        this.theta -= event.movementY * ySensitivity * 0.0005;
        this.theta = THREE.MathUtils.clamp(this.theta, -Math.PI / 4, Math.PI / 4);
        this.target.children[1].position.y = Math.sin(this.theta)*300;
        let thetaQ = new THREE.Quaternion().setFromAxisAngle(this.side , 0);
        let phiQ = new THREE.Quaternion().setFromAxisAngle(this.up , this.phi);
        let totalRotation = new THREE.Quaternion().multiply(thetaQ).multiply(phiQ);
        totalRotation.normalize();
        this.target.quaternion.copy(totalRotation);  
    }
    raycast(scene , time){
        if(this.shooting && this.canShoot){
        this.canShoot = false;
        setTimeout(() => {
            this.canShoot = true;
        }, time);
        const targetPosition = this.target.children[1].getWorldPosition(new THREE.Vector3());
        this.raycaster.set(this.camera.position, targetPosition.clone().sub(this.camera.position).normalize());
        const intersects = this.raycaster.intersectObjects(scene.children, true);
        }
        } 
    update(scene){
        if(this.shooting){
            this.cameraShake(this.original, this.aimOriginal , 0.1);
            this.leftShoulder.rotation.x -= Math.sin(this.theta)*4/5;
            this.rightShoulder.rotation.x -= Math.sin(this.theta)*4/5;
        }
        else{
            this.offSet.copy(this.original);
            this.aimOffSet.copy(this.aimOriginal);
        }
        const worldOffset = this.controlOffSet.clone().applyQuaternion(this.target.quaternion);
        const targetPosition = this.target.position.clone().add(worldOffset);
        this.camera.position.lerp(targetPosition , 0.15);
        this.camera.lookAt(this.target.children[1].getWorldPosition(new THREE.Vector3()));
        this.camera.updateMatrix();
        this.raycast(scene , shootFrequency);
    }
    movementUpdate(){
        if(this.moving){
            this.lastVelocity = new THREE.Vector3(0,0,0);
            let forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.target.quaternion);
            forward.y = 0;
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.target.quaternion);
            if(this.movementArray[0]){
                this.lastVelocity.add(forward.clone().multiplyScalar(-this.velocity.z));
                this.target.position.sub(forward.multiplyScalar(this.velocity.z));
            }
            else if(this.movementArray[1]){
                this.lastVelocity.add(forward.clone().multiplyScalar(this.velocity.z));
                this.target.position.add(forward.multiplyScalar(this.velocity.z));
            }
            if(this.movementArray[2]){
                this.lastVelocity.add(right.clone().multiplyScalar(this.velocity.x));
                this.target.position.add(right.multiplyScalar(this.velocity.x));
            }
            else if(this.movementArray[3]){
                this.lastVelocity.add(right.clone().multiplyScalar(-this.velocity.x));
                this.target.position.sub(right.multiplyScalar(this.velocity.x));
            }
        }
    
    }
    cameraShake(original , aimOriginal , maxShakeRange) {
        const x = THREE.MathUtils.randFloatSpread(this.shakeIntensity*bulletMass/10);
        const y = THREE.MathUtils.randFloatSpread(this.shakeIntensity*bulletMass/10);
        const z = THREE.MathUtils.randFloatSpread(this.shakeIntensity*bulletMass/10);
        maxShakeRange = maxShakeRange*bulletMass/10;
        const randomOffset = new THREE.Vector3(x, y, z);
        const newOffset = this.offSet.clone().add(randomOffset);
        const aimNewOffset = this.aimOffSet.clone().add(randomOffset);
        this.offSet.x = THREE.MathUtils.clamp(newOffset.x, original.x - maxShakeRange, original.x + maxShakeRange);
        this.offSet.y = THREE.MathUtils.clamp(newOffset.y, original.y - maxShakeRange, original.y + maxShakeRange);
        this.offSet.z = THREE.MathUtils.clamp(newOffset.z, original.z - maxShakeRange, original.z + maxShakeRange);
        this.aimOffSet.x = THREE.MathUtils.clamp(aimNewOffset.x, aimOriginal.x - maxShakeRange/2, aimOriginal.x + maxShakeRange/2);
        this.aimOffSet.y = THREE.MathUtils.clamp(aimNewOffset.y, aimOriginal.y - maxShakeRange/2, aimOriginal.y + maxShakeRange/2);
        this.aimOffSet.z = THREE.MathUtils.clamp(aimNewOffset.z, aimOriginal.z - maxShakeRange/2, aimOriginal.z + maxShakeRange/2);
    }
    onMousePress(event ){ 
        if(event.button === 2){
            this.aiming = true;
            this.controlOffSet = this.aimOffSet;
        }
        if(event.button === 0){
            this.shooting = true;
            this.shadedPlane.mesh.visible = true;
        }
    }
    onMouseRelease(event ){
        if(event.button === 2){
            this.aiming = false;
            this.controlOffSet = this.offSet;
        }
        if(event.button === 0){
            this.shooting = false;
            this.shadedPlane.mesh.visible = false;   
        }
    }
    onKeyDown(event){
        this.moving = true;
        switch(event.key.toLowerCase()){
            case 'w':
                this.movementArray[0] = true;
                this.movementDirection.z = 1;
                break;
            case 's':
                this.movementArray[1] = true;
                this.movementDirection.z = -1;
                break;
            case 'a':
                this.movementArray[2] = true;
                this.movementDirection.x = -1;
                break;
            case 'd':
                this.movementArray[3] = true;
                this.movementDirection.x = 1;
                break;
        }
    }
    onKeyUp(event){
        this.moving = false;
        switch(event.key.toLowerCase()){
            case 'w':
                this.movementArray[0] = false;
                this.movementDirection.z = 0;
                break;
            case 's':
                this.movementArray[1] = false;
                this.movementDirection.z = 0;
                break;
            case 'a':
                this.movementArray[2] = false;
                this.movementDirection.x = 0;
                break;
            case 'd':
                this.movementArray[3] = false;
                this.movementDirection.x = 0;
                break;
        }
        for(let i = 0; i < this.movementArray.length; i++){
            if(this.movementArray[i]){
                this.moving = true;
                break;
            }
        }
    }  

}