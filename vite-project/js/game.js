import {THREE} from "./LibImports.js"
import PostProcessing from "./PostProcessing.js"
import Skybox from "./Skybox.js"
import {Particle, ParticleEmitter} from "./ParticleSystem.js"
import TextureMaps from "./TextureBumpMapping.js"
import {ObjectMover} from "./ObjectMover.js";
import AnimatedObject from "./animatedObject.js";
import {createBox} from "./SceneHelpers.js";
import PathfindingAI from "./pathfinding.js"
import Physic from "./physic.js";
import SoundManager from "./SoundManager.js";

let t = 0.0;
let timeElapsed = 0;
let sunPosition = null;
let sunlight = null;

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

class Game {
  constructor() {

    
    this.settings = new Settings(this);

    initUI(this);
    this.canvas = document.querySelector("#glCanvas");

    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    /*const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      'resources/skybox/posx.jpg',
      'resources/skybox/negx.jpg',
      'resources/skybox/posy.jpg',
      'resources/skybox/negy.jpg',
      'resources/skybox/posz.jpg',
      'resources/skybox/negz.jpg',
    ]);
    this.scene.background = texture;*/ //new THREE.Color(0x000000);
    this.scene.background = new THREE.Color(0xffffff);

    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.rotation.order = 'YXZ';
    this.camera.position.set(0, 1, 0);

    this.renderer = new THREE.WebGLRenderer({ aliasing:true, canvas:this.canvas });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.postProcessing = new PostProcessing(this);
    this.particleEmitter = null;
    this.objectMover = new ObjectMover(this.scene, this.camera, this.renderer);

    this.animatableObjects = [];
    this.skybox = new Skybox(this);

    this.zombieAIs = [];

    this.STEPS_PER_FRAME = 5;
    this.cameraMoveSpeed = 25;
    this.playerVelocity = new THREE.Vector3();
    this.playerDirection = new THREE.Vector3();
    this.keyStates = {};



    this.settings.setEnvironmentQuality(Quality.HIGH);

    this.physics = new Physic(this.scene, this.camera);
    this.soundManager = new SoundManager(this);

  }

  async startGame() {
    await this.createSceneObjects();
    console.log("scene loaded!");
    this.setupEnemyAI();
    this.initEventListeners();
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
      this.keyStates[event.code] = true;
      this.objectMover.transformModeControls(event);
    });
    document.addEventListener('keyup', (event) => {
      this.keyStates[event.code] = false;
    });
    

    document.body.addEventListener('click', (event) => {
      if(uiState) return;
      
      if(!moveState){
        document.body.requestPointerLock();
        
      }else{
        this.objectMover.onMouseClick(event);
      }
      
    });
    
    document.body.addEventListener('mousemove', (event) => {
      if (document.pointerLockElement === document.body) {
        this.camera.rotation.y -= event.movementX * this.settings.horizontalSensitivity / 500;
        this.camera.rotation.x -= event.movementY * this.settings.verticalSensitivity / 500;
      }
    });

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

 
  updatePlayer(deltaTime) {
    let damping = Math.exp(-4 * deltaTime) - 1;
    this.playerVelocity.addScaledVector(this.playerVelocity, damping);

    const deltaPosition = this.playerVelocity.clone().multiplyScalar(deltaTime);
    this.camera.position.add(deltaPosition);

  }

  // Calculate forward direction for movement
  getForwardVector() {
    this.camera.getWorldDirection(this.playerDirection);
    this.playerDirection.y = 0;
    this.playerDirection.normalize();
    return this.playerDirection;
  }

  // Calculate side direction for movement
  getSideVector() {
    this.camera.getWorldDirection(this.playerDirection);
    this.playerDirection.y = 0;
    this.playerDirection.normalize();
    this.playerDirection.cross(this.camera.up);
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
                  console.log(child.material.color);
                  child.material.color.set(MOVABLE_TINT_COLOR);
                }
              })

              this.objectMover.addRayCastObject(obj.model);
            }
            resolve();
          });
    })
  }

  loadBasicObject(mesh) {
    this.physics.addPhysicsToBasicModels('box', mesh, mesh.position,
        new THREE.Vector3(mesh.geometry.parameters.width, mesh.geometry.parameters.height,
            mesh.geometry.parameters.depth), 0.0);
    this.scene.add(mesh);
  }

  async createSceneObjects() {
    const moonLight = new THREE.AmbientLight(0xffffff, 10);
    this.scene.add(moonLight);

    const scale = 0.25;
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

    this.loadBasicObject(createBox(PLAYGROUND_SIZE, 0.01, PLAYGROUND_SIZE,
        new THREE.Vector3(0, 0.01, 0), 0x00ff00));

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
        [0.0, 0.4 , -PLAYGROUND_SIZE / 5.0],
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
    this.scene.add(this.objectMover.rayCastableObjects);
  }


  createExampleSceneObjects() {
    let planeGeometry = new THREE.PlaneGeometry(100,100 )  ;
    let planeMaterial = new THREE.MeshStandardMaterial({color:0x00ff00});
    let planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeMesh.position.set(0,0,0);
    planeMesh.rotateX(-Math.PI/2.0);
    planeMesh.receiveShadow = true;
    this.scene.add(planeMesh);

    /*
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
    }

    this.particleEmitter = new ParticleEmitter(particles);

    this.particleEmitter.startEmitting(this.scene);

    const textureMaps = new TextureMaps("./resources/textures/TCom_Gore_512_albedo.png");

    const material = new THREE.MeshPhongMaterial({
      map: textureMaps.albedoMap,
      bumpMap: textureMaps.bumpMap,
      bumpScale:30,
    });


    const geometry = new THREE.BoxGeometry(
        1, 1,1);

    const brick = new THREE.Mesh(geometry, material);
    brick.position.z = -2;

    const l = new THREE.PointLight(0xffffff, 10);

    this.scene.add(brick);
    l.position.set(0, 0, 1);
    l.target = brick;
    this.scene.add(l);

    this.objectMover.addRayCastObject(brick);

    this.scene.add(this.objectMover.rayCastableObjects);*/

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
    const deltaTime = Math.min(0.05, this.clock.getDelta()) / this.STEPS_PER_FRAME;
    timeElapsed += deltaTime;
    t += deltaTime;

    for (let i = 0; i < this.STEPS_PER_FRAME; i++) {
      this.controls(deltaTime);
      this.updatePlayer(deltaTime);
    }

    for (let i = 0; i < this.animatableObjects.length; i++) {
      this.animatableObjects[i].update(deltaTime);
    }

    this.skybox.sunAnimate(timeElapsed);
    //this.particleEmitter.updateParticleTime(t);
    this.renderer.render(this.scene, this.camera);
    this.postProcessing.composer.render();
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

