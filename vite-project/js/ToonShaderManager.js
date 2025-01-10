import * as THREE from 'three';

//game'de this.toonShaderManager = new ToonShaderManager();
//ya butonla ya da klavye ile toggleToonShader , animate fonksiyonunda da updateLightPosition
//şu an T ile açılıp kapanıyor
export class ToonShaderManager {
    constructor() {
        this.toonMaterials = new Map();
        this.isToonEnabled = false;
        
        this.toonShader = {
            uniforms: {
                diffuse: { value: new THREE.Color(0xffffff) },
                lightPosition: { value: new THREE.Vector3(0, 1, 0) },
                opacity: { value: 1.0 },
                baseColorMap: { value: null }
            },
            vertexShader: toonVertexShader,
            fragmentShader: toonFragmentShader
        };
    }

    createToonMaterial(originalMaterial) {
        try {
            const materialColor = this.getMaterialColor(originalMaterial);
            
            const uniforms = THREE.UniformsUtils.merge([
                THREE.UniformsLib['skinning'],
                {
                    diffuse: { value: materialColor.clone() },
                    lightPosition: { value: new THREE.Vector3(0, 1, 0) },
                    opacity: { value: originalMaterial?.opacity ?? 1.0 },
                    baseColorMap: { value: originalMaterial?.map ?? null },
                    iTime: {value: 0.0}
                }
            ]);

            const defines = {};
            if (originalMaterial && originalMaterial.skinning) {
                defines.USE_SKINNING = '';
            }

            const toonMaterial = new THREE.ShaderMaterial({
                uniforms: uniforms,
                vertexShader: this.toonShader.vertexShader,
                fragmentShader: this.toonShader.fragmentShader,
                transparent: originalMaterial?.transparent ?? false,
                side: originalMaterial?.side ?? THREE.FrontSide,
                defines: defines
            });

            if (originalMaterial) {
                if (originalMaterial.map) {
                    toonMaterial.uniforms.baseColorMap.value = originalMaterial.map;
                }
            }

            toonMaterial.isToonShader = true;
            return toonMaterial;
        } catch (error) {
            console.error('Error creating toon material:', error);
            return new THREE.MeshBasicMaterial({ color: 0xcccccc });
        }
    }

    getMaterialColor(material) {
        if (!material) return new THREE.Color(0xcccccc);

        if (material.isMeshStandardMaterial) {
            const pbr = material.userData?.gltfExtensions?.KHR_materials_pbrMetallicRoughness;
            if (pbr?.baseColorFactor) {
                return new THREE.Color(pbr.baseColorFactor[0], pbr.baseColorFactor[1], pbr.baseColorFactor[2]);
            }
            return material.color.clone();
        }

        if (material.color && material.color.isColor) {
            return material.color.clone();
        }

        return new THREE.Color(0xcccccc);
    }

    shouldSkipObject(object) { //Object mover sıkıntılı
        if (!object || !object.parent) return true;
        
        const isTransformControl = 
            object.parent.isTransformControls || 
            object.parent.parent?.isTransformControls ||
            object.name.includes('helper') ||
            object.name.includes('gizmo') ||
            object.name.includes('picker') ||
            object.name.includes('plane');
            
        return isTransformControl;
    }

    applyToonShader(object) {
        if (!object.isMesh || this.shouldSkipObject(object) || object.material instanceof THREE.RawShaderMaterial) return;
        if (object.material?.isToonShader) return;

        if (!this.toonMaterials.has(object.uuid)) {
            this.toonMaterials.set(object.uuid, object.material);
        }

        if (Array.isArray(object.material)) {
            object.material = object.material.map(mat => this.createToonMaterial(mat));
        } else {
            object.material = this.createToonMaterial(object.material);
        }
    }

    restoreOriginalMaterial(object) {
        if (!object.isMesh || this.shouldSkipObject(object)) return;

        if (this.toonMaterials.has(object.uuid)) {
            object.material = this.toonMaterials.get(object.uuid);
            this.toonMaterials.delete(object.uuid);
        }
    }

    toggleToonShader(scene) {
        if (!scene) return;
        
        this.isToonEnabled = !this.isToonEnabled;
        
        scene.traverse((object) => {
            if (this.isToonEnabled && !object.userData.isParticle && !object.userData.isCollider) {
                this.applyToonShader(object);
            } else {
                this.restoreOriginalMaterial(object);
            }
        });
    }

    updateLightPosition(scene, position) {
        if (!this.isToonEnabled || !scene || !position) return;

        scene.traverse((object) => {
            if (!object.isMesh || this.shouldSkipObject(object)) return;
            
            if (object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                materials.forEach(material => {
                    if (material?.isToonShader && material.uniforms?.lightPosition) {
                        material.uniforms.lightPosition.value.copy(position);
                    }
                });
            }
        });
    }

    updateTime(scene, timeVal) {
        if (!this.isToonEnabled || !scene || !timeVal) return;

        scene.traverse((object) => {
            if (!object.isMesh || this.shouldSkipObject(object)) return;

            if (object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                materials.forEach(material => {
                    if (material?.isToonShader && material.uniforms?.iTime) {
                        material.uniforms.iTime.value = timeVal;
                    }
                });
            }
        });
    }
}