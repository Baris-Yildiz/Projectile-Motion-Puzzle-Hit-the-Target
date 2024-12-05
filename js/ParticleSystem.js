import * as THREE from "three";
/* Örnek kullanım:
Bu dosyadaki class kodlarının hepsini game.js e koymak gerekiyor çalışması için şimdilik.
Bu kodun update e yazılması gerekmiyor, scene oluşturulurken 1 kere yazılırsa yetiyor.

* let numberOfParticles = 250;

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
    }

    let emitter = new ParticleEmitter(particles);

    emitter.startEmitting(this.scene);
*
Bu kodun ise update e yazılması gerekiyor (deltaTime nerede arttırılıyorsa). Global bir t değişkenine ihtiyaç vardır. Bu değişken
particle ömrünü hesaplamak için kullanılıyor.
t += deltaTime;
* */
class ParticleEmitter {
    constructor(particles) {
        this.particles = particles;
    }

    startEmitting(scene) {
        for (let i = 0; i < this.particles.length; i++) {
            scene.add(this.particles[i].object);
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
                material = new THREE.ShaderMaterial()) {

        this.setGeometryAndMaterial(geometry, material);
        this.setVelocity(velocity);
        this.setScale(scale);
        this.setPosition(position);
        this.setColor(color);
        this.setLife(life);

        this.setOnBeforeRenderCallback(() => {
            this.material.uniforms.t.value = t
            this.material.uniforms.u_life.value = life - t;
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
}

const particleVShader = `
    uniform vec3 init_vel;
    uniform float g, t; 
    uniform vec4 u_color;
    uniform float u_life;
    uniform float u_scale;
    
    out vec4 o_color;
        
    void main()
    {
        if (t >= u_life) return;
        vec3 object_pos;
        object_pos.x = position.x + init_vel.x*t;
        object_pos.y = position.y + init_vel.y*t- g*t*t / 2.0;
        object_pos.z = position.z + init_vel.z*t;
        o_color = u_color;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(u_scale*object_pos, 1);
    }
`
const particleVShader2 = `
    uniform vec3 init_vel;
    uniform float g, t; 
    uniform vec4 u_color;
    uniform float u_life;
    uniform float rand;
    
    out vec4 o_color;
    
    float random(vec3 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
        
    void main()
    {
        if (u_life <= 0.0) return;
        
        vec3 object_pos;
        object_pos.x = position.x + rand * 3.0 * init_vel.x*t;
        object_pos.y = position.y + rand * 3.0 * init_vel.y*t*2.0;
        object_pos.z = position.z + init_vel.z*t;
        o_color = u_color;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(object_pos, 1);
    }
`

const particleFShader = `
    in vec4 o_color;
    out vec4 f_color;
    void main()
    {
       
       f_color = o_color;
    }
`