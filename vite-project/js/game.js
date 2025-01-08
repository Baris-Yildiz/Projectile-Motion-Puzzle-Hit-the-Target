import {THREE , GLTFLoader , FontLoader} from "./LibImports.js"
import PostProcessing from "./PostProcessing.js"
import Skybox from "./Skybox.js"
import {Particle, ParticleEmitter, smokeParticleVShader, smokeParticleFShader} from "./ParticleSystem.js"
import TextureMaps from "./TextureBumpMapping.js"
//import {ObjectMover} from "./ObjectMover.js";
import AnimatedObject from "./animatedObject.js";
import {createBox, rainTimer} from "./SceneHelpers.js";
import PathfindingAI from "./pathfinding.js"
import Physic from "./physic.js";
import SoundManager from "./SoundManager.js";
import { PlayerLoader } from './CharacterLoader.js';
import {ShadedPlane} from './shaderTest.js';
import {TextAdder} from './TextAdder.js';
import {ToonShaderManager} from './ToonShaderManager.js';

let t = 0.0;
let timeElapsed = 0;
let sunPosition = null;
let sunlight = null;

class Game {
  char1Path = 'resources/assets/olmusolsunlutfen/swat.gltf';
  char2Path = 'resources/assets/char1/char1.gltf';
  char3Path = 'resources/assets/char2/char2.gltf';
  char4Path = 'resources/assets/char5/teset.gltf';
  gunPath = 'resources/assets/gun/scene.gltf';
  playerState = true;
  renderCamera = undefined;
  nameState = false;
  constructor() {
    this.timeElapsed = 0.0;
    this.settings = new Settings(this);
    initUI(this);
    this.canvas = document.querySelector("#glCanvas");

    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    
    this.scene.background = new THREE.Color(0xffffff);
    //this.characterCamera  = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 800);
    //this.characterCamera.position.set(0, 0, 800);
    //this.characterCamera.userData.playerCamera = 'player';
    this.toonShaderManager = new ToonShaderManager();
    
   
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.rotation.order = 'YXZ';
    this.camera.position.set(0, 0, 1000);
    this.camera.userData.playerCamera = 'not player';
    this.renderCamera = this.camera;
    this.renderer = new THREE.WebGLRenderer({ aliasing:true, canvas:this.canvas });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.postProcessing = new PostProcessing(this);
    this.particleEmitters = [];
    //this.objectMover = new ObjectMover(this.scene, this.renderCamera, this.renderer);

    this.animatableObjects = [];
    this.skybox = new Skybox(this);

    this.zombieAIs = [];

    this.STEPS_PER_FRAME = 5;
    this.cameraMoveSpeed = 25;
    this.playerVelocity = new THREE.Vector3();
    this.playerDirection = new THREE.Vector3();
    this.keyStates = {};

    this.settings.setEnvironmentQuality(Quality.HIGH);

    this.physics = new Physic(this.scene, this.renderCamera);
    this.soundManager = new SoundManager(this);
    this.shadedPlane = new ShadedPlane(window.innerWidth, window.innerHeight, 0.03, 50);
    this.loader = new GLTFLoader();
    //loader, characterPath, gunPath, canvas, camera, offSet, aimOffSet, velocity, lookAtOffset, shadedPlane
    this.player = new PlayerLoader(this.loader, this.char2Path, this.gunPath, this.canvas, this.renderCamera,
      new THREE.Vector3(0, 1.5, -5/3), //offSet
      new THREE.Vector3(-0.3, 1.5, -1.2/4), //aimOffSet
      new THREE.Vector3(1 / 20, 0, 1 / 20), //velocity
      new THREE.Vector3(0, 25 / 10, 250 / 20), //lookAtOffset
      this.shadedPlane);
    this.scene.add(this.player.parent);
    this.scene.add(this.shadedPlane.mesh);

  }

  async startGame() {
    await this.createSceneObjects();
    this.setupEnemyAI();
    this.initEventListeners();
    this.player.character.traverse((child) => {
      if (child.isMesh) {
        console.log("Found a mesh:", child);
      }});

    this.animate();
    this.soundManager.playBackgroundMusic();
  }

