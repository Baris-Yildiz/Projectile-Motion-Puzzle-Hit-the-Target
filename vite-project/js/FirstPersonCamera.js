import * as THREE from 'three';

class FirstPersonCamera {
    constructor(camera, options = {}) {
        this.camera = camera;
        this.moveSpeed = options.moveSpeed || 25;
        this.verticalSensitivity = options.verticalSensitivity || 1;
        this.horizontalSensitivity = options.horizontalSensitivity || 1;
        this.stepsPerFrame = options.stepsPerFrame || 5;

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.keyStates = {};

        this.initControls();
    }

    initControls() {
        document.addEventListener('keydown', (event) => {
            this.keyStates[event.code] = true;
        });

        document.addEventListener('keyup', (event) => {
            this.keyStates[event.code] = false;
        });

        document.body.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement === document.body) {
                this.camera.rotation.y -= event.movementX * this.horizontalSensitivity / 500;
                this.camera.rotation.x -= event.movementY * this.verticalSensitivity / 500;
            }
        });

        document.body.addEventListener('click', () => {
            document.body.requestPointerLock();
        });
    }

    getForwardVector() {
        this.camera.getWorldDirection(this.direction);
        this.direction.y = 0;
        this.direction.normalize();
        return this.direction;
    }

    getSideVector() {
        this.camera.getWorldDirection(this.direction);
        this.direction.y = 0;
        this.direction.normalize();
        this.direction.cross(this.camera.up);
        return this.direction;
    }

    handleMovement(deltaTime) {
        const speedDelta = deltaTime * this.moveSpeed;

        if (this.keyStates['KeyW']) {
            this.velocity.add(this.getForwardVector().multiplyScalar(speedDelta));
        }
        if (this.keyStates['KeyS']) {
            this.velocity.add(this.getForwardVector().multiplyScalar(-speedDelta));
        }
        if (this.keyStates['KeyA']) {
            this.velocity.add(this.getSideVector().multiplyScalar(-speedDelta));
        }
        if (this.keyStates['KeyD']) {
            this.velocity.add(this.getSideVector().multiplyScalar(speedDelta));
        }
        if (this.keyStates['Space']) {
            this.velocity.y += speedDelta;
        }
        if (this.keyStates['ShiftLeft'] || this.keyStates['ShiftRight']) {
            this.velocity.y -= speedDelta;
        }
        if (this.keyStates['KeyZ']) {
            this.camera.rotation.z += speedDelta / 10.0;
        }
        if (this.keyStates['KeyX']) {
            this.camera.rotation.z -= speedDelta / 10.0;
        }
    }

    update(deltaTime) {
        const damping = Math.exp(-4 * deltaTime) - 1;
        this.velocity.addScaledVector(this.velocity, damping);

        const deltaPosition = this.velocity.clone().multiplyScalar(deltaTime);
        this.camera.position.add(deltaPosition);

        for (let i = 0; i < this.stepsPerFrame; i++) {
            this.handleMovement(deltaTime);
        }
    }

    setMoveSpeed(speed) {
        this.moveSpeed = speed;
    }

    setSensitivity(horizontal, vertical) {
        this.horizontalSensitivity = horizontal;
        this.verticalSensitivity = vertical;
    }
}

export default FirstPersonCamera;