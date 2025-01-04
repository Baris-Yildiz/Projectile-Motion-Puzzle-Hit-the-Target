import{THREE, Sky} from "./LibImports.js"

//In constructor: this.skybox = new Skybox(this);
//In update: this.skybox.sunAnimate(timeElapsed);
class Skybox {
    constructor(game) {
        this.sunlight = null;
        this.ambientLight = null;
        this.sunPosition = null;
        this.sky = null;
        this.game = game;

        this.skyInit();
    }

    skyInit() {

        this.game.renderer.shadowMap.enabled = true;

        let sunlight = new THREE.DirectionalLight(0xffffff, 100);
        sunlight.position.set(0, 1, 0);
        sunlight.castShadow = true;
        //sunlight.target = mesh;
        this.sunlight = sunlight;

        this.game.scene.add(sunlight);

        let sky = new Sky();
        sky.scale.setScalar( 450000 );


        this.sunPosition = new THREE.Vector3();

        sky.material.uniforms['sunPosition'].value = this.sunPosition;

        this.sky = sky;

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
        this.game.scene.add(this.ambientLight);

        this.game.scene.add( this.sky );
    }

    sunAnimate(timeElapsed) {
        let sunRadius = 20;
        this.sunlight.intensity = Math.max(0, Math.sin(timeElapsed));
        this.sunlight.position.set(Math.cos(timeElapsed) * sunRadius, Math.sin(timeElapsed) * sunRadius, 0);

        this.sunPosition.set(Math.cos(timeElapsed) * sunRadius, Math.sin(timeElapsed) * sunRadius, 0);
    }
}

export default Skybox;


