import {THREE} from "./LibImports.js";

class PathfindingAI {
    constructor(zombie, player, obstacles, otherZombies) {
        this.zombie = zombie; //zombi mesh
        this.player = player; //oyuncu mesh 
        this.obstacles = obstacles; //engeller: mesh array
        this.otherZombies = otherZombies; //diger zombie mashleri
        this.speed = 0.05;
        this.detectionRange = 20;
        this.avoidanceRange = 4;
        this.zombieAvoidanceRange = 3; //diger zombielerden ne kadar uzakta olsun
        this.lastValidPosition = zombie.position.clone();
        this.preferredDistance = 3;
        this.maxAvoidanceForce = 2;
        this.zombieAvoidanceForce = 1.5; 
        this.currentVelocity = new THREE.Vector3();
        this.smoothingFactor = 0.1;
        this.rotationSpeed = 0.1;
        this.currentRotation = new THREE.Quaternion();
        this.targetRotation = new THREE.Quaternion();
        
        this.hasSpottedPlayer = false;
        this.lastTimePlayerSeen = 0;
        this.chaseTimeout = 5000; //oyuncuyu goremedikten kac saniye sonra daha takip etsin
        this.raycaster = new THREE.Raycaster();

        this.wanderRadius = 4;
        this.wanderSpeed = 0.02;
        this.wanderTarget = this.getRandomWanderTarget();
        this.wanderDelay = 0;
        this.minWanderDelay = 2000; //geinirken yon degistirme saniyesi
        this.maxWanderDelay = 5000;
        this.lastWanderUpdate = Date.now();
        this.isWandering = true;
    }

    calculateZombieAvoidanceVector() {
        const avoidanceVector = new THREE.Vector3();
        
        for (const otherZombie of this.otherZombies) {
            // Skip if it's this zombie
            if (otherZombie === this.zombie) continue;
            
            const toThis = new THREE.Vector3()
                .subVectors(this.zombie.position, otherZombie.position);
            
            const distance = toThis.length();
            
            if (distance < this.zombieAvoidanceRange && distance > 0) {
                // Stronger avoidance when very close
                const strength = (this.zombieAvoidanceRange - distance) / this.zombieAvoidanceRange;
                avoidanceVector.add(
                    toThis.normalize().multiplyScalar(strength * this.zombieAvoidanceForce)
                );
            }
        }
        
        return avoidanceVector;
    }

    calculateTotalAvoidanceVector() {
        // Get obstacle avoidance
        const obstacleAvoidance = this.calculateAvoidanceVector();
        
        // Get zombie avoidance
        const zombieAvoidance = this.calculateZombieAvoidanceVector();
        
        // Combine both avoidance vectors
        return obstacleAvoidance.add(zombieAvoidance);
    }

    updateWandering() {
        const currentTime = Date.now();
        
        if (currentTime - this.lastWanderUpdate > this.wanderDelay) {
            const distanceToWanderTarget = this.zombie.position.distanceTo(this.wanderTarget);
            if (distanceToWanderTarget < 1 || this.isStuck()) {
                this.wanderTarget = this.getRandomWanderTarget();
                this.wanderDelay = Math.random() * (this.maxWanderDelay - this.minWanderDelay) + this.minWanderDelay;
                this.lastWanderUpdate = currentTime;
            }
        }

        const wanderDirection = new THREE.Vector3()
            .subVectors(this.wanderTarget, this.zombie.position)
            .normalize();

        const avoidanceVector = this.calculateTotalAvoidanceVector();
        
        const moveDirection = new THREE.Vector3()
            .addVectors(
                wanderDirection.multiplyScalar(1.0),
                avoidanceVector.multiplyScalar(0.8)
            )
            .normalize();

        const newPosition = this.zombie.position.clone()
            .add(moveDirection.multiplyScalar(this.wanderSpeed));

        if (!this.checkCollision(newPosition)) {
            this.zombie.position.copy(newPosition);
            this.lastValidPosition.copy(newPosition);
            this.updateRotation(moveDirection);
        } else {
            this.findAlternativePath();
        }
    }

