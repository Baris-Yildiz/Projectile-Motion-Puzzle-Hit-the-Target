import * as THREE from 'three';
export class ShadedPlane {
    constructor(innerHeight, innerWidth, radius, segments) {
        this.radius = radius;
        this.segments = segments;
        this.innerHeight = innerHeight;
        this.innerWidth = innerWidth;

        this.vertexShader = `
        precision mediump float;
        uniform mat4 projectionMatrix;
        uniform mat4 modelViewMatrix;
        uniform float iTime;

        in vec3 position;
        in vec2 uv;

        out vec2 vUv;

        // Function to generate pseudo-random numbers
        float rand(vec2 co) {
            return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vUv = uv;

            
            float stretchX = 1.0 + rand(position.xy + iTime) * 0.9; 
            float stretchY = 1.0 + rand(position.xy - iTime) * 1.2; 

            vec3 stretchedPosition = vec3(position.x * stretchX, position.y * stretchY, position.z);

            gl_Position = projectionMatrix * modelViewMatrix * vec4(stretchedPosition, 1.0);
        }
        `;

        this.fragmentShader = `
        precision mediump float;

        uniform vec2 iResolution;
        uniform float iTime;

        in vec2 vUv;
        out vec4 fragColor;

        float sdStar(in vec2 p, in float r, in float n, in float w) {
            float m = n + w * (2.0 - n);
            float an = 3.1415927 / n;
            float en = 3.1415927 / m;
            vec2 racs = r * vec2(cos(an), sin(an));
            vec2 ecs = vec2(cos(en), sin(en));

            p.x = abs(p.x);
            float bn = mod(atan(p.x, p.y), 2.0 * an) - an;
            p = length(p) * vec2(cos(bn * 2.0), abs(sin(bn*2.)));

            p -= racs;
            p += ecs * clamp(-dot(p, ecs), 0.0, racs.y / ecs.y);
            return length(p) * sign(p.x);
        }

        vec2 rotate(vec2 v, float a) {
            float s = sin(a);
            float c = cos(a);
            mat2 m = mat2(c, s, -s, c);
            return m * v;
        }
        float rand(vec2 co){
            return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453)+0.2;
        }

        void main() {
            vec2 fragCoord = vUv * iResolution;
            vec2 p = (2.0*fragCoord-iResolution.xy)/iResolution.y;
            vec2 rotatedP = rotate(p , 3.14/2.*iTime*3.);
            p = rotate(p , -3.14/2.*iTime);

            float d  = sdStar(p , 2. , 48. , 0.1);

            float d1 = sdStar(rotatedP , 2., 32. , 0.01);
            vec3 col = vec3(d1*d*(cos(iTime)-2.),d*d1*(sin(iTime)-2.)/4.,0)*iTime*50.;
            if(col.x < 0. && col.y < 0.){
                discard;
            }
            fragColor = vec4(col,1.);
        }
        `;

        this.uniforms = {
            iResolution: { value: new THREE.Vector2(this.innerWidth, this.innerHeight) },
            iTime: { value: 0.0 },
        };

        this.material = new THREE.RawShaderMaterial({
            glslVersion: THREE.GLSL3,
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            uniforms: this.uniforms,
        });

        this.geometry = new THREE.CircleGeometry(this.radius, this.segments);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
    }

    update(time) {
        this.uniforms.iTime.value = time;
    }

    resize(innerWidth, innerHeight) {
        this.innerWidth = innerWidth;
        this.innerHeight = innerHeight;
        this.uniforms.iResolution.value.set(innerWidth, innerHeight);
    }
}
