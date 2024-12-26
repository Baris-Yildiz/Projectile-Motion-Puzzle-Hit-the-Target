import * as THREE from "three";
import {Sky} from "three/addons/objects/Sky.js";

// Bu metotlar Game classına konulmalıdır. animate() metotu zaten var, this.sunAnimate(deltaTime) çağırılmalıdır.
// skyInit() metotu ise scene oluşturulma aşamasında çağırılmalı (constructor)
// let ile tanımlanan değişkenler class memberı yapılabilir

let sunlight = null;
let sunPosition = null;
let timeElapsed = 0;
function skyInit() {

    this.renderer.shadowMap.enabled = true;

    let geometry = new THREE.BoxGeometry(1,1,1);
    let material = new THREE.MeshStandardMaterial({color:0xffffff});
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-1.5,-1,-2);
    mesh.castShadow = true;
    this.scene.add(mesh);

    let pgeometry = new THREE.PlaneGeometry(100,100 )  ;
    let pmaterial = new THREE.MeshStandardMaterial({color:0x00ff00});
    let pmesh = new THREE.Mesh(pgeometry, pmaterial);
    pmesh.position.set(-1.5,-1.5,-2);
    pmesh.rotateX(-Math.PI/2.0);
    pmesh.receiveShadow = true;
    this.scene.add(pmesh);

    sunlight = new THREE.DirectionalLight(0xffffff, 1);
    sunlight.position.set(0, 1, 0);
    sunlight.castShadow = true;
    sunlight.target = mesh;
    this.scene.add(sunlight);

    const sky = new Sky();
    sky.scale.setScalar( 450000 );

    sunPosition = new THREE.Vector3();

    const skyUniforms = sky.material.uniforms;
    skyUniforms['sunPosition'].value = sunPosition;
    skyUniforms['turbidity'].value = 0.2;
    skyUniforms['rayleigh'].value = 0.2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.2;

    let ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
    this.scene.add(ambientLight);

    this.scene.add( sky );
}

function sunAnimate(dt) {
    timeElapsed += dt;
    let sunRadius = 20;
    sunlight.intensity = Math.max(0, Math.sin(timeElapsed));
    sunPosition.set(Math.cos(timeElapsed) * sunRadius, Math.sin(timeElapsed) * sunRadius, 0);
    sunlight.position.set(Math.cos(timeElapsed) * sunRadius, Math.sin(timeElapsed) * sunRadius, 0);
}

function animate() {
    const deltaTime = Math.min(0.05, this.clock.getDelta()) / this.STEPS_PER_FRAME;
    //t += deltaTime;
    this.sunAnimate(deltaTime);

    for (let i = 0; i < this.STEPS_PER_FRAME; i++) {
        this.controls(deltaTime);
        this.updatePlayer(deltaTime);
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate.bind(this));
}