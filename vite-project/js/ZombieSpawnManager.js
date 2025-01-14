import * as THREE from 'three';
import PathfindingAI  from './pathfinding.js';

//game class'ında this.zombieSpawnManager = new ZombieSpawnManager(this);
//animate fonksiyonunda this.zombieSpawnManager.update();
export class ZombieSpawnManager {
    constructor(game) {
        this.game = game;
        this.SPAWN_INTERVAL = 15000; //simdilik 15s
        this.SPAWN_RADIUS = 17; 
        this.lastSpawnTime = Date.now();
        this.MAX_ENEMY_COUNT = 5;
        this.game.obstacles = []; //obstacle ise yaramiyor gibi
        for(let i = 0; i < this.game.physics.colliders.length; i++){
            this.game.obstacles.push(this.game.physics.colliders[i].mesh);
        }
    }

    getRandomPosition() {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * this.SPAWN_RADIUS;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return new THREE.Vector3(x, 2, z);
    }

    checkCollision(position) {
        const tempBox = new THREE.Box3();
        const zombieSize = new THREE.Vector3(3, 3, 3); 
        tempBox.setFromCenterAndSize(position, zombieSize);

        for (const collider of this.game.physics.colliders) {
            const colliderBox = new THREE.Box3().setFromObject(collider.mesh);
            if (tempBox.intersectsBox(colliderBox)) {
                return true; 
            }
        }
        for (const enemy of this.game.enemies) {
            const enemyBox = new THREE.Box3().setFromObject(enemy);
            if (tempBox.intersectsBox(enemyBox)) {
                return true; 
            }
        }

        return false; 
    }

    

    spawnZombie() {
        if (this.game.enemies.length >= this.MAX_ENEMY_COUNT) {
            return;
        }
        let position = this.getRandomPosition();
        while(this.checkCollision(position)){
            position = this.getRandomPosition();
        }
        
        let enemy = new THREE.Mesh(
            new THREE.BoxGeometry(3, 3, 3),
            this.game.cubeMaterial
        );

        enemy.position.copy(position);
        
        this.game.enemies.push(enemy);
        this.game.scene.add(enemy);
        this.game.physics.createBoxRigidBody(enemy, 1.0);
        enemy.userData.rb.setFactors(new THREE.Vector3(1, 1, 1), new THREE.Vector3(1, 1, 1));

        let otherEnemies = this.game.enemies.slice();
        otherEnemies.splice(this.game.enemies.length - 1, 1);
        let zombieAI = new PathfindingAI(enemy, this.game.player.parent, this.game.physics.colliders.map(c => c.mesh), []);
        this.game.zombieAIs.push(zombieAI);

        // if (this.game.toonShaderManager.isToonEnabled) {
        //     this.game.toonShaderManager.applyToonShader(enemy);
        // } else if (this.game.redBlackShaderManager.isRedBlackEnabled) {
        //     this.game.redBlackShaderManager.applyRedBlackShader(enemy);
        // }
        if(this.game.shaderManager.shaderState != 0){
            this.game.shaderManager.applyShader(this.activePickupMesh);
        }

    }

    update() {
        const currentTime = Date.now();
        if (currentTime - this.lastSpawnTime >= this.SPAWN_INTERVAL) {
            while(this.game.enemies.length < this.MAX_ENEMY_COUNT){
                this.spawnZombie();
            }
            this.lastSpawnTime = currentTime;
        }
    }
}
