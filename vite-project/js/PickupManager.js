import {THREE} from "./LibImports.js";
import {Particle, ParticleEmitter} from "./ParticleSystem.js";

export class PickupManager {
    constructor(game) {
        this.game = game;
        this.pickupMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1,1,1),
            new THREE.MeshStandardMaterial({color: 0x0000ff})
        );
    }

    createPickupObject(position) {
        console.log(this.pickupMesh);
        const pickupMesh = this.pickupMesh.clone();
        pickupMesh.position.copy(position);

        this.game.physics.createBoxRigidBody(
            pickupMesh,
            1.
        );

        pickupMesh.userData.rb.setFactors(
            new THREE.Vector3(1,0,1),
            new THREE.Vector3(1,1,1)
        )

        this.createPickupParticleEffect(pickupMesh.position);
        this.game.scene.add(pickupMesh);
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

        const pickupParticleEmitter = new ParticleEmitter(pickupParticles);
        pickupParticleEmitter.setParticleOffset(position);
        pickupParticleEmitter.startEmitting(this.game.scene);

        this.game.particleEmitters.push(pickupParticleEmitter);
    }

    destroyPickupParticle() {
        
    }
}