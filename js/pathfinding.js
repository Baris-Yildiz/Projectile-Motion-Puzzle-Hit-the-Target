class PathfindingAI {
    constructor(zombie, player, obstacles) {
        this.zombie = zombie;
        this.player = player;
        this.obstacles = obstacles;
        this.speed = 0.05;
        this.detectionRange = 20;
        this.avoidanceRange = 4;
        this.lastValidPosition = zombie.position.clone();
        this.preferredDistance = 3;
        this.maxAvoidanceForce = 2;
        this.currentVelocity = new THREE.Vector3();
        this.smoothingFactor = 0.1;

        // Wandering behavior parameters
        this.wanderRadius = 4;
        this.wanderSpeed = 0.02;
        this.wanderTarget = this.getRandomWanderTarget();
        this.wanderDelay = 0;
        this.minWanderDelay = 2000; // Minimum time to wait before changing direction (ms)
        this.maxWanderDelay = 5000; // Maximum time to wait before changing direction (ms)
        this.lastWanderUpdate = Date.now();
        this.isWandering = true;
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
    update() {
        const distanceToPlayer = this.zombie.position.distanceTo(this.player.position);
        
        // Switch between wandering and chasing based on player detection
        if (distanceToPlayer > this.detectionRange) {
            this.updateWandering();
        } else {
            this.isWandering = false;
            this.updateChasing();
        }
    }
    updateWandering() {
        const currentTime = Date.now();
        
        // Check if we need to update wander target
        if (currentTime - this.lastWanderUpdate > this.wanderDelay) {
            // Check if close to current wander target or stuck
            const distanceToWanderTarget = this.zombie.position.distanceTo(this.wanderTarget);
            if (distanceToWanderTarget < 1 || this.isStuck()) {
                this.wanderTarget = this.getRandomWanderTarget();
                this.wanderDelay = Math.random() * (this.maxWanderDelay - this.minWanderDelay) + this.minWanderDelay;
                this.lastWanderUpdate = currentTime;
            }
        }

        // Calculate direction to wander target
        const wanderDirection = new THREE.Vector3()
            .subVectors(this.wanderTarget, this.zombie.position)
            .normalize();

        // Add obstacle avoidance
        const avoidanceVector = this.calculateAvoidanceVector();
        
        // Combine wandering and avoidance
        const moveDirection = new THREE.Vector3()
            .addVectors(
                wanderDirection.multiplyScalar(1.0),
                avoidanceVector.multiplyScalar(0.8)
            )
            .normalize();

        // Move zombie
        const newPosition = this.zombie.position.clone()
            .add(moveDirection.multiplyScalar(this.wanderSpeed));

        if (!this.checkCollision(newPosition)) {
            this.zombie.position.copy(newPosition);
            this.lastValidPosition.copy(newPosition);
            
            // Make zombie face movement direction
            this.zombie.lookAt(
                this.zombie.position.clone().add(moveDirection)
            );
        } else {
            this.findAlternativePath();
        }
    }

    updateChasing() {
        const targetDirection = new THREE.Vector3()
            .subVectors(this.player.position, this.zombie.position)
            .normalize();

        const avoidanceVector = this.calculateAvoidanceVector();
        
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
            this.zombie.lookAt(
                this.zombie.position.clone().add(moveDirection)
            );
        } else {
            this.findAlternativePath();
        }
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
        const zombieRadius = 0.75;
        
        for (const obstacle of this.obstacles) {
            const building = {
                minX: obstacle.position.x - obstacle.geometry.parameters.width/2,
                maxX: obstacle.position.x + obstacle.geometry.parameters.width/2,
                minZ: obstacle.position.z - obstacle.geometry.parameters.depth/2,
                maxZ: obstacle.position.z + obstacle.geometry.parameters.depth/2
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
        return 0.5; // Base avoidance weight
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

        // Try each direction and choose the best one
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
            // If no good position found, maintain current position
            this.zombie.position.copy(this.lastValidPosition);
        }
    }
}

//Game Class'ında
//player ve zombie = mesh, obstacles = mesh array
//const zombieAI = new PathfindingAI(zombie, this.player, this.obstacles);
//this.zombieAIs.push(zombieAI);

//animate'e koyuyoruz
//this.zombieAIs.forEach(zombieAI => zombieAI.update());
