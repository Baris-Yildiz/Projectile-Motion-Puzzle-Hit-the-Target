import * as THREE from 'three';
import {ObjectMover} from './ObjectMover.js';
class Game {
  constructor() {
    this.uiHandler = new UIHandler();
    this.uiHandler.CreateHelpMenu();

    this.canvas = document.querySelector("#glCanvas");

    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    //placeholder koydum https://jaxry.github.io/panorama-to-cubemap/ buradan kesilebilir
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      'resources/skybox/posx.jpg',
      'resources/skybox/negx.jpg',
      'resources/skybox/posy.jpg',
      'resources/skybox/negy.jpg',
      'resources/skybox/posz.jpg',
      'resources/skybox/negz.jpg',
    ]);
    this.scene.background = texture; //new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.rotation.order = 'YXZ';

    this.renderer = new THREE.WebGLRenderer({ aliasing:true, canvas:this.canvas });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    //document.body.appendChild(this.renderer.domElement);
    this.objectMover = new ObjectMover(this.scene, this.camera, this.renderer);
    this.STEPS_PER_FRAME = 5;
    this.cameraMoveSpeed = 25;
    this.playerVelocity = new THREE.Vector3();
    this.playerDirection = new THREE.Vector3();
    this.keyStates = {};

    
    this.createExampleSceneObjects();
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
        this.camera.rotation.y -= event.movementX / 500;
        this.camera.rotation.x -= event.movementY / 500;
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
    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    const material = new THREE.MeshBasicMaterial({color: 0x44aa88});
    const cube1 = new THREE.Mesh(geometry, material);
    cube1.position.z = -5;
    //const cube2 = new THREE.Mesh(geometry, material);
    //cube2.position.z = -10;

    this.objectMover.addRayCastObject(cube1);
    //this.objectMover.addRayCastObject(cube2);
    
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
    if (this.keyStates['Space']) {
      this.playerVelocity.y += speedDelta; 
    }
    if (this.keyStates['ShiftLeft'] || this.keyStates['ShiftRight']) {
      this.playerVelocity.y -= speedDelta; 
    }
  }

  
  animate() {
    const deltaTime = Math.min(0.05, this.clock.getDelta()) / this.STEPS_PER_FRAME;

    for (let i = 0; i < this.STEPS_PER_FRAME; i++) {
      this.controls(deltaTime);
      this.updatePlayer(deltaTime);
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate.bind(this));
  }
}

const game = new Game();


