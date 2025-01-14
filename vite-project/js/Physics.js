import {Ammo, THREE} from "./LibImports.js";

class Rigidbody {
    transform = null;
    motionState = null;
    shape = null;
    info = null;
    body = null;
    inertia = null;
    mesh = null;
    mass = null;
    shapeString = null;
    gotHit = false;
    hitCount = 0;
    maxHitCount = 100;
    pickup = false;
    player = false;
    dead = false;
    constructor() {
    }
    createKinematicBoxRigidBody(mesh) {
        this.transform = new Ammo.btTransform();
        this.transform.setIdentity();
        this.transform.setOrigin(new Ammo.btVector3(mesh.position.x, mesh.position.y, mesh.position.z));
        this.transform.setRotation(new Ammo.btQuaternion(mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w));
    
        this.motionState = new Ammo.btDefaultMotionState(this.transform);
    
        const btSize = new Ammo.btVector3(mesh.geometry.parameters.width * 0.5,
            mesh.geometry.parameters.height * 0.5, mesh.geometry.parameters.depth * 0.5);
        this.shape = new Ammo.btBoxShape(btSize);
        this.shape.setMargin(0.05);
        this.shapeString = "Box";
        this.info = new Ammo.btRigidBodyConstructionInfo(0, this.motionState, this.shape, new Ammo.btVector3(0, 0, 0));
        this.body = new Ammo.btRigidBody(this.info);

        this.body.setCollisionFlags(this.body.getCollisionFlags() || Ammo.btCollisionObject.CF_KINEMATIC_OBJECT);
        this.body.setActivationState(Ammo.DISABLE_DEACTIVATION);
        //console.log(this.body.isKinematicObject());
        //const isKinematic = (this.body.getCollisionFlags() && Ammo.btCollisionObject.CF_KINEMATIC_OBJECT) !== 0;
        //console.log("Is Kinematic:", isKinematic);
    
        Ammo.destroy(btSize);
    }
    setFactors(vec1, vec2){
        this.body.setLinearFactor(new Ammo.btVector3(vec1.x, vec1.y, vec1.z));
        this.body.setAngularFactor(new Ammo.btVector3(vec2.x, vec2.y, vec2.z));
    }
    moveKinematic(position , rotation){
        const transform = new Ammo.btTransform();
        this.body.getWorldTransform(transform);
        transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
        transform.setRotation(new Ammo.btQuaternion(rotation.x, rotation.y, rotation.z, rotation.w));
        this.body.setWorldTransform(transform);
        Ammo.destroy(transform);
    }

    createBoxRigidBody(mesh, mass) {
        this.mesh = mesh;
        this.mass = mass;
        this.transform = new Ammo.btTransform();
        this.transform.setIdentity();
        this.transform.setOrigin(new Ammo.btVector3(mesh.position.x, mesh.position.y,
            mesh.position.z));
        this.transform.setRotation(new Ammo.btQuaternion(mesh.quaternion.x, mesh.quaternion.y,
            mesh.quaternion.z, mesh.quaternion.w));

        this.motionState = new Ammo.btDefaultMotionState(this.transform);
        const btSize = new Ammo.btVector3(mesh.geometry.parameters.width * 0.5,
            mesh.geometry.parameters.height * 0.5, mesh.geometry.parameters.depth * 0.5);
        this.shape = new Ammo.btBoxShape(btSize);
        this.shape.setMargin(0.05);
        this.shapeString = "Box";
        this.inertia = new Ammo.btVector3(0,0,0);
        if (mass > 0) {
            this.shape.calculateLocalInertia(mass, this.inertia);
        }

        this.info = new Ammo.btRigidBodyConstructionInfo(
            mass, this.motionState, this.shape, this.inertia
        )

        this.body = new Ammo.btRigidBody(this.info);
        

        Ammo.destroy(btSize);
    }