    updateChasing() {
        const targetDirection = new THREE.Vector3()
            .subVectors(this.player.position, this.zombie.position)
            .normalize();

        const avoidanceVector = this.calculateTotalAvoidanceVector();
        
        const moveDirection = new THREE.Vector3()
            .addVectors(
                targetDirection.multiplyScalar(1.0),
                avoidanceVector.multiplyScalar(0.5)
            )
            .normalize();

        const newPosition = this.zombie.position.clone()
            .add(moveDirection.multiplyScalar(this.speed));

        if (!this.checkCollision(newPosition)) {
            this.zombie.position.copy(newPosition);
            this.lastValidPosition.copy(newPosition);
            this.updateRotation(moveDirection);
        } else {
            this.findAlternativePath();
        }
    }

    

    canSeePlayer() {
        const toPlayer = new THREE.Vector3().subVectors(this.player.position, this.zombie.position);
        const distance = toPlayer.length();

        // Check if player is within detection range
        if (distance > this.detectionRange) {
            return false;
        }

        // Set up raycaster for line of sight check
        this.raycaster.set(this.zombie.position, toPlayer.normalize());
        
        // Check for obstacles between zombie and player
        const intersects = this.raycaster.intersectObjects(this.obstacles);
        
        // If there are no obstacles, or the first obstacle is further than the player
        return intersects.length === 0 || intersects[0].distance > distance;
    }

    update() {
        const currentTime = Date.now();
        // Check if zombie can see player
        if (this.canSeePlayer()) {
            this.hasSpottedPlayer = true;
            this.lastTimePlayerSeen = currentTime;
            this.isWandering = false;
            this.updateChasing();
        } else {
            // If player was spotted but hasn't been seen for a while, return to wandering
            if (this.hasSpottedPlayer) {
                const timeSinceLastSeen = currentTime - this.lastTimePlayerSeen;
                if (timeSinceLastSeen > this.chaseTimeout) {
                    this.hasSpottedPlayer = false;
                    this.isWandering = true;
                    // Get new wander target when returning to wandering
                    this.wanderTarget = this.getRandomWanderTarget();
                } else {
                    // Continue chasing for a bit even though player isn't visible
                    this.updateChasing();
                }
            } else {
                this.updateWandering();
            }
        }
    }

    
    updateRotation(moveDirection) {
        const targetPosition = this.zombie.position.clone().add(moveDirection);
        this.zombie.matrix.lookAt(this.zombie.position, targetPosition, new THREE.Vector3(0, 1, 0));
        this.targetRotation.setFromRotationMatrix(this.zombie.matrix);
        this.currentRotation.copy(this.zombie.quaternion);
        this.zombie.quaternion.slerpQuaternions(
            this.currentRotation,
            this.targetRotation,
            this.rotationSpeed
        );
    }

    checkCollision(newPosition) {
        // Assuming obstacles is an array of objects with position and size properties
        for (let obstacle of this.obstacles) {
            const distance = newPosition.distanceTo(obstacle.position);
            if (distance < obstacle.size + this.zombie.size) {
                return true; // Collision detected
            }
        }
        return false; // No collision
    }
    
    

    getRandomWanderTarget() {
        const angle = Math.random() * Math.PI * 2;
        const radius = this.wanderRadius * (0.5 + Math.random() * 0.5);
        
        let target = new THREE.Vector3(
            this.zombie.position.x + Math.cos(angle) * radius,
            this.zombie.position.y,
            this.zombie.position.z + Math.sin(angle) * radius
        );

        // Keep within map bounds
        const boundaryLimit = 24;
        target.x = Math.max(-boundaryLimit, Math.min(boundaryLimit, target.x));
        target.z = Math.max(-boundaryLimit, Math.min(boundaryLimit, target.z));

        return target;
    }

    isStuck() {
        const moveThreshold = 0.01;
        return this.zombie.position.distanceTo(this.lastValidPosition) < moveThreshold;
    }

