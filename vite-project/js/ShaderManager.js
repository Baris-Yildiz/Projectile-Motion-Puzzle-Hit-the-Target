import * as THREE from 'three';


//Normal 0,Toon 1,RedBlack 2,Random 3
export class ShaderManager {
    constructor() {
        this.shaderState = 0;
        this.oldMaterials = new Map();
        this.isToonEnabled = false;
        
        this.currentShader = {
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

    createMaterial(originalMaterial) {
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
                vertexShader: this.currentShader.vertexShader,
                fragmentShader: this.currentShader.fragmentShader,
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
            object.name.includes('playerCollider') ||
            object.name.includes('plane');
            
        return isTransformControl;
    }

    applyShader(object) {
        //if(object === undefined) return;
        if (!object.isMesh || this.shouldSkipObject(object) || object.material instanceof THREE.RawShaderMaterial) return;
        //if (object.material?.isToonShader) return;

        if (!this.oldMaterials.has(object.uuid)) {
            this.oldMaterials.set(object.uuid, object.material);
        }

        if (Array.isArray(object.material)) {
            object.material = object.material.map(mat => this.createMaterial(mat));
        } else {
            object.material = this.createMaterial(object.material);
        }
    }

    restoreOriginalMaterial(object) {
        if (!object.isMesh || this.shouldSkipObject(object)) return;

        if (this.oldMaterials.has(object.uuid)) {
            object.material = this.oldMaterials.get(object.uuid);
            this.oldMaterials.delete(object.uuid);
        }
    }

    toggleShader(scene) {
        if (!scene) return;
        
        this.shaderState = (this.shaderState +1) % 4;
        if(this.shaderState == 1){
            this.currentShader = {
                uniforms: {
                    diffuse: { value: new THREE.Color(0xffffff) },
                    lightPosition: { value: new THREE.Vector3(0, 1, 0) },
                    opacity: { value: 1.0 },
                    baseColorMap: { value: null }
                },
                vertexShader: toonVertexShader,
                fragmentShader: toonFragmentShader
            };
        }else if(this.shaderState == 2){
            this.currentShader = {
                uniforms: {
                    diffuse: { value: new THREE.Color(0xffffff) },
                    lightPosition: { value: new THREE.Vector3(0, 1, 0) },
                    opacity: { value: 1.0 },
                    baseColorMap: { value: null }
                },
                vertexShader: redBlackVertexShader,
                fragmentShader: redBlackFragmentShader
            }
        }else if(this.shaderState == 3){
            this.currentShader = {
                uniforms: {
                    diffuse: { value: new THREE.Color(0xffffff) },
                    lightPosition: { value: new THREE.Vector3(0, 1, 0) },
                    opacity: { value: 1.0 },
                    baseColorMap: { value: null }
                },
                vertexShader: redBlackVertexShader,
                fragmentShader: randomFragmentShader
            }
        };
        scene.traverse((object) => {
            if (this.shaderState != 0 && !object.userData.isParticle && !object.userData.isCollider) {
                this.applyShader(object);
            } else {
                this.restoreOriginalMaterial(object);
            }
        });
    }

    updateLightPosition(scene, position) {
        if (this.shaderState==0 || !scene || !position) return;

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
        if (this.shaderState==0 || !scene || !timeVal) return;

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
    update(scene, position, timeVal){
        if(this.shaderState == 0) return;
        else if(this.shaderState == 1){
            this.updateLightPosition(scene, position);
            this.updateTime(scene, timeVal);
        }
        else{
            this.updateTime(scene, timeVal);
        }
        
    }
}