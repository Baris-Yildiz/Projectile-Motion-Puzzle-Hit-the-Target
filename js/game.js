import {THREE} from "./LibImports.js"
import PostProcessing from "./PostProcessing.js"
import Skybox from "./Skybox.js"
import {Particle, ParticleEmitter} from "./ParticleSystem.js"
import TextureMaps from "./TextureBumpMapping.js"
import {ObjectMover} from "./ObjectMover.js";

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

    initUI(this);
    this.canvas = document.querySelector("#glCanvas");

    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    //placeholder koydum https://jaxry.github.io/panorama-to-cubemap/ buradan kesilebilir
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

    this.renderer = new THREE.WebGLRenderer({ aliasing:true, canvas:this.canvas });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    console.log(this.renderer.getContext());
    //document.body.appendChild(this.renderer.domElement);

    this.postProcessing = new PostProcessing(this);
    this.particleEmitter = null;
    this.objectMover = new ObjectMover(this.scene, this.camera, this.renderer);
    this.createExampleSceneObjects();
    this.skybox = new Skybox(this);
    
    this.STEPS_PER_FRAME = 5;
    this.cameraMoveSpeed = 25;
    this.playerVelocity = new THREE.Vector3();
    this.playerDirection = new THREE.Vector3();
    this.keyStates = {};


    //this.composer = this.setupPostProcessing();
    this.settings = new Settings(this);


    this.initEventListeners();
    this.animate();
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
      document.body.requestPointerLock();
      this.objectMover.onMouseClick(event);
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


  createExampleSceneObjects() {
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

    const textureMaps = new TextureMaps("./resources/textures/brickwall.jpg");

    const material = new THREE.MeshPhongMaterial({
      map: textureMaps.albedoMap,
      bumpMap: textureMaps.bumpMap,
      bumpScale:1,
      displacementMap: textureMaps.displacementMap,
      displacementScale:1,
      displacementBias:-1
    });


    const geometry = new THREE.BoxGeometry(1, 1, 1,
        512,512, 512);

    const brick = new THREE.Mesh(geometry, material);
    brick.position.z = -2;

    this.scene.add(brick);

    this.objectMover.addRayCastObject(brick);

    this.scene.add(this.objectMover.rayCastableObjects);

  }

  controls(deltaTime) {
    const speedDelta = deltaTime * this.cameraMoveSpeed;

    if (this.keyStates['KeyW']) {
      this.playerVelocity.add(this.getForwardVector().multiplyScalar(speedDelta));
    }
    if (this.keyStates['KeyS']) {
      this.playerVelocity.add(this.getForwardVector().multiplyScalar(-speedDelta));
    }
    if (this.keyStates['KeyA']) {
      this.playerVelocity.add(this.getSideVector().multiplyScalar(-speedDelta));
    }
    if (this.keyStates['KeyD']) {
      this.playerVelocity.add(this.getSideVector().multiplyScalar(speedDelta));
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

    this.skybox.sunAnimate(timeElapsed);
    this.particleEmitter.updateParticleTime(t);
    this.renderer.render(this.scene, this.camera);
    this.postProcessing.composer.render();

    requestAnimationFrame(this.animate.bind(this));
  }
}

let game = new Game();
export default game;

// demo
// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material1 = new THREE.MeshBasicMaterial({ color: 0xff0000 });
// const material2 = new THREE.MeshBasicMaterial({ color: 0x0000ff });

// const cube1 = new THREE.Mesh(geometry, material1);
// const cube2 = new THREE.Mesh(geometry, material2);


// cube1.position.x = -1.5;
// cube2.position.x = 1.5;


// game.scene.add(cube1);
// game.scene.add(cube2);
