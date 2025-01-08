import {Ammo, THREE} from "./LibImports.js";

class Rigidbody {
    constructor(mesh, mass) {
        this.mesh = mesh;
        this.mass = mass;
    }

    createBoxRigidBody() {
        let mesh = this.mesh;
        let mass = this.mass;

        this.transform = new Ammo.btTransform();
        this.transform.setIdentity();
        this.transform.setOrigin(new Ammo.btVector3(mesh.position.x, mesh.position.y,
            mesh.position.z));
        this.transform.setRotation(new Ammo.btQuaternion(mesh.quaternion.x, mesh.quaternion.y,
            mesh.quaternion.z, mesh.quaternion.w));

        this.motionState = new Ammo.btDefaultMotionState(this.transform);
        const btSize = new Ammo.btVector3(mesh.scale.x * 0.5,
            mesh.scale.y * 0.5, mesh.scale.z * 0.5);
        this.shape = new Ammo.btBoxShape(btSize);
        this.shape.setMargin(0.05);

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
}

class Physics {
    constructor() {
        this.initPhysics();
        this.tempTransform = new Ammo.btTransform(0,0,0);
        this.rigidbodies = [];
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
    }

    createBoxRigidBody(mesh, mass) {
        let rigidBody = new Rigidbody(mesh, mass);
        rigidBody.createBoxRigidBody();
        this.physicsWorld.addRigidBody(rigidBody.body);
        mesh.userData.rb = rigidBody;

        this.rigidbodies.push({
            mesh: mesh,
            rigidBody: rigidBody
        })
    }

    updatePhysics (delta) {
        this.physicsWorld.stepSimulation(delta, 10);

        for (let i = 0; i < this.rigidbodies.length; i++) {
            this.rigidbodies[i].rigidBody.motionState.getWorldTransform(this.tempTransform);
            const pos = this.tempTransform.getOrigin();
            const quat = this.tempTransform.getRotation();
            const pos3 = new THREE.Vector3(pos.x(), pos.y(), pos.z());
            const quat3 = new THREE.Quaternion(quat.x(), quat.y(), quat.z(), quat.w());

            this.rigidbodies[i].mesh.position.copy(pos3);
            this.rigidbodies[i].mesh.quaternion.copy(quat3);
        }
    }
}

export {Physics}