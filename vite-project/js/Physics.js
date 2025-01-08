import {Ammo, THREE} from "./LibImports.js";

class Rigidbody {
    constructor() {
    }

    createBoxRigidBody(mesh, mass) {
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

        let verticePositions = [];
        model.traverse((child) => {
            if (child.isMesh) {
                let arr = child.geometry.attributes.position.array;
                for (let i = 0; i < arr.length; i++) {
                    verticePositions.push(arr[i]);
                }
            }
        })

        let triangles = [];

        for (let i = 0; i < verticePositions.length; i+= 3) {
            triangles.push({
                x: verticePositions[i],
                y: verticePositions[i + 1],
                z: verticePositions[i + 2],
            });
        }
        console.log(model);
        console.log(triangles);
        console.log(model.scale);

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
        model.traverse((child) => {
            if (child.isMesh) {
                child.geometry.verticesNeedUpdate = true;
            }
        })

        this.shape.setMargin(0.05);
        this.shape.calculateLocalInertia(mass, this.localInertia);

        this.rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, this.motionState, this.shape, this.localInertia);
        this.body = new Ammo.btRigidBody(this.rbInfo);
    }*/
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
        let rigidBody = new Rigidbody();
        rigidBody.createBoxRigidBody(mesh, mass);
        this.physicsWorld.addRigidBody(rigidBody.body);
        mesh.userData.rb = rigidBody;

        this.rigidbodies.push({
            mesh: mesh,
            rigidBody: rigidBody
        })
    }

    createModelRigidBody(model, mass) {

        let rigidBody = new Rigidbody();
        rigidBody.createRigidBodyForModel(model, mass)
        this.physicsWorld.addRigidBody(rigidBody.body);
        model.userData.rb = rigidBody;

        this.rigidbodies.push({
            mesh: model,
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