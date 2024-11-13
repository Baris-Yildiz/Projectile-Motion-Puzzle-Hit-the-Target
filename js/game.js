import * as THREE from 'three';

class Game {
  constructor() {
    this.uiHandler = new UIHandler();
    this.uiHandler.CreateHelpMenu();

    this.canvas = document.querySelector("#glCanvas");

    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.rotation.order = 'YXZ';

    this.renderer = new THREE.WebGLRenderer({ aliasing:true, canvas:this.canvas });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    //document.body.appendChild(this.renderer.domElement);
    this.createExampleSceneObjects();
    
    this.STEPS_PER_FRAME = 5;
    this.cameraMoveSpeed = 25;
    this.playerVelocity = new THREE.Vector3();
    this.playerDirection = new THREE.Vector3();
    this.keyStates = {};

    this.initEventListeners();
    this.animate();
  }

  // Initialize event listeners for controls and window resize
  initEventListeners() {
    document.addEventListener('keydown', (event) => {
      this.keyStates[event.code] = true;
    });
    document.addEventListener('keyup', (event) => {
      this.keyStates[event.code] = false;
    });
    
    document.body.addEventListener('mousedown', () => {
      document.body.requestPointerLock();
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
    const cube = new THREE.Mesh(geometry, material);

    this.scene.add(cube);
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

    for (let i = 0; i < this.STEPS_PER_FRAME; i++) {
      this.controls(deltaTime);
      this.updatePlayer(deltaTime);
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate.bind(this));
  }
}

const game = new Game();

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
