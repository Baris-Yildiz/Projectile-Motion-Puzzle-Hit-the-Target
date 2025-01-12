import * as THREE from "three";

export class RedBlackShaderManager {
    constructor() {
        this.redBlackMaterials = new Map();
        this.isRedBlackEnabled = false;

        this.redBlackShader = {
            uniforms: {
                iTime: 0.0,
                diffuse: { value: new THREE.Color(0xffffff) },
                lightPosition: { value: new THREE.Vector3(0, 1, 0) },
                opacity: { value: 1.0 },
                baseColorMap: { value: null }
            },
            vertexShader: redBlackVertexShader,
            fragmentShader: redBlackFragmentShader
        };
    }

    createRedBlackMaterial(originalMaterial) {
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

            const redBlackMaterial = new THREE.ShaderMaterial({
                uniforms: uniforms,
                vertexShader: this.redBlackShader.vertexShader,
                fragmentShader: this.redBlackShader.fragmentShader,
                transparent: originalMaterial?.transparent ?? false,
                side: originalMaterial?.side ?? THREE.FrontSide,
                defines: defines
            });

            if (originalMaterial) {
                if (originalMaterial.map) {
                    redBlackMaterial.uniforms.baseColorMap.value = originalMaterial.map;
                }
            }

            redBlackMaterial.isRedBlackShader = true;
            return redBlackMaterial;
        } catch (error) {
            console.error('Error creating red black material:', error);
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


    shouldSkipObject(object) {
        if (!object || !object.parent) return true;

        const isTransformControl =
            object.parent.isTransformControls ||
            object.parent.parent?.isTransformControls ||
            object.name.includes('helper') ||
            object.name.includes('gizmo') ||
            object.name.includes('picker') ||
            object.name.includes('plane') ||
            object.name.includes('playerCollider');

        return isTransformControl;
    }

    applyRedBlackShader(object) {
        if (!object.isMesh || this.shouldSkipObject(object) || object.material instanceof THREE.RawShaderMaterial) return;
        if (object.material?.isRedBlackShader) return;

        if (!this.redBlackMaterials.has(object.uuid)) {
            this.redBlackMaterials.set(object.uuid, object.material);
        }

        if (Array.isArray(object.material)) {
            object.material = object.material.map(mat => this.createRedBlackMaterial(mat));
        } else {
            object.material = this.createRedBlackMaterial(object.material);
        }
    }

    restoreOriginalMaterial(object) {
        if (!object.isMesh || this.shouldSkipObject(object)) return;

        if (this.redBlackMaterials.has(object.uuid)) {
            object.material = this.redBlackMaterials.get(object.uuid);
            this.redBlackMaterials.delete(object.uuid);
        }
    }

    toggleRedBlackShader(scene) {
        if (!scene) return;

        this.isRedBlackEnabled = !this.isRedBlackEnabled;

        scene.traverse((object) => {
            if (this.isRedBlackEnabled && !object.userData.isParticle && !object.userData.isCollider) {
                this.applyRedBlackShader(object);
            } else {
                this.restoreOriginalMaterial(object);
            }
        });
    }

    updateTime(scene, timeVal) {
        if (!this.isRedBlackEnabled|| !scene || !timeVal) return;

        scene.traverse((object) => {
            if (!object.isMesh || this.shouldSkipObject(object)) return;

            if (object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                materials.forEach(material => {
                    if (material?.isRedBlackShader && material.uniforms?.iTime) {
                        material.uniforms.iTime.value = timeVal;
                    }
                });
            }
        });
    }
}