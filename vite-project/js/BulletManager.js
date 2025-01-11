import {THREE} from "./LibImports.js";

export class BulletManager {
    constructor(game) {
        this.game = game;
        this.bulletModel = null;
        this.bulletCollider = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 16, 16),
            new THREE.MeshStandardMaterial({color: 0xffffff})
        );
        this.bulletCollider.material.visible = false;
    }

    setBullet(model) {
        this.bulletModel = model;

        this.bulletModel.traverse((child) => {
            if (child.isMesh) {
                this.bulletCollider.attach(child);
            }
        });
    }

    shootBullet(time) {
        const direction = new THREE.Vector3(0, 0, 0);
        this.game.camera.getWorldDirection(direction);

        let cloneBullet = this.bulletCollider.clone();
        cloneBullet.lookAt(direction);

        cloneBullet.position.copy(this.game.shadedPlane.mesh.getWorldPosition(new THREE.Vector3(0, 0, 0)));
        cloneBullet.position.add(direction.multiplyScalar(
            cloneBullet.geometry.parameters.radius* 2));
        this.game.scene.add(cloneBullet);
        this.game.physics.ThrowSphere(cloneBullet, bulletMass, direction);
        setTimeout(() => {
            this.game.physics.removeRigidBody(cloneBullet.userData.rb);
            this.game.scene.remove(cloneBullet);
        }, time);
    }
}