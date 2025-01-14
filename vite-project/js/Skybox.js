import{THREE, Sky} from "./LibImports.js"

//In constructor: this.skybox = new Skybox(this);
//In update: this.skybox.sunAnimate(timeElapsed);
class Skybox {
    constructor(game) {
        this.sunlight = null;
        this.ambientLight = null;
        this.sky = null;
        this.game = game;

        this.skyInit();
    }

    skyInit() {

        this.game.renderer.shadowMap.enabled = true;

        let sunlight = new THREE.DirectionalLight(0xffffff, 100);
        sunlight.position.set(0, 1, 0);
        sunlight.castShadow = true;

        sunlight.shadow.mapSize.width = 1024;
        sunlight.shadow.mapSize.height = 1024;

        sunlight.shadow.camera.left = -50;
        sunlight.shadow.camera.right = 50;
        sunlight.shadow.camera.top = 50;
        sunlight.shadow.camera.bottom = -50;
        sunlight.shadow.camera.far = 1000;

        sunlight.shadow.bias = -0.0005;

        //sunlight.target = mesh;
        this.sunlight = sunlight;

        this.game.scene.add(sunlight);

        let sky = new Sky();
        sky.scale.setScalar( 450000 );

        sky.material.uniforms['sunPosition'].value = this.sunlight.position;

        this.sky = sky;

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
        this.game.scene.add(this.ambientLight);

        this.game.scene.add( this.sky );
    }

    sunAnimate(timeElapsed) {
        let t = timeElapsed * 0.1;
        let sunRadius = 20;
        t = Math.PI / 1.25;
        this.sunlight.intensity = Math.max(0, Math.sin(t));
        this.sunlight.position.set(Math.cos(t) * sunRadius, Math.sin(t) * sunRadius, 0);
    }
}

export default Skybox;


