
import * as THREE from 'three'
export class AnimationControls{
    currentAnimation = null;
    lowerBodyBones = ['mixamorigHips', 'mixamorigLeftLeg', 'mixamorigRightLeg'];
    upperBodyBones = ['mixamorigSpine', 'mixamorigChest', 'mixamorigLeftArm', 'mixamorigRightArm', 'mixamorigHead'];
    constructor(character,mixer,animations,skeleton){
        this.character = character;
        this.mixer = mixer;
        this.animations = animations;
        this.skeleton = skeleton;
        this.currentAnimation = this.animations['Idle'];
        this.currentAnimation.setLoop(THREE.LoopRepeat);
        this.currentAnimation.play();
        //console.log(this.character.skeleton.bones);
        

        }

    playAnimation(animationName){
        this.animations[animationName].setLoop(THREE.LoopRepeat);
        this.animations[animationName].play();
    }

    stopAnimation(animationName){
        this.animations["Idle"].setLoop(THREE.LoopRepeat);
        this.animations["Idle"].play();
    }
    movingForward(){
        return this.character.movementDirection.z > 0 && this.character.movementDirection.x == 0;
    }
    movingBackward(){
        return this.character.movementDirection.z < 0 && this.character.movementDirection.x == 0;
    }
    movingLeft(){
        return this.character.movementDirection.x < 0 && this.character.movementDirection.z == 0;
    }
    movingRight(){
        return this.character.movementDirection.x > 0 && this.character.movementDirection.z == 0;
    }
    movingForwardLeft(){
        return this.character.movementDirection.z > 0 && this.character.movementDirection.x < 0;
    }
    movingForwardRight(){
        return this.character.movementDirection.z > 0 && this.character.movementDirection.x > 0;
    }
    movingBackwardLeft(){
        return this.character.movementDirection.z < 0 && this.character.movementDirection.x < 0;
    }
    movingBackwardRight(){
        return this.character.movementDirection.z < 0 && this.character.movementDirection.x > 0;
    }
    setCurrentAnimation(animationName , timeScale = 1) {
        if (this.currentAnimation !== this.animations[animationName]) {
            if (this.currentAnimation) {
                this.currentAnimation.fadeOut(0.3); 
            }
            this.currentAnimation = this.animations[animationName];
            this.currentAnimation.reset(); 
            this.currentAnimation.fadeIn(0.1); 
            this.currentAnimation.setEffectiveTimeScale(timeScale);
            this.currentAnimation.setLoop(THREE.LoopRepeat);
            this.currentAnimation.play();
        }
    }
    addAdditiveAnimation(animationName){
        if(this.character.aiming){
            //console.log("aiming");
            this.currentAnimation.setEffectiveWeight(0);
        }
        else{   
            //console.log("not aiming");
            this.currentAnimation.setEffectiveWeight(0.4);
        }
        //this.animations[animationName].setEffectiveWeight(1);
        //this.animations[animationName].blendMode = THREE.AdditiveAnimationBlendMode;
        //this.animations[animationName].setEffectiveWeight(0.8);
        this.animations[animationName].setEffectiveTimeScale(1.5);
        this.animations[animationName].setLoop(THREE.LoopRepeat);
        this.animations[animationName].play();
    }

    
    
    movementUpdate() {
        const previousAnimation = this.currentAnimation;
        if (this.movingForwardRight()) {
            //console.log("RightStrafe");
            this.setCurrentAnimation('RightStrafe');
        } else if (this.movingForwardLeft()) {
            //console.log("LeftStrafe");
            this.setCurrentAnimation('LeftStrafe');
        } else if (this.movingForward()) {
            //console.log("RunningForward2");
            this.setCurrentAnimation('RunningForward2');
        } else if (this.movingBackward()) {
            //console.log("BackRun");
            this.setCurrentAnimation('BackRun');
        } else if (this.movingRight()) {
            //console.log("RightRun");
            this.setCurrentAnimation('RightRun');
        } else if (this.movingLeft()) {
            //console.log("LeftRun");
            this.setCurrentAnimation('LeftRun');
        } else if (this.movingBackwardRight()) {
            //console.log("BackRightRun");
           
            this.setCurrentAnimation('LeftStrafe' , -1);
        } else if (this.movingBackwardLeft()) {
           
            //console.log("BackLeftRun");
            this.setCurrentAnimation('RightStrafe' , -1);
        } 
        else {
            this.setCurrentAnimation('Idle');
        }
        
  
        if(this.character.shooting){
            //console.log(this.character);
            let rot = THREE.MathUtils.lerp(this.character.skeleton.bones[1].rotation.y , -Math.PI/8 , 0.8);
            this.character.skeleton.bones[1].rotation.y = rot;

            this.character.velocity = new THREE.Vector3(0.3/20,0,0.4/20);
            this.addAdditiveAnimation('StandingShoot');
        }
        else{
            let rot = THREE.MathUtils.lerp(this.character.skeleton.bones[1].rotation.y , 0 , 0.2);
            this.character.skeleton.bones[1].rotation.y = rot;
            this.character.velocity = new THREE.Vector3(1/20,0,1/20);
            this.currentAnimation.setEffectiveWeight(1);
            this.animations['StandingShoot'].stop();
        }
       
        if (previousAnimation && previousAnimation !== this.currentAnimation) {
      
            this.stopAnimation(previousAnimation._clip.name);
        }
    }
    



}