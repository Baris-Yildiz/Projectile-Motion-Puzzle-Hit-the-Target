import {THREE} from "./LibImports.js";
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

            this.particles[i].updateTime(time % this.particles[i].life);
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

const smokeParticleVShader = `
    uniform vec3 init_vel;
    uniform float g, t; 
    uniform vec4 u_color;
    uniform float u_life;
    uniform float rand;
    
    out vec4 o_color;
    out vec2 f_uv;
    
    float random(vec3 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
        
    void main()
    {
        if (u_life <= 0.0) return;
        f_uv = uv;
        vec3 object_pos;
        object_pos.x = position.x + rand * 3.0 * init_vel.x*t;
        object_pos.y = position.y + rand * 3.0 * init_vel.y*t*2.0;
        object_pos.z = position.z + init_vel.z*t;
        o_color = u_color;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(object_pos, 1);
    }
`

const smokeParticleFShader = `
    in vec4 o_color;
    in vec2 f_uv;
    
    out vec4 f_color;
    
    uniform sampler2D smokeTexture;
    void main()
    {
        vec2 UV = f_uv;

        vec2 distVector = UV - vec2(0.5, 0.5);
        float dist = length(distVector);

        if (dist > 0.25) {
            UV.x -= distVector.x * 0.4;
            UV.y -= distVector.y * 0.4;    
        }
        
        f_color = texture(smokeTexture, UV) * o_color;

    }
`

export {Particle, ParticleEmitter, smokeParticleVShader, smokeParticleFShader};