  setupEnemyAI() {
    const zombie = new THREE.Mesh(new THREE.BoxGeometry(0.5,.5,.5,),
        new THREE.MeshBasicMaterial({color: 0xff0000}));
    zombie.position.set(-13, 0.5, 0);

    const player = new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5,),
        new THREE.MeshBasicMaterial({color: 0x00ff00}));
    player.position.set(0, 0.5, 0);

    this.scene.add(player);
    this.scene.add(zombie);

    let allMeshes = [];
    for (let i = 0; i < this.animatableObjects.length; i++) {
      for (let j = 0; j < this.animatableObjects[i].meshes.length; j++) {
        allMeshes.push(this.animatableObjects[i].meshes[j]);
      }
    }

    const zombieAI = new PathfindingAI(zombie, player, allMeshes, []);

    this.zombieAIs.push(zombieAI);
  }

  // Initialize event listeners for controls and window resize
  initEventListeners() {
    document.addEventListener('keydown', (event) => {
      if(event.key === 'p'){
        this.player.resetPlayer();
        this.keyStates = {};
        this.playerState = !this.playerState;
      }
      if(event.key === 'm' ){
        this.nameState = !this.nameState;
        this.playerState = !this.nameState;
        this.player.resetPlayer();
      }
      if(this.playerState){
        this.player.tps.onKeyDown(event);
      }
      else{
        this.keyStates[event.code] = true;
        //this.objectMover.transformModeControls(event);
      }
      
    });
    document.addEventListener('keyup', (event) => {
      if(this.playerState){
        this.player.tps.onKeyUp(event);
      }
      else{
        this.keyStates[event.code] = false;
      }
    });
    document.addEventListener('pointermove', (event) => {
      //console.log("pointer move")
      if(this.playerState){
        //console.log("player pointer is moving");
        this.player.tps.onMouseMoveTest(event);
      }
    });


    document.body.addEventListener('click', (event) => {
      if(uiState) return;
      
      if(!moveState){
        document.body.requestPointerLock();
        
      }else{
        //this.objectMover.onMouseClick(event);
      }
      
    });

    document.body.addEventListener('mousemove', (event) => {
      if(!this.playerState){
        if (document.pointerLockElement === document.body) {
          this.renderCamera.rotation.y -= event.movementX * this.settings.horizontalSensitivity / 500;
          this.renderCamera.rotation.x -= event.movementY * this.settings.verticalSensitivity / 500;
         }
      }
      
      
    });
    document.addEventListener('mousedown', (event) => {
      if(this.playerState){
        this.player.tps.onMousePress(event);
      }
    });
    document.addEventListener('mouseup', (event) => {
      if(this.playerState){
        this.player.tps.onMouseRelease(event);
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.code === 'KeyT') {
        
          this.toonShaderManager.toggleToonShader(this.scene);
      }
  });
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }


  onWindowResize() {
    this.renderCamera.aspect = window.innerWidth / window.innerHeight;
    this.renderCamera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.shadedPlane.resize(window.innerWidth, window.innerHeight);
  }


  updatePlayer(deltaTime) {
    let damping = Math.exp(-4 * deltaTime) - 1;
    this.playerVelocity.addScaledVector(this.playerVelocity, damping);

    const deltaPosition = this.playerVelocity.clone().multiplyScalar(deltaTime);
    this.renderCamera.position.add(deltaPosition);

  }

  // Calculate forward direction for movement
  getForwardVector() {
    this.renderCamera.getWorldDirection(this.playerDirection);
    this.playerDirection.y = 0;
    this.playerDirection.normalize();
    return this.playerDirection;
  }

  // Calculate side direction for movement
  getSideVector() {
    this.renderCamera.getWorldDirection(this.playerDirection);
    this.playerDirection.y = 0;
    this.playerDirection.normalize();
    this.playerDirection.cross(this.renderCamera.up);
    return this.playerDirection;
  }

  loadAnimatedObject(path, position, rotation, scale, mass,
                     movable = false) {
    return new Promise((resolve, reject) => {
      const MOVABLE_TINT_COLOR = 0xaaffaa;
          let obj = new AnimatedObject(this.scene, path, position, rotation, scale);
          obj.Load().then(() => {
            this.animatableObjects.push(obj);

            if (mass !== 0.0) {
              this.physics.addPhysicsToLoadedModel(obj.model, mass);
            }

            if (movable) {
              obj.model.traverse((child) => {
                if (child.isMesh) {
                  child.material.color.set(MOVABLE_TINT_COLOR);
                }
              })

              //this.objectMover.addRayCastObject(obj.model);
            }
            resolve();
          });
    })
  }



  loadBasicObject(mesh) {

    mesh.material.onBeforeRender = () => {
      rainTimer.x = this.clock.getElapsedTime();
    }

    this.physics.addPhysicsToBasicModels('box', mesh, mesh.position,
        new THREE.Vector3(mesh.geometry.parameters.width, mesh.geometry.parameters.height,
            mesh.geometry.parameters.depth), 0.0);
    this.scene.add(mesh);
  }

  async createSceneObjects() {
    const moonLight = new THREE.AmbientLight(0xffffff, 2);
    this.scene.add(moonLight);

    const scale = 0.4;
    const SCENE_SIZE = 200 * scale;
    const PLAYGROUND_SIZE = 50 * scale;
    const PAVEMENT_SIZE = 10 * scale;
    const BASKETBALL_COURT_SCALE = [0,0,0].fill(scale * 4);
    const OLD_CAR_SCALE = [0,0,0].fill(scale * 0.005  /0.25);
    const OLD_CAR2_SCALE = [0,0,0].fill(scale * 0.0125 /0.25);
    const BARRICADE_SCALE = [0,0,0].fill(scale * .75 /0.25);
    const ROAD_SIZE = 20 * scale;
    const BUILDINGS_SCALE = [0,0,0].fill(scale * 3.0);
   
    this.loadBasicObject(createBox(SCENE_SIZE, 0.01, SCENE_SIZE,
        new THREE.Vector3(0, 0, 0), 0xaaaaaa));

    let grassTextures = [
        'resources/textures/uncut_grass_oilpt20_1k/Uncut_Grass_oilpt20_1K_BaseColor.jpg',
        'resources/textures/uncut_grass_oilpt20_1k/Uncut_Grass_oilpt20_1K_Bump.jpg'
    ];

    this.loadBasicObject(createBox(PLAYGROUND_SIZE, 0.01, PLAYGROUND_SIZE,
        new THREE.Vector3(0, 0.01, 0), 0x00ff00, grassTextures));

    const pavementPositions = [(PLAYGROUND_SIZE + PAVEMENT_SIZE)/2.0,
      (PLAYGROUND_SIZE + PAVEMENT_SIZE)/-2.0
    ];

    const roadPositions = [(PLAYGROUND_SIZE + PAVEMENT_SIZE * 2 + ROAD_SIZE)/2.0,
      (PLAYGROUND_SIZE + PAVEMENT_SIZE * 2 + ROAD_SIZE)/-2.0
    ];

    let pavementTextures = [
      'resources/textures/worn_pavement_uddhdb1fw_1k/Worn_Pavement_uddhdb1fw_1K_BaseColor.jpg'
      , 'resources/textures/worn_pavement_uddhdb1fw_1k/Worn_Pavement_uddhdb1fw_1K_Bump.jpg'];

    let roadTextures = [
      'resources/textures/asphalt_road_th5mbefcw_1k/Asphalt_Road_th5mbefcw_1K_BaseColor.jpg'
      , 'resources/textures/asphalt_road_th5mbefcw_1k/Asphalt_Road_th5mbefcw_1K_Bump.jpg'];

    for (let i = 0; i < 4; i++) {

      this.loadBasicObject(createBox(PAVEMENT_SIZE, 0.01, PAVEMENT_SIZE,
          new THREE.Vector3(pavementPositions[i % 2] , 0.01,
              pavementPositions[i % 2]) , 0xdddddd, pavementTextures));

      this.loadBasicObject(createBox(PAVEMENT_SIZE, 0.01,PAVEMENT_SIZE,
          new THREE.Vector3(pavementPositions[i % 2] , 0.01,
              -pavementPositions[i % 2]) , 0xdddddd, pavementTextures));

      this.loadBasicObject(createBox(PAVEMENT_SIZE, 0.01, PLAYGROUND_SIZE,
          new THREE.Vector3(pavementPositions[i % 2], 0.01, 0), 0xdddddd, pavementTextures));

      this.loadBasicObject( createBox(PLAYGROUND_SIZE, 0.01, PAVEMENT_SIZE,
          new THREE.Vector3(0.0, 0.01, pavementPositions[i % 2]), 0xdddddd, pavementTextures));

      this.loadBasicObject( createBox(ROAD_SIZE, 0.01, PLAYGROUND_SIZE * 3,
          new THREE.Vector3(roadPositions[i % 2], 0.01, 0), 0xdddddd, roadTextures));

      this.loadBasicObject( createBox(PLAYGROUND_SIZE * 3, 0.01, ROAD_SIZE,
          new THREE.Vector3(0.0, 0.01, roadPositions[i % 2]), 0xdddddd, roadTextures));
    }

    await this.loadAnimatedObject('resources/assets/glbAssets/12_basketball__football_court.glb',
        [0.0, 0.4 * scale / 0.25 , -PLAYGROUND_SIZE / 5.0],
        [0, 0, 0],
        BASKETBALL_COURT_SCALE, 0.0);

    await this.loadAnimatedObject('resources/assets/OldCar1/scene.gltf',
        [-PAVEMENT_SIZE - PLAYGROUND_SIZE/2 - scale * 5.0, 0.1, 0.0],
        [0, Math.PI, 0],
        OLD_CAR_SCALE, 0.0);

    await this.loadAnimatedObject('resources/assets/glbAssets/wooden_branch_pcyee_low.glb',
        [-scale * 15.0, scale / 0.25 * 0.01 , -PLAYGROUND_SIZE/2 - PAVEMENT_SIZE - scale * 10.0 ],
        [0.0, Math.PI / 5.0, 0.0], [scale * 35, scale * 35, scale * 35], 1.0,
        true);
    
        await this.loadAnimatedObject('resources/assets/glbAssets/concrete_barrier_tlnwdhjfa_low.glb',
            [PLAYGROUND_SIZE / 2 + PAVEMENT_SIZE, scale / 0.25 * 0.01,
              -PLAYGROUND_SIZE/2 - PAVEMENT_SIZE - scale * 10.0 ],
            [0.0, Math.PI / 4.0, 0.0], [1, 1, 1], 0.0, true);

            for (let i = 0; i < 6; i++) {
              await this.loadAnimatedObject('resources/assets/Barricade/SM_vgledec_tier_3.gltf',
                  [-PLAYGROUND_SIZE/2 - PAVEMENT_SIZE - i * scale * 3.0 - scale * 2,
                    0.1, -PLAYGROUND_SIZE/2 - PAVEMENT_SIZE - ROAD_SIZE], [0, 0, 0],
                  BARRICADE_SCALE, 1.0, true);
            }

            await this.loadAnimatedObject(
                'resources/assets/glbAssets/buildings1.glb',
                [0.0, 0.01,
                  -PLAYGROUND_SIZE/2 - PAVEMENT_SIZE - ROAD_SIZE], [0, - Math.PI / 2.0, 0],
                BUILDINGS_SCALE, 0.0);

            await this.loadAnimatedObject(
                'resources/assets/glbAssets/buildings2.glb',
                [0.0, 0.01,
                  PLAYGROUND_SIZE/2 + PAVEMENT_SIZE + ROAD_SIZE], [0, Math.PI / 2.0, 0],
                BUILDINGS_SCALE, 0.0);

            await this.loadAnimatedObject(
                'resources/assets/glbAssets/buildings3.glb',
                [PLAYGROUND_SIZE/2 + PAVEMENT_SIZE + ROAD_SIZE,
                  0.01, scale * 40.0], [0, Math.PI, 0], BUILDINGS_SCALE, 0.0);

            await this.loadAnimatedObject(
                'resources/assets/glbAssets/buildings3.glb',
                [PLAYGROUND_SIZE/2 + PAVEMENT_SIZE + ROAD_SIZE,
                  0.01, -scale * 62.0], [0, Math.PI, 0], BUILDINGS_SCALE, 0.0);


            await this.loadAnimatedObject(
                'resources/assets/glbAssets/buildings3.glb',
                [-PLAYGROUND_SIZE/2 - PAVEMENT_SIZE - ROAD_SIZE,
                  0.01, scale * 10.0], [0, 0, 0], BUILDINGS_SCALE, 0.0);

            await this.loadAnimatedObject(
                'resources/assets/glbAssets/buildings3.glb',
                [-PLAYGROUND_SIZE/2 - PAVEMENT_SIZE - ROAD_SIZE,
                  0.01, -scale * 95.0], [0, 0, 0], BUILDINGS_SCALE, 0.0);

        await this.loadAnimatedObject(
            'resources/assets/glbAssets/dirty_lada_lowpoly_from_scan.glb',
            [0.0, scale / 0.25 * 0.5 , -PLAYGROUND_SIZE/2 - PAVEMENT_SIZE - scale * 10.0 ],
            [0.0, Math.PI / 4.0, Math.PI / 2.0], OLD_CAR2_SCALE, 0.0);

    this.physics.addWireframeToPhysicsObjects();
    //this.scene.add(this.objectMover.rayCastableObjects);
    //this.scene.clear();
    this.createText();


    //this.createParticleSystemInstances(scale);
  }
  createTextGroup(font, mat){
    let textGroup = new THREE.Group();
    let baris = new TextAdder('Baris Yildiz', font, 100, 8, 12, true, 4, 8, -2, 8, mat);
    let muzo = new TextAdder('Berke Savas', font, 100, 8, 12, true, 4, 8, -2, 8, mat);
    let said = new TextAdder('Said Cetin', font, 100, 8, 12, true, 4, 8, -2, 8, mat);
    let emre = new TextAdder('Emre Erdogan', font, 100, 8, 12, true, 4, 8, -2, 8, mat);
    baris.totalGroup.position.set(12, 0, 0);
    muzo.totalGroup.position.set(0, 0, 0);
    said.totalGroup.position.set(-12 , 0, 0);
    emre.totalGroup.position.set(-24, 0, 0);
    textGroup.add(baris.totalGroup , muzo.totalGroup , said.totalGroup , emre.totalGroup);
    textGroup.position.set(1000, 40, 0);
    console.log("hererere");
    console.log(muzo.textMesh.getWorldPosition(new THREE.Vector3()));
    console.log(baris.textMesh.getWorldPosition(new THREE.Vector3()));
    console.log(said.textMesh.getWorldPosition(new THREE.Vector3()));
    console.log(emre.textMesh.getWorldPosition(new THREE.Vector3()));
    
    textGroup.traverse((child) => {
      if(child.isMesh){
        child.scale.set(0.01, 0.01, 0.01);
        child.rotation.set(-Math.PI/2, 0, 0);
      }
    });
    return textGroup;
  }
  createText(){
    let fontLoader = new FontLoader();
    let mat = new THREE.MeshBasicMaterial({color: 0xff0000});
    let font = undefined;
    
    fontLoader.load('resources/assets/fonts/helvetiker_bold.typeface.json', (response) => {
        font = response;
        let group = this.createTextGroup(font, mat);
        this.scene.add(group);

    });
  }

  createParticleSystemInstances(scale) {
    let numberOfParticles = 250;
    let smokeParticles = [];

    const smokeTexture = new THREE.TextureLoader().load("resources/textures/smoke.png");
    smokeTexture.wrapS = THREE.RepeatWrapping;
    smokeTexture.wrapT = THREE.RepeatWrapping;

    for (let i = 0; i < numberOfParticles; i++) {
      let geometry = new THREE.SphereGeometry(2, 32 ,32);
      let colorComp = 1.0 - (Math.random() / 2.0);
      let color = new THREE.Vector4(colorComp, colorComp, colorComp, 1.0);
      let scale = 0.1;

      let divideBy = (numberOfParticles+1)/2.0;
      let velocity = new THREE.Vector3((i - divideBy)/divideBy,1,1);

      let life = Math.random() + 0.5;
      let position = new THREE.Vector3(Math.random(), Math.random(), -2);

      let material = new THREE.ShaderMaterial({
        glslVersion:THREE.GLSL3,
        vertexShader: smokeParticleVShader,
        fragmentShader: smokeParticleFShader,
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
          smokeTexture: {value: smokeTexture},
        }
      });

      let particle = new Particle(geometry, velocity, color, life,scale, position, material);
      smokeParticles.push(particle);
    }

    const smokeEmitter = new ParticleEmitter(smokeParticles);
    console.log(smokeEmitter);
    smokeEmitter.setParticleOffset(new THREE.Vector3(-11 * scale / 0.25, 0, scale));
    console.log(smokeEmitter);
    smokeEmitter.startEmitting(this.scene);

    this.particleEmitters.push(smokeEmitter);
  }

  controls(deltaTime) {
    const speedDelta = deltaTime * this.cameraMoveSpeed;

    if (this.keyStates['KeyW']) {
      this.playerVelocity.add(this.getForwardVector().multiplyScalar(speedDelta));
      this.soundManager.playWalkingSound();
    }
    if (this.keyStates['KeyS']) {
      this.playerVelocity.add(this.getForwardVector().multiplyScalar(-speedDelta));
      this.soundManager.playWalkingSound();

    }
    if (this.keyStates['KeyA']) {
      this.playerVelocity.add(this.getSideVector().multiplyScalar(-speedDelta));
      this.soundManager.playWalkingSound();

    }
    if (this.keyStates['KeyD']) {
      this.playerVelocity.add(this.getSideVector().multiplyScalar(speedDelta));
      this.soundManager.playWalkingSound();

    }
    if (this.keyStates['Space']) {
      this.playerVelocity.y += speedDelta;
    }
    if (this.keyStates['ShiftLeft'] || this.keyStates['ShiftRight']) {
      this.playerVelocity.y -= speedDelta;
    }
  }

  animate() {
    let d = this.clock.getDelta();
    const deltaTime = Math.min(0.05, d) / this.STEPS_PER_FRAME;
    timeElapsed += deltaTime;
    this.timeElapsed += deltaTime;
    t += deltaTime;


  


    if(this.nameState){
      this.renderCamera.position.lerp(new THREE.Vector3(994, 62, 12), 0.01);
      this.renderCamera.rotation.set(-1.0373973684276367, 
        -0.0002288740643072648, 
        1.7371262680459113e-18);
    }
    if(!this.playerState && !this.nameState){
      for (let i = 0; i < this.STEPS_PER_FRAME; i++) {
        this.controls(deltaTime);
        this.updatePlayer(deltaTime);
      }
    }
    

    for (let i = 0; i < this.animatableObjects.length; i++) {
      this.animatableObjects[i].update(deltaTime);
    }

    this.skybox.sunAnimate(timeElapsed);
    for (let i = 0; i < this.particleEmitters.length; i++) {
      this.particleEmitters[i].updateParticleTime(t);
    }
    if(this.playerState){
      this.player.characterMixer.update(d);
      this.player.animationControls.movementUpdate();
      this.player.tps.update(this.scene);
      this.player.tps.movementUpdate();
    }
    if (this.toonShaderManager.isToonEnabled) {
      this.toonShaderManager.updateLightPosition(this.scene, this.skybox.sunlight.position);
    }
    

    //console.log(this.renderCamera);
    this.shadedPlane.update(timeElapsed);
    this.renderer.render(this.scene, this.renderCamera);
    this.postProcessing.composer.render();
    this.postProcessing.updatePostProcessingTime(t);
    this.zombieAIs.forEach(zombieAI => zombieAI.update());
    this.physics.updatePhysics(deltaTime);

    requestAnimationFrame(this.animate.bind(this));

  }
}

let game = new Game();

export default game;

function initializeScene() {
  game.startGame();
  document.getElementById('playButton').style.display = 'none';

  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  progressContainer.style.display = 'block';

  const totalTime = 885; 
  const intervalTime = 55; 
  let elapsed = 0;

  const interval = setInterval(() => {
    elapsed += intervalTime;
    const progress = Math.min((elapsed / totalTime) * 100, 100);
    progressBar.style.width = `${progress}%`;

    if (progress >= 100) {
      clearInterval(interval);

      progressContainer.style.display = 'none';
      document.getElementById('loadingScreen').style.display = 'none';
      document.getElementById('screen').style.display = 'block';

      
    }
  }, intervalTime);
}

window.initializeScene = initializeScene;