    calculateAvoidanceVector() {
        const avoidanceVector = new THREE.Vector3();
        
        for (const obstacle of this.obstacles) {
            const building = {
                minX: obstacle.geometry.boundingBox.min.x,
                minZ: obstacle.geometry.boundingBox.min.z,
                maxX: obstacle.geometry.boundingBox.max.x,
                maxZ: obstacle.geometry.boundingBox.max.z,
                /*
                minX: obstacle.position.x - obstacle.geometry.parameters.width/2,
                maxX: obstacle.position.x + obstacle.geometry.parameters.width/2,
                minZ: obstacle.position.z - obstacle.geometry.parameters.depth/2,
                maxZ: obstacle.position.z + obstacle.geometry.parameters.depth/2*/
            };

            // Calculate closest point on building to zombie
            const closestPoint = new THREE.Vector3(
                Math.max(building.minX, Math.min(this.zombie.position.x, building.maxX)),
                this.zombie.position.y,
                Math.max(building.minZ, Math.min(this.zombie.position.z, building.maxZ))
            );

            const toZombie = new THREE.Vector3()
                .subVectors(this.zombie.position, closestPoint);
            
            const distance = toZombie.length();
            
            if (distance < this.avoidanceRange) {
                const repulsionStrength = Math.pow(
                    1 - (distance / this.avoidanceRange),
                    2
                ) * this.maxAvoidanceForce;
                
                const closenessFactor = distance < this.preferredDistance ? 
                    (this.preferredDistance - distance) * 2 : 0;
                
                avoidanceVector.add(
                    toZombie.normalize().multiplyScalar(repulsionStrength + closenessFactor)
                );
            }
        }

        return avoidanceVector;
    }

    getClosestObstacleDistance() {
        let closestDistance = Infinity;
        for (const obstacle of this.obstacles) {
            const distance = this.zombie.position.distanceTo(obstacle.position);
            closestDistance = Math.min(closestDistance, distance);
        }
        return closestDistance;
    }

    calculateAvoidanceWeight(distance) {
        if (distance < this.preferredDistance) {
            return this.maxAvoidanceForce;
        } else if (distance < this.avoidanceRange) {
            return this.maxAvoidanceForce * 
                   Math.pow((this.avoidanceRange - distance) / 
                   (this.avoidanceRange - this.preferredDistance), 2);
        }
        return 0.5; 
    }

    isPositionSafe(position) {
        for (const obstacle of this.obstacles) {
            if (position.distanceTo(obstacle.position) < this.preferredDistance) {
                return false;
            }
        }
        return true;
    }

    findAlternativePath() {
        const toTarget = new THREE.Vector3()
            .subVectors(this.player.position, this.zombie.position);
        
        const angleStep = Math.PI / 8;
        const attempts = [];
        
        for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
            const direction = new THREE.Vector3(
                Math.cos(angle),
                0,
                Math.sin(angle)
            );
            
            attempts.push(direction.multiplyScalar(this.speed));
        }

        let bestPosition = null;
        let bestDistance = Infinity;
        
        for (const attempt of attempts) {
            const newPosition = this.zombie.position.clone().add(attempt);
            if (this.isPositionSafe(newPosition)) {
                const distanceToTarget = newPosition.distanceTo(this.player.position);
                if (distanceToTarget < bestDistance) {
                    bestDistance = distanceToTarget;
                    bestPosition = newPosition;
                }
            }
        }

        if (bestPosition) {
            this.zombie.position.copy(bestPosition);
        } else {
            this.zombie.position.copy(this.lastValidPosition);
        }
    }
    die() {
        document.getElementById("scoreDisplay").innerText = parseInt(document.getElementById("score").innerText) + 1;
    }
}

export default PathfindingAI;

//Game Class'ında
//Group da kullanılabilir
//const zombieAIs = [];
//const zombies = [];
//player ve zombie = mesh, obstacles = mesh array
//zombie class'ı varsa koyulabilir

//const zombieAI = new PathfindingAI(zombie, this.player, this.obstacles);
//this.zombieAIs.push(zombieAI);

//animate'e koyuyoruz
//this.zombieAIs.forEach(zombieAI => zombieAI.update());
