import {Ammo, THREE} from "./LibImports.js";

class Physic {
    constructor(scene, camera) {
        //this.soundManager = soundManager(constructor'a koy)
        this.scene = scene;
        this.camera = camera;
        this.initPhysics();
    }


    initPhysics() {
        // Discrete Dynamic World Construction
        this.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration);
        this.broadphase = new Ammo.btDbvtBroadphase();
        this.solver = new Ammo.btSequentialImpulseConstraintSolver();
        this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(
            this.dispatcher,
            this.broadphase,
            this.solver,
            this.collisionConfiguration
        );

        // Gravity
        this.physicsWorld.setGravity(new Ammo.btVector3(0, -9.8, 0));

        // Physical Object List
        this.rigidBodies = [];
    }

    createExampleSceneObjects() {
        // Ground
        this.createPhysicsBox(new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(10, 1, 10), 0, 0x888888);

        // Moving Boxes
        this.createPhysicsBox(new THREE.Vector3(0, 15, 0), new THREE.Vector3(1, 1, 1), 1, 0xff0000);
        this.createPhysicsBox(new THREE.Vector3(0.5, 0, 0), new THREE.Vector3(1, 1, 1), 1, 0xff0000);
    }

    createPhysicsBox(position, size, mass, color) {
        // Three.js geometrisini ve materyalini oluştur
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshPhongMaterial({ color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        this.scene.add(mesh);

        // Ammo.js fiziksel gövdesini oluştur
        const shape = new Ammo.btBoxShape(new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5));
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
        const motionState = new Ammo.btDefaultMotionState(transform);

        const localInertia = new Ammo.btVector3(0, 0, 0);
        shape.calculateLocalInertia(mass, localInertia);

        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
        const body = new Ammo.btRigidBody(rbInfo);

        // Fizik dünyasına ekle
        this.physicsWorld.addRigidBody(body);

        // Mesh ile fiziksel gövdeyi eşle
        mesh.userData.physicsBody = body;
        this.rigidBodies.push(mesh);

        return mesh;
    }

    ThrowSphere(sphere_radius, color, mass) {
        const radius = sphere_radius;
        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshStandardMaterial({ color: color });
        const sphere = new THREE.Mesh(geometry, material);

        const forwardVector = new THREE.Vector3();
        this.camera.getWorldDirection(forwardVector);

        // Determine where the ball will be rendered in the scene
        sphere.position.copy(this.camera.position);
        sphere.position.add(forwardVector.multiplyScalar(1));

        this.scene.add(sphere);

        // Add ball to physics world
        const sphereShape = new Ammo.btSphereShape(radius);
        const sphereTransform = new Ammo.btTransform();
        sphereTransform.setIdentity();
        sphereTransform.setOrigin(new Ammo.btVector3(sphere.position.x, sphere.position.y, sphere.position.z));

        const sphereMass = mass;
        const localInertia = new Ammo.btVector3(0, 0, 0);
        sphereShape.calculateLocalInertia(sphereMass, localInertia);

        const sphereMotionState = new Ammo.btDefaultMotionState(sphereTransform);
        const rbInfo = new Ammo.btRigidBodyConstructionInfo(sphereMass, sphereMotionState, sphereShape, localInertia);
        const sphereBody = new Ammo.btRigidBody(rbInfo);

        //Add speed to launch the ball forward
        sphereBody.setLinearVelocity(new Ammo.btVector3(forwardVector.x * 5, forwardVector.y * 5, forwardVector.z * 5));

        this.physicsWorld.addRigidBody(sphereBody);
        sphere.userData.physicsBody = sphereBody;
        this.rigidBodies.push(sphere);
        this.addWireframeToPhysicsObjects();
    }

    ShootBullet(bullet_model, bullet_mass) {
        //this.soundManager.playSFX(0);
        const shape = new Ammo.btConvexHullShape();

        // Reach Model Geometry
        bullet_model.traverse((child) => {
            if (child.isMesh) {
                const geometry = child.geometry;
                const positionArray = geometry.attributes.position.array;

                // Tüm vertexleri shape'e ekle
                for (let i = 0; i < positionArray.length; i += 3) {
                    const vertex = new Ammo.btVector3(positionArray[i], positionArray[i + 1], positionArray[i + 2]);
                    shape.addPoint(vertex, true);
                    Ammo.destroy(vertex);
                }
            }
        });

        const mass = bullet_mass;
        const localInertia = new Ammo.btVector3(0, 0, 0);
        shape.calculateLocalInertia(mass, localInertia);

        const transform = new Ammo.btTransform();
        transform.setIdentity();

        // Get camera's forward vector
        const forwardVector = new THREE.Vector3();
        this.camera.getWorldDirection(forwardVector);

        // Set the starting position in front of the camera
        const startPosition = new Ammo.btVector3(
            this.camera.position.x + forwardVector.x * 1.5, // Move the bullet forward a little
            this.camera.position.y + forwardVector.y * 1.5,
            this.camera.position.z + forwardVector.z * 1.5
        );
        transform.setOrigin(startPosition);
        Ammo.destroy(startPosition);

        // Rotate the bullet according to the camera's direction (You can add quaternion if necessary)
        const rotationQuaternion = new Ammo.btQuaternion(forwardVector.x, forwardVector.y, forwardVector.z, 1);
        transform.setRotation(rotationQuaternion);
        Ammo.destroy(rotationQuaternion);

        const motionState = new Ammo.btDefaultMotionState(transform);
        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
        const body = new Ammo.btRigidBody(rbInfo);

        // Accelerate the bullet according to the camera's direction
        const velocity = new Ammo.btVector3(
            forwardVector.x * 20,
            forwardVector.y * 20,
            forwardVector.z * 20
        );
        body.setLinearVelocity(velocity);
        Ammo.destroy(velocity);

        // Add to Physical Dynamic World
        this.physicsWorld.addRigidBody(body);
        bullet_model.userData.physicsBody = body;
        this.rigidBodies.push(bullet_model);

        Ammo.destroy(localInertia);
        Ammo.destroy(transform);
        Ammo.destroy(rbInfo);
    }

    updatePhysics(deltaTime) {  // Bu fonksyion animate icinde cagirilacak!
        this.physicsWorld.stepSimulation(deltaTime, 2);

        for (let i = 0; i < this.rigidBodies.length; i++) {
            const mesh = this.rigidBodies[i];
            const body = mesh.userData.physicsBody;

            if (!body) continue;

            const motionState = body.getMotionState();

            if (motionState) {
                const transform = new Ammo.btTransform();
                motionState.getWorldTransform(transform);
                const origin = transform.getOrigin();
                const rotation = transform.getRotation();

                mesh.position.set(origin.x(), origin.y(), origin.z());
                mesh.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());

            }
            //this.checkCollisions(mesh);
        }
    }

    addWireframeToPhysicsObjects() {
        this.rigidBodies.forEach((mesh) => {
            const geometry = mesh.geometry;
            const wireframeMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                wireframe: true
            });
            const wireframe = new THREE.Mesh(geometry, wireframeMaterial);
            mesh.add(wireframe);
        });
    }


    checkCollisions(mesh) {

        for (let i = 0; i < this.rigidBodies.length; i++) {
            if (mesh === this.rigidBodies[i]) continue;

            const otherMesh = this.rigidBodies[i];
            const distance = mesh.position.distanceTo(otherMesh.position);

            if (distance < 2) {
                if(mesh && mesh.material && mesh.material.color && otherMesh && otherMesh.material && otherMesh.material.color) {
                    mesh.material.color.set(0x00ff00);
                    otherMesh.material.color.set(0x00ff00);
                }
            }else {
                if(mesh && mesh.material && mesh.material.color && otherMesh && otherMesh.material && otherMesh.material.color) {
                    mesh.material.color.set(0xff0000);
                    otherMesh.material.color.set(0xff0000);
                }
            }
        }
    }

    addPhysicsToBasicModels(type, model, position, scale, model_mass) {
        if (type === 'box'){
            const boxSize = new Ammo.btVector3(scale.x , scale.y , scale.z ); // Instead of convex Hull Shape
            const shape = new Ammo.btBoxShape(boxSize);


            const transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));

            const mass = model_mass; // Models mass
            const localInertia = new Ammo.btVector3(0, 0, 0);
            shape.calculateLocalInertia(mass, localInertia);

            const motionState = new Ammo.btDefaultMotionState(transform);
            const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
            const body = new Ammo.btRigidBody(rbInfo);

            this.physicsWorld.addRigidBody(body);
            model.userData.physicsBody = body;
            this.rigidBodies.push(model);

        }else if(type === 'sphere'){

            const radius = scale[0]; // Takin radius from scale factor (The sphere has only one radius)
            const shape = new Ammo.btSphereShape(radius);

            const transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new Ammo.btVector3(position[0], position[1], position[2]));

            const mass = model_mass; // Modelin kütlesi
            const localInertia = new Ammo.btVector3(0, 0, 0);
            shape.calculateLocalInertia(mass, localInertia);

            const motionState = new Ammo.btDefaultMotionState(transform);
            const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
            const body = new Ammo.btRigidBody(rbInfo);

            this.physicsWorld.addRigidBody(body);
            model.userData.physicsBody = body;
            this.rigidBodies.push(model);

            // Cleaning the Memory
            Ammo.destroy(localInertia);
            Ammo.destroy(transform);
            Ammo.destroy(rbInfo);

        } // There can be more default shapes

    }

    addPhysicsToLoadedModel(model, model_mass) {
        // Creating Convex hull shape
        const shape = new Ammo.btConvexHullShape();

        // Reach the model geometry
        model.traverse((child) => {
            if (child.isMesh) {
                const geometry = child.geometry;
                const positionArray = geometry.attributes.position.array;


                // Add all vertexes to shape
                for (let i = 0; i < positionArray.length; i += 3) {
                    const vertex = new Ammo.btVector3(positionArray[i], positionArray[i + 1], positionArray[i + 2]);
                    shape.addPoint(vertex, true);
                    Ammo.destroy(vertex); // To prevent the memory leak delete the vertexes
                }
            }
        });

        //Determine the physical properties
        const mass = model_mass;
        const localInertia = new Ammo.btVector3(0, 0, 0);
        shape.calculateLocalInertia(mass, localInertia);

        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(
            model.position.x,
            model.position.y,
            model.position.z
        ));

        const motionState = new Ammo.btDefaultMotionState(transform);
        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
        const body = new Ammo.btRigidBody(rbInfo);

        // Add to the Physical World
        this.physicsWorld.addRigidBody(body);

        //Match the mesh and physical body
        model.userData.physicsBody = body;
        this.rigidBodies.push(model);

        // Clear the memory
        Ammo.destroy(localInertia);
        Ammo.destroy(transform);
        Ammo.destroy(rbInfo);
    }
}

export default Physic;

// document.body.addEventListener('click', () => {
//             this.ShootBullet(bullet_model, mass);        //Eklenmesi gerek initeventlistener'a
//         });