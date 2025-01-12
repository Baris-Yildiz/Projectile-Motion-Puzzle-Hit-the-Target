import {THREE} from "./LibImports.js";


//zombieAI.getVelocity()
class PathfindingAI {
    constructor(zombie, player, obstacles, otherZombies) {
        this.zombie = zombie;
        this.player = player;
        this.obstacles = obstacles;
        this.otherZombies = otherZombies;
        this.speed = 0.05;
        this.wanderSpeed = 0.02;
        this.detectionRange = 200;
        this.avoidanceRange = 4;
        this.zombieAvoidanceRange = 3;
        this.preferredDistance = 3;
        this.maxAvoidanceForce = 2;
        this.zombieAvoidanceForce = 1.5;
        
        this.hasSpottedPlayer = false;
        this.lastTimePlayerSeen = 0;
        this.chaseTimeout = 5000;
        this.raycaster = new THREE.Raycaster();

        this.wanderRadius = 4;
        this.wanderTarget = this.getRandomWanderTarget();
        this.wanderDelay = 0;
        this.minWanderDelay = 2000;
        this.maxWanderDelay = 5000;
        this.lastWanderUpdate = Date.now();
        this.isWandering = true;
    }

    calculateZombieAvoidanceVector() {
        const avoidanceVector = new THREE.Vector3();
        
        for (const otherZombie of this.otherZombies) {
            if (otherZombie === this.zombie) continue;
            
            const toThis = new THREE.Vector3()
                .subVectors(this.zombie.position, otherZombie.position);
            
            const distance = toThis.length();
            
            if (distance < this.zombieAvoidanceRange && distance > 0) {
                const strength = (this.zombieAvoidanceRange - distance) / this.zombieAvoidanceRange;
                avoidanceVector.add(
                    toThis.normalize().multiplyScalar(strength * this.zombieAvoidanceForce)
                );
            }
        }
        
        return avoidanceVector;
    }

    calculateTotalAvoidanceVector() {
        const obstacleAvoidance = this.calculateAvoidanceVector();
        const zombieAvoidance = this.calculateZombieAvoidanceVector();
        return obstacleAvoidance.add(zombieAvoidance);
    }

    calculateWanderingVelocity() {
        const currentTime = Date.now();
        
        if (currentTime - this.lastWanderUpdate > this.wanderDelay) {
            const distanceToTarget = this.zombie.position.distanceTo(this.wanderTarget);
            if (distanceToTarget < 1) {
                this.wanderTarget = this.getRandomWanderTarget();
                this.wanderDelay = Math.random() * (this.maxWanderDelay - this.minWanderDelay) + this.minWanderDelay;
                this.lastWanderUpdate = currentTime;
            }
        }

        const wanderDirection = new THREE.Vector3()
            .subVectors(this.wanderTarget, this.zombie.position)
            .normalize();

        const avoidanceVector = this.calculateTotalAvoidanceVector();
        
        return new THREE.Vector3()
            .addVectors(
                wanderDirection.multiplyScalar(1.0),
                avoidanceVector.multiplyScalar(0.8)
            )
            .normalize()
            .multiplyScalar(this.wanderSpeed);
    }

    calculateChasingVelocity() {
        const targetDirection = new THREE.Vector3()
            .subVectors(this.player.position, this.zombie.position)
            .normalize();
        
        const avoidanceVector = this.calculateTotalAvoidanceVector();
        
        return new THREE.Vector3()
            .addVectors(
                targetDirection.multiplyScalar(1.0),
                new THREE.Vector3(0, 0, 0)
            )
            .normalize()
            .multiplyScalar(this.speed);
    }

    canSeePlayer() {
        const toPlayer = new THREE.Vector3().subVectors(this.player.position, this.zombie.position);
        const distance = Math.abs(toPlayer.length());

        if (distance > this.detectionRange) {
            return false;
        }
        return true;
        /*
        this.raycaster.set(this.zombie.position, toPlayer.normalize());
        const intersects = this.raycaster.intersectObjects(this.obstacles);
        
        return intersects.length === 0 || intersects[0].distance > distance;*/
    }

    // Returns current velocity vector that can be used for position updates
    getVelocity() {
        const currentTime = Date.now();
        
        if (this.canSeePlayer()) {
            //console.log("can see player");
            this.hasSpottedPlayer = true;
            this.lastTimePlayerSeen = currentTime;
            this.isWandering = false;
            return this.calculateChasingVelocity();
        } else {
            //console.log("can not see player");
            if (this.hasSpottedPlayer) {
                //console.log("has spotted player");
                const timeSinceLastSeen = currentTime - this.lastTimePlayerSeen;
                if (timeSinceLastSeen > this.chaseTimeout) {
                    //console.log("time since last seen > chase timeout");
                    this.hasSpottedPlayer = false;
                    this.isWandering = true;
                    this.wanderTarget = this.getRandomWanderTarget();
                    return this.calculateWanderingVelocity();
                } else {
                    //console.log("time since last seen < chase timeout");
                    return this.calculateChasingVelocity();
                }
            } else {
                //console.log("has not spotted player");
                return this.calculateWanderingVelocity();
            }
        }
    }

    calculateAvoidanceVector() {
        const avoidanceVector = new THREE.Vector3();
        
        for (const obstacle of this.obstacles) {
            const width = obstacle.geometry.parameters.width;
            const depth = obstacle.geometry.parameters.depth;

            const building = {
                minX: obstacle.position.x - width/2,
                maxX: obstacle.position.x + width/2,
                minZ: obstacle.position.z - depth/2,
                maxZ: obstacle.position.z + depth/2
            };

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

    getRandomWanderTarget() {
        const angle = Math.random() * Math.PI * 2;
        const radius = this.wanderRadius * (0.5 + Math.random() * 0.5);
        
        let target = new THREE.Vector3(
            this.zombie.position.x + Math.cos(angle) * radius,
            this.zombie.position.y,
            this.zombie.position.z + Math.sin(angle) * radius
        );

        const boundaryLimit = 24;
        target.x = Math.max(-boundaryLimit, Math.min(boundaryLimit, target.x));
        target.z = Math.max(-boundaryLimit, Math.min(boundaryLimit, target.z));

        return target;
    }
}

export default PathfindingAI;