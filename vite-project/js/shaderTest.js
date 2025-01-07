import * as THREE from 'three';
export class ShadedPlane {
    constructor(innerHeight, innerWidth, radius, segments) {
        this.radius = radius;
        this.segments = segments;
        this.innerHeight = innerHeight;
        this.innerWidth = innerWidth;

        this.vertexShader = sparkleVertexShader;
        this.fragmentShader = sparkleFragmentShader;

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