    createSphereRigidBody(mesh, mass) {
        this.mesh = mesh;
        this.mass = mass;
        this.transform = new Ammo.btTransform();
        this.transform.setIdentity();
        this.transform.setOrigin(new Ammo.btVector3(mesh.position.x, mesh.position.y,
            mesh.position.z));
        this.transform.setRotation(new Ammo.btQuaternion(mesh.quaternion.x, mesh.quaternion.y,
            mesh.quaternion.z, mesh.quaternion.w));

        this.motionState = new Ammo.btDefaultMotionState(this.transform);

        this.shape = new Ammo.btSphereShape(mesh.geometry.parameters.radius);
        this.shape.setMargin(0.05);
        this.shapeString = "Sphere";

        this.inertia = new Ammo.btVector3(0,0,0);
        if (mass > 0) {
            this.shape.calculateLocalInertia(mass, this.inertia);
        }

        this.info = new Ammo.btRigidBodyConstructionInfo(
            mass, this.motionState, this.shape, this.inertia
        )

        this.body = new Ammo.btRigidBody(this.info);
        //console.log(this.body);
        //this.body.setLinearFactor(1,0,1);
    }
    setVelocity(velocity){
        //console.log(this.hitCount);
        if(this.hitCount <= this.maxHitCount){
            let scaler = 1 - (this.hitCount / this.maxHitCount);
            this.body.applyForce(new Ammo.btVector3(velocity.x * scaler, velocity.y * scaler, velocity.z * scaler));
            //console.log(scaler);
            //this.body.setLinearVelocity(new Ammo.btVector3(velocity.x * scaler, velocity.y * scaler, velocity.z * scaler));
        } 
        else{
            this.dead = true;
        }
    }
/*
    createRigidBodyForModel(model, mass) {
        let pos = model.position;
        let quaternion = model.quaternion;

        this.transform = new Ammo.btTransform();
        this.transform.setIdentity();
        this.transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        this.transform.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));

        this.motionState = new Ammo.btDefaultMotionState(this.transform);
        this.localInertia = new Ammo.btVector3(0, 0, 0);

        let verticePositions = model.children[0].geometry.attributes.position.array;

        let triangles = [];

        for (let i = 0; i < verticePositions.length; i+= 3) {
            triangles.push({
                x: verticePositions[i],
                y: verticePositions[i + 1],
                z: verticePositions[i + 2],
            });
        }
        console.log(model);

        let triangle, triangleMesh = new Ammo.btTriangleMesh();
        let a = new Ammo.btVector3(0, 0, 0);
        let b = new Ammo.btVector3(0, 0, 0);
        let c = new Ammo.btVector3(0, 0, 0);

        for (let i = 0; i < triangles.length - 3; i+= 3) {
            a.setX(triangles[i].x);
            a.setY(triangles[i].y);
            a.setZ(triangles[i].z);

            b.setX(triangles[i+1].x);
            b.setY(triangles[i+1].y);
            b.setZ(triangles[i+1].z);

            c.setX(triangles[i+2].x);
            c.setY(triangles[i+2].y);
            c.setZ(triangles[i+2].z);

            triangleMesh.addTriangle(a, b, c, true);
        }

        Ammo.destroy(a);
        Ammo.destroy(b);
        Ammo.destroy(c);

        this.shape = new Ammo.btConvexHullShape(triangleMesh, true);
        model.children[0].geometry.verticesNeedUpdate = true;

        this.shape.setMargin(0.05);
        this.shape.calculateLocalInertia(mass, this.localInertia);

        this.rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, this.motionState, this.shape, this.localInertia);
        this.body = new Ammo.btRigidBody(this.rbInfo);
    }*/
}

class Physics {
    constructor(game) {
        this.game = game;
        this.initPhysics();
        this.tempTransform = new Ammo.btTransform(0,0,0);
        this.rigidbodies = [];
        this.colliders = [];
        this.bullets = [];
    }

    initPhysics() {
        let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        let dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
        let broadphase = new Ammo.btDbvtBroadphase();
        let solver = new Ammo.btSequentialImpulseConstraintSolver();

        this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(
            dispatcher,
            broadphase,
            solver,
            collisionConfiguration
        );
        

        this.physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
        this.createGround();
        this.createWalls();
    }
    createGround() {
       
        const groundNormal = new Ammo.btVector3(0, 1, 0); 
        const groundHeight = 0; 
        const groundShape = new Ammo.btStaticPlaneShape(groundNormal, groundHeight);
        const groundTransform = new Ammo.btTransform();
        groundTransform.setIdentity();
        groundTransform.setOrigin(new Ammo.btVector3(0, 0, 0)); 
        const mass = 0;
        const inertia = new Ammo.btVector3(0, 0, 0); 
        const motionState = new Ammo.btDefaultMotionState(groundTransform);
        const groundInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, groundShape, inertia);
        
        const groundBody = new Ammo.btRigidBody(groundInfo);

