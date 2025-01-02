import {THREE} from "./LibImports.js";


// let particles = [new Particle(...), new Particle(...)];
// let emitter = new ParticleEmitter(particles);
// emitter.startEmitting(scene);
// at update:
// emitter.updateParticleTime(timeElapsed);

/* Example particles list instantiation
    let numberOfParticles = 250;

    let particles = [];

    for (let i = 0; i < numberOfParticles; i++) {
      let geometry = new THREE.SphereGeometry(Math.random());
      let divideBy = (numberOfParticles+1)/2.0;
      let velocity = new THREE.Vector3((i - divideBy)/divideBy,1,0);

      let color = new THREE.Vector4(0.5,0.5,0.5, Math.random() + 0.5);
      let life = 2;
      let scale = 0.25;
      let position = new THREE.Vector3(Math.random(), Math.random() - 1, -2);

      let material = new THREE.ShaderMaterial({
        glslVersion:THREE.GLSL3,
        vertexShader: particleVShader2,
        fragmentShader: particleFShader,
        transparent: true,
        uniforms: {
          init_vel: {
            value: velocity
          },
          g: {value: 10},
          t:{value:t},
          u_color: {value: color},
          u_life : {value: life},
          u_scale: {value: scale},
          rand: {value:0},
        }
      });

      let particle = new Particle(geometry, velocity, color, life,scale, position, material);
      particles.push(particle);
 */
//TODO: destroy particles when they die (u_life < 0)

class ParticleEmitter {
    constructor(particles) {
        this.particles = particles;
    }

    startEmitting(scene) {
        for (let i = 0; i < this.particles.length; i++) {
            scene.add(this.particles[i].object);
        }
    }

    updateParticleTime(time) {
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].updateTime(time);
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

