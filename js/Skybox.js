import * as THREE from "three";
import {Sky} from "three/addons/objects/Sky.js";

//Game constructor'da this.skybox = new Skybox(this);
//Game animate'de skybox.sunAnimate(timeElapsed);
class Skybox {
    constructor(game) {
        this.sunlight = null;
        this.ambientLight = null;
        this.sunPosition = null;
        this.timeElapsed = 0;
        this.game = game;
        this.sky = null;

        this.skyInit();
    }

    skyInit() {

        this.game.renderer.shadowMap.enabled = true;

        let geometry = new THREE.BoxGeometry(1,1,1);
        let material = new THREE.MeshStandardMaterial({color:0xffffff});
        let mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-1.5,-1,-2);
        mesh.castShadow = true;
        this.game.scene.add(mesh);

        let pgeometry = new THREE.PlaneGeometry(100,100 )  ;
        let pmaterial = new THREE.MeshStandardMaterial({color:0x00ff00});
        let pmesh = new THREE.Mesh(pgeometry, pmaterial);
        pmesh.position.set(-1.5,-1.5,-2);
        pmesh.rotateX(-Math.PI/2.0);
        pmesh.receiveShadow = true;
        this.game.scene.add(pmesh);

        let sunlight = new THREE.DirectionalLight(0xffffff, 1);
        sunlight.position.set(0, 1, 0);
        sunlight.castShadow = true;
        sunlight.target = mesh;
        this.sunlight = sunlight;

        this.game.scene.add(sunlight);

        let sky = new Sky();
        sky.scale.setScalar( 450000 );


        this.sunPosition = new THREE.Vector3();

        let skyUniforms = sky.material.uniforms;
        skyUniforms['sunPosition'].value = sunPosition;
        skyUniforms['turbidity'].value = 0.2;
        skyUniforms['rayleigh'].value = 0.2;
        skyUniforms['mieCoefficient'].value = 0.005;
        skyUniforms['mieDirectionalG'].value = 0.2;

        this.sky = sky;

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
        this.game.scene.add(this.ambientLight);

        this.game.scene.add( sky );
    }

    sunAnimate(timeElapsed) {
        let sunRadius = 20;
        this.sunlight.intensity = Math.max(0, Math.sin(timeElapsed));
        this.sunlight.position.set(Math.cos(timeElapsed) * sunRadius, Math.sin(timeElapsed) * sunRadius, 0);

        this.sunPosition.set(Math.cos(timeElapsed) * sunRadius, Math.sin(timeElapsed) * sunRadius, 0);
    }
}


