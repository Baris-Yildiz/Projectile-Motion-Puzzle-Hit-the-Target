import {THREE} from "./LibImports.js";

class ParticleEmitter {
    constructor(particles) {
        this.particles = particles;
    }

    setParticleOffset(offset) {
        for (let i = 0; i < this.particles.length; i++) {
            let particle = this.particles[i];
            this.particles[i].setPosition(particle.position.add(offset));
        }
    }

    startEmitting(scene) {
        for (let i = 0; i < this.particles.length; i++) {
            scene.add(this.particles[i].object);
        }
    }

    updateParticleTime(time) {
        for (let i = 0; i < this.particles.length; i++) {

            this.particles[i].updateTime(time % this.particles[i].life);
        }
    }

    destroyEmitter(scene) {
        for (let i = 0; i < this.particles.length; i++) {
            scene.remove(this.particles[i].object);
        }
    }
}
class Particle {
    constructor(geometry = new THREE.PlaneGeometry(1,1),
                velocity = new THREE.Vector3(0, 0, 0),
                color = new THREE.Vector4(0, 0, 0, 1),
                life = 1,
                scale = 1,
                position = new THREE.Vector3(0, 0, -2),
                material = new THREE.ShaderMaterial(),
                t = 0.0) {

        this.t = t;
        this.setGeometryAndMaterial(geometry, material);
        this.setVelocity(velocity);
        this.setScale(scale);
        this.setPosition(position);
        this.setColor(color);
        this.setLife(life);

        this.setOnBeforeRenderCallback(() => {
            this.material.uniforms.t.value = this.t;
            this.material.uniforms.u_life.value = this.life - this.t;
        });

        this.material.uniforms.rand.value = 1 + (Math.random()*2);
    }

    setOnBeforeRenderCallback(callback) {
        this.object.onBeforeRender = callback;
    }

    setGeometryAndMaterial(geo, material) {
        this.geometry = geo;
        this.material = material;
        this.object = new THREE.Mesh(this.geometry, this.material);
        this.object.userData.isParticle = true;

    }
    setLife(value) {
        this.life = value;
        this.material.uniforms.u_life.value = this.life;
    }

    setColor(value) {
        this.color = value;
        this.material.uniforms.u_color.value.copy(this.color);
    }

    setVelocity(value) {
        this.velocity = value;
        this.material.uniforms.init_vel.value.copy(this.velocity);
    }

    setScale(value) {
        this.scale = value;
        this.object.scale.copy(new THREE.Vector3(this.scale, this.scale, this.scale));
    }

    setPosition(value) {
        this.position = value;
        this.object.position.copy(this.position);
        this.material.uniforms.position = this.position;
    }

    updateTime(value) {
        this.t = value;
    }
}





export {Particle, ParticleEmitter};

