import {THREE} from "./LibImports.js";
import {Particle, ParticleEmitter} from "./ParticleSystem.js";



class PickupManager {
    constructor(game) {
        this.game = game;
        this.pickupMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1,1,1),
            new THREE.MeshStandardMaterial({color: 0x0000ff})
        );

        this.activePickupMesh = null;
        this.activePickupParticleEmitter = null;
    }

    createPickupObject(position) {
        this.activePickupMesh = this.pickupMesh.clone();

        this.activePickupMesh.position.copy(position);

        this.game.physics.createBoxRigidBody(
            this.activePickupMesh,
            1.
        );
        this.activePickupMesh.userData.rb.pickup = true;
        this.activePickupMesh.userData.rb.setFactors(
            new THREE.Vector3(0,0,0),
            new THREE.Vector3(1,1,1)
        )

        this.createPickupParticleEffect(this.activePickupMesh.position);
        scoreNeededForNextPickup = PICKUP_ARRIVE_SCORE;

        this.game.scene.add(this.activePickupMesh);

        // if (this.game.toonShaderManager.isToonEnabled) {
        //     this.game.toonShaderManager.applyToonShader(this.activePickupMesh);
        // } else if (this.game.redBlackShaderManager.isRedBlackEnabled) {
        //     this.game.redBlackShaderManager.applyRedBlackShader(this.activePickupMesh);
        // }
        if(this.game.shaderManager.shaderState != 0){
            this.game.shaderManager.applyShader(this.activePickupMesh);
        }
        
    }

    createPickupParticleEffect(position) {
        let pickupParticleCount = 10;
        let pickupParticles = [];

        const glowTexture = new THREE.TextureLoader().load("resources/textures/glow3.png");
        glowTexture.wrapS = THREE.RepeatWrapping;
        glowTexture.wrapT = THREE.RepeatWrapping;

        for (let i = 0; i < pickupParticleCount; i++) {
            let geometry = new THREE.PlaneGeometry(1, 1);
            let colorComp = 1.0 - (Math.random() / 2.0);
            let color = new THREE.Vector4(0., colorComp, colorComp, 1.0);
            let scale = 1.;

            let velocity = new THREE.Vector3(
                2* Math.random() - 1,
                2* Math.random() - 1,
                2* Math.random() - 1 );

            let life = Math.random() + 0.5;
            let position = new THREE.Vector3(Math.random(), Math.random(), Math.random());

            let material = new THREE.ShaderMaterial({
                glslVersion:THREE.GLSL3,
                vertexShader: pickupVertexShader,
                fragmentShader: pickupFragmentShader,
                side: THREE.DoubleSide,
                transparent: true,
                uniforms: {
                    init_vel: {
                        value: velocity
                    },
                    g: {value: 10},
                    t:{value:0},
                    u_color: {value: color},
                    u_life : {value: life},
                    u_scale: {value: scale},
                    rand: {value:0},
                    glowTexture: {value: glowTexture},
                }
            });

            let particle = new Particle(geometry, velocity, color, life,scale, position, material);
            pickupParticles.push(particle);
        }

        this.activePickupParticleEmitter = new ParticleEmitter(pickupParticles);
        this.activePickupParticleEmitter.setParticleOffset(position);
        this.activePickupParticleEmitter.startEmitting(this.game.scene);

        this.game.particleEmitters.push(this.activePickupParticleEmitter);
    }


    destroyPickupParticle() {
        for (let i = 0; i < this.game.particleEmitters.length; i++) {
            if (this.game.particleEmitters[i] === this.activePickupParticleEmitter) {
                this.game.particleEmitters[i].destroyEmitter(this.game.scene);
                this.game.particleEmitters.splice(i, 1);
                break;
            }
        }

        setTimeout(() => {
            this.game.physics.removeRigidBody(this.activePickupMesh.userData.rb);
            this.game.scene.remove(this.activePickupMesh);
            this.activePickupMesh = null;
        }, 5000);
    }
}

export {PickupManager}