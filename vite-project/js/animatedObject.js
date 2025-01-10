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
        //this.addLights();
    }

    async Load() {
        const promise = await this.load(this.path,this.position,this.rotation,this.scale);
        console.log("model loaded!");
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
                        console.error('GLTF Yükleme Hatası:', error);
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
                        console.error('FBX Yükleme Hatası:', error);
                    }
                );
            } else {
                console.error('Desteklenmeyen dosya formatı:', extension);
            }
        })

    }

    setupModel(positions, rotations, scale) {
        // Modeli sahneye ekle ve transform uygula
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

        // Eğer modelde animasyon varsa mixer oluştur
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

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); //Yumuşak ışık
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }
}

export default AnimatedObject;

//          ----game.js constructor icinde kullanimi----

//         this.animatedObject1 = new AnimatedObject(this.scene, 'Models/DartBoard/dartboard_4k.gltf', [0, 0, 0], [0, 0, 0], [1, 1, 1]);
//         this.animatedObject2 = new AnimatedObject(this.scene, 'Models/dancingLeonardo/Silly Dancing.fbx', [5, 0, 0], [0, Math.PI / 4, 0], [0.01, 0.01, 0.01]);
//         this.animatedObject3 = new AnimatedObject(this.scene, 'Models/walkingman/Strut Walking.fbx', [10,0,0],[0,0,0],[0.01,0.01,0.01])

//          ---game.js animate() fonksiyonu icinde kullanimi---

//          this.animatedObject1.update(deltaTime);
//         this.animatedObject2.update(deltaTime);
//         this.animatedObject3.update(deltaTime);