        this.physicsWorld.addRigidBody(groundBody);
    }
    createWalls() {
        const walls = [
            { normal: new Ammo.btVector3(1, 0, 0), position: new Ammo.btVector3(-23, 0, 0), color: 0x999999 }, //Right wall
            { normal: new Ammo.btVector3(-1, 0, 0), position: new Ammo.btVector3(23, 0, 0), color: 0x999999 }, //Left wall
            { normal: new Ammo.btVector3(0, 0, 1), position: new Ammo.btVector3(0, 0, -24), color: 0x999999 }, //Back wall
            { normal: new Ammo.btVector3(0, 0, -1), position: new Ammo.btVector3(0, 0, 24), color: 0x999999 }  //Front wall
        ];

        for (const wall of walls) {
            const wallShape = new Ammo.btStaticPlaneShape(wall.normal, 0);
            const wallTransform = new Ammo.btTransform();
            wallTransform.setIdentity();
            wallTransform.setOrigin(wall.position);
            const motionState = new Ammo.btDefaultMotionState(wallTransform);
            const wallInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, wallShape, new Ammo.btVector3(0, 0, 0));
            const wallBody = new Ammo.btRigidBody(wallInfo);
            this.physicsWorld.addRigidBody(wallBody);

            //For Visuality

            const material = new THREE.MeshBasicMaterial({ color: wall.color, side: THREE.DoubleSide, opacity:0.5, transparent:true });
            const geometry = new THREE.PlaneGeometry(50, 10);
            const mesh = new THREE.Mesh(geometry, material);

            mesh.position.set(wall.position.x(), wall.position.y(), wall.position.z());

            if (wall.normal.x() !== 0) {
                mesh.rotation.y = Math.PI / 2;
            }

            this.game.scene.add(mesh);
            mesh.userData.isSceneWall = true;
        }
    }
    removeRigidBody(rigidBody) {
        if(!rigidBody.body || !rigidBody) return;
        let mesh = rigidBody.mesh;
        let mass = rigidBody.mass;
        this.rigidbodies.forEach((rb, index) => {
            if (rb.rigidBody === rigidBody) {
                this.rigidbodies.splice(index, 1);
            }
        });
        this.physicsWorld.removeRigidBody(rigidBody.body);
        if (rigidBody.motionState) Ammo.destroy(rigidBody.motionState);
        if (rigidBody.shape) Ammo.destroy(rigidBody.shape);
        if (rigidBody.inertia) Ammo.destroy(rigidBody.inertia);
        if (rigidBody.transform) Ammo.destroy(rigidBody.transform);
        if(rigidBody.info) Ammo.destroy(rigidBody.info);
        Ammo.destroy(rigidBody.body);
        rigidBody.motionState = null;
        rigidBody.shape = null;
        rigidBody.inertia = null;
        rigidBody.transform = null;
        rigidBody.body = null;
        rigidBody.info = null;
        rigidBody = null;
    }

    createBoxRigidBody(mesh, mass) {
        let rigidBody = new Rigidbody();
        rigidBody.createBoxRigidBody(mesh, mass);
        this.physicsWorld.addRigidBody(rigidBody.body);
        mesh.userData.rb = rigidBody;

        this.rigidbodies.push({
            mesh: mesh,
            rigidBody: rigidBody
        })

        this.colliders.push(
            {
                mesh: mesh,
                rigidBody: rigidBody
            }
        );
    }

    createKinematicCube(mesh) {
        const rigidBody = new Rigidbody();
        rigidBody.createKinematicBoxRigidBody(mesh);
        this.physicsWorld.addRigidBody(rigidBody.body);
        mesh.userData.rb = rigidBody;

        const pair = {
            mesh: mesh,
            rigidBody: rigidBody
        };

        this.rigidbodies.push(pair);
        this.colliders.push(pair);
    }

    

    ThrowSphere(sphere, mass, direction) {
        const bulletVelocityMultiplier = bulletVelocity;
        let rigidbody = new Rigidbody();
        rigidbody.createSphereRigidBody(sphere, mass);
        rigidbody.body.setLinearVelocity(new Ammo.btVector3(direction.x * bulletVelocityMultiplier,
            direction.y * bulletVelocityMultiplier, direction.z * bulletVelocityMultiplier));

        this.physicsWorld.addRigidBody(rigidbody.body);
        sphere.userData.rb = rigidbody;

        const pair = {mesh: sphere, rigidBody: rigidbody};
        this.rigidbodies.push(pair);
        this.bullets.push(pair);
    }


    applyInstantForce(index, x,y,z) {
        let force = new Ammo.btVector3(x,y,z);
        this.rigidbodies[index].rigidBody.body.applyCentralImpulse(force);
        Ammo.destroy(force);
    }

    applyInstantForceAtAPoint(index, fx, fy, fz, px, py, pz) {
        let force = new Ammo.btVector3(fx,fy,fz);
        let point = new Ammo.btVector3(px,py,pz);
        this.rigidbodies[index].rigidBody.body.applyForce(force, point);
        Ammo.destroy(force);
        Ammo.destroy(point);
    }
    detectCollision() {
        let dispatcher = this.physicsWorld.getDispatcher();
        let numManifolds = dispatcher.getNumManifolds();
        for (let i = 0; i < numManifolds; i++) {
            let contactManifold = dispatcher.getManifoldByIndexInternal(i);
            let rigidBodyA = contactManifold.getBody0();
            let rigidBodyB = contactManifold.getBody1();
            
            const isKinematic1 = (rigidBodyA.getCollisionFlags() && Ammo.btCollisionObject.CF_KINEMATIC_OBJECT) !== 0;
            const isKinematic2 = (rigidBodyB.getCollisionFlags() && Ammo.btCollisionObject.CF_KINEMATIC_OBJECT) !== 0;
            if(isKinematic1 || isKinematic2){
                continue;
            }
            let rb1  = undefined;
            let rb2 = undefined;
            for(let i = 0; i < this.rigidbodies.length; i++){
                if(this.rigidbodies[i].rigidBody.body.ptr === rigidBodyA.ptr){
                    rb1 = this.rigidbodies[i].rigidBody;
                }
                if(this.rigidbodies[i].rigidBody.body.ptr === rigidBodyB.ptr){
                    rb2 = this.rigidbodies[i].rigidBody;
                }
                if(rb1 && rb2){
                    break;
                }
            } 
            if(rb1 && rb2 && (rb1.shapeString === "Sphere" || rb2.shapeString === "Sphere")){
                //console.log("sphere collision");
                let numContacts = contactManifold.getNumContacts();
                for (let j = 0; j < numContacts; j++) {
                    let contactPoint = contactManifold.getContactPoint(j);
                    let distance = contactPoint.getDistance();
                    if (distance < 0.0) {
                        score++;
                        if(rb1.shapeString === "Box"){
                            rb1.hitCount++;
                            scoreText.innerText = 'Score: ' +  score;
                            scoreNeededForNextPickup--;
                        }
                        else if(rb2.shapeString === "Box"){
                            rb2.hitCount++;
                        }
                        if(rb1.pickup || rb2.pickup){
                            score -= 100;
                            bulletMass+=10;
                            bulletVelocity+=50;
                            shootFrequency-=50;
                            shootFrequency =  THREE.MathUtils.clamp(shootFrequency, 150, 250);
                            bulletVelocity = THREE.MathUtils.clamp(bulletVelocity, 100, 400);
                            bulletMass = THREE.MathUtils.clamp(bulletMass,10 , 400);
                            rb1.pickup = false;
                            rb2.pickup = false;
                            this.game.pickupManager.destroyPickupParticle();
                        }
                        scoreText.innerText = 'Score: ' +  score;

                    }
                }
            }
            /*           
            for (let i = 0; i < this.rigidbodies.length; i++) {
                let rbA = this.rigidbodies[i].rigidBody.body.ptr === rigidBodyA.ptr;
                let rbB = this.rigidbodies[i].rigidBody.body.ptr === rigidBodyB.ptr;
                let rbAShape = this.rigidbodies[i].rigidBody.shapeString;
                let rbBShape = this.rigidbodies[i].rigidBody.shapeString;
               
                if ((rbA && rbAShape === "Sphere") || (rbB && rbBShape === "Sphere")) {
                    let numContacts = contactManifold.getNumContacts();
                    console.log(rigidBodyA.ptr + " " + rigidBodyB.ptr);

                   
                    for (let j = 0; j < numContacts; j++) {
                        let contactPoint = contactManifold.getContactPoint(j);
                        let distance = contactPoint.getDistance();
                       // console.log(`Contact Point ${j} Distance: ${distance}`);
                        if (distance < 0.0) {
                            //console.log("Collision detected!");
                            this.rigidbodies[i].rigidBody.gotHit = true;
                        }
                    }
                    break;
                }
            }*/
        }
    }
    

    updatePhysics (delta) {
        this.physicsWorld.stepSimulation(delta, 10);

        for (let i = 0; i < this.rigidbodies.length; i++) {
            if(this.rigidbodies[i].rigidBody.player){
                continue;
            }
            if(this.rigidbodies[i].shapeString){
                this.rigidbodies[i].rigidBody.body.applyCentralForce(new Ammo.btVector3(0,10,0));
            }
            this.rigidbodies[i].rigidBody.motionState.getWorldTransform(this.tempTransform);
            const pos = this.tempTransform.getOrigin();
            const quat = this.tempTransform.getRotation();
            const pos3 = new THREE.Vector3(pos.x(), pos.y(), pos.z());
            const quat3 = new THREE.Quaternion(quat.x(), quat.y(), quat.z(), quat.w());

            this.rigidbodies[i].mesh.position.copy(pos3);
            this.rigidbodies[i].mesh.quaternion.copy(quat3);
        }
        this.detectCollision();
    }



}

export {Physics}