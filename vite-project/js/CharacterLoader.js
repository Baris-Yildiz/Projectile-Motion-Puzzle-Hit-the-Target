import * as THREE from 'three';
import { ThirdPersonCamera } from './tps.js';
import { AnimationControls } from './animationControls.js';
export class PlayerLoader {
    gun = undefined;
    character = undefined;
    characterAnimations = {};
    characterMixer = undefined;
    characterSkeleton = undefined;
    parent = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 0.5), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
    aimTarget = undefined;
    tps = undefined;
    animationControls = undefined;
    leftShoulder = undefined;
    rightShoulder = undefined;
    playerCollider = undefined;

    constructor(loader, characterPath, gunPath, canvas, camera, offSet, aimOffSet, velocity, lookAtOffset, shadedPlane) {
        this.loader = loader;
        this.characterPath = characterPath;
        this.gunPath = gunPath;
        this.canvas = canvas;
        this.camera = camera;
        this.offSet = offSet;
        this.velocity = velocity;
        this.lookAtOffset = lookAtOffset;
        this.aimOffSet = aimOffSet;
        this.shadedPlane = shadedPlane;
        this.parent.position.set(0, 0, 0);
       
        this.createAimTarget();
        this.loadPlayer();
    }

    createAimTarget() {
        this.aimTarget = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
        //this.aimTarget.position.set(-24, 7, 100);
        this.aimTarget.position.set(-120, 35, 800);
        this.aimTarget.material.depthTest = false; 
        this.aimTarget.material.depthWrite = false;
        this.aimTarget.name = "playerCollider";
        this.aimTarget.renderOrder = 9999;
    }

    addAnimation(hash, animationId, animationIndex) {
        hash[animationId] = animationIndex;
    }
    resetPlayer(){
        this.tps.movementArray.fill(false);
        this.tps.moving = false;
        this.tps.movementDirection.set(0, 0, 0);
        this.tps.shooting = false;
        this.tps.aiming = false;
        this.tps.controlOffSet = this.tps.offSet;
        
        //this.tps.controlOffSet.copy(this.original);
        //this.tps.aimOffSet.copy(this.aimOriginal);
        //this.characterMixer.stopAllAction();
    }

    loadPlayer() {
        this.loader.load(this.gunPath, (gltf) => {
            this.gun = gltf.scene;
            this.gun.position.set(0, 0, 0);
            this.gun.scale.set(0.0091, 0.0091, 0.0091);
            this.gun.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true; // Enable shadows for character
                    child.receiveShadow = true;
                }
            });

            this.loader.load(this.characterPath, (gltf) => {
                this.character = gltf.scene;
                this.character.position.set(0, 0, 0);
                this.character.scale.set(1, 1, 1);
                this.character.traverse((child) => {
                    if (child.name === 'mixamorigLeftShoulder') {
                        this.leftShoulder = child;
                    }
                    if (child.name === 'mixamorigRightShoulder') {
                        this.rightShoulder = child;
                    }
                    if (child.isMesh) {
                        child.castShadow = true; // Enable shadows for character
                        child.receiveShadow = true;
                        //console.log("Mesh found:", child.name, child.material);
                    }
                    if (child.name === 'mixamorigRightHand') {
                        child.attach(this.gun);
                        this.gun.rotation.set(-1.7016960206944716, 0.13089969389957476, -1.1780972450961724);
                        this.gun.position.set(3, 25, -1);
                        this.gun.attach(this.shadedPlane.mesh);
                        this.shadedPlane.mesh.position.set(-5, -11, 44);
                        this.shadedPlane.mesh.rotation.set(-2.8193680456144605, 0.29481719534072404, 1.4412894873893025);
                    }
                });

                this.camera.lookAt(this.character.position);
                this.characterMixer = new THREE.AnimationMixer(this.character);
                this.characterSkeleton = this.character.getObjectByProperty('type', 'SkinnedMesh').skeleton;
                for (let i = 0; i < gltf.animations.length; i++) {
                    let name = gltf.animations[i].name.replace('_Armature', '');
                    this.addAnimation(this.characterAnimations, name, this.characterMixer.clipAction(gltf.animations[i]));
                }
                this.parent.material.visible = false;
                this.parent.name = "playerCollider";

                this.parent.attach(this.character);
                this.parent.attach(this.aimTarget);
                //this.parent.attach(this.playerCollider);
                this.tps = new ThirdPersonCamera(this.canvas, this.camera, this.parent, this.offSet, this.aimOffSet, this.velocity, this.lookAtOffset, this.characterSkeleton, this.shadedPlane, this.leftShoulder, this.rightShoulder);
                this.animationControls = new AnimationControls(this.tps, this.characterMixer, this.characterAnimations, this.characterSkeleton);

            });
        }, (xhr) => {
            const percentComplete = (xhr.loaded / xhr.total) * 100;
            
        });
    }

    
}