import {THREE, GLTFLoader, FBXLoader} from "./LibImports.js"


class AnimatedObject {
    constructor(scene, path, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
        this.scene = scene;
        this.gltfLoader = new GLTFLoader();
        this.fbxLoader = new FBXLoader();
        this.mixer = null;
        this.path = path;
        this.rotation = rotation;
        this.position = position;
        this.scale = scale;
        this.meshes = [];
        this.boundingBox = null;
    }

    async Load() {
        await this.load(this.path,this.position,this.rotation,this.scale);
    }

    load(path, positions, rotations, scale) {
        return new Promise((resolve, reject) => {
            const extension = path.split('.').pop().toLowerCase();

            if (extension === 'gltf' || extension === 'glb') {

                this.gltfLoader.load(
                    path,
                    (gltf) => {
                        this.model = gltf.scene;
                        this.setupModel(positions, rotations, scale);
                        resolve(gltf);
                    },
                    undefined,
                    (error) => {
                        console.error('Failed to load GLTF:', error);
                        reject(error);
                    }
                );
            } else if (extension === 'fbx') {

                this.fbxLoader.load(
                    path,
                    (fbx) => {
                        this.model = fbx;
                        this.setupModel(positions, rotations, scale);
                    },
                    undefined,
                    (error) => {
                        console.error('Failed to load FBX:', error);
                    }
                );
            } else {
                console.error('Unexpected file extension:', extension);
            }
        })

    }

    setupModel(positions, rotations, scale) {
        this.scene.add(this.model);
        this.model.position.set(positions[0], positions[1], positions[2]);
        this.model.rotation.set(rotations[0], rotations[1], rotations[2]);
        this.model.scale.set(scale[0], scale[1], scale[2]);
        this.boundingBox = new THREE.Box3().setFromObject(this.model);

        this.model.traverse(
            (child) => {
            if (child.isMesh) {
                this.meshes.push(child);

                child.geometry.boundingBox.min.multiply(scale);
                child.geometry.boundingBox.max.multiply(scale);
                child.castShadow = true;
            }
        });

        if (this.model.animations && this.model.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.model);
            const action = this.mixer.clipAction(this.model.animations[0]);
            action.play();
        }
    }

    update(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }
}

export default AnimatedObject;