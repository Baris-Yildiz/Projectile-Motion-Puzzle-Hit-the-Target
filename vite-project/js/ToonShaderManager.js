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
            vertexShader: `
                #include <common>
                #ifdef USE_SKINNING
                    #include <skinning_pars_vertex>
                #endif
                
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    
                    #ifdef USE_SKINNING
                        #include <skinbase_vertex>
                        #include <beginnormal_vertex>
                        #include <skinnormal_vertex>
                        vNormal = normalize(normalMatrix * objectNormal);
                        #include <begin_vertex>
                        #include <skinning_vertex>
                        vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
                    #else
                        vNormal = normalize(normalMatrix * normal);
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    #endif
                    
                    vViewPosition = -mvPosition.xyz;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 diffuse;
                uniform vec3 lightPosition;
                uniform float opacity;
                uniform sampler2D baseColorMap;
                
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                varying vec2 vUv;
                
                void main() {
                    vec4 texColor = texture2D(baseColorMap, vUv);
                    vec3 baseColor = texColor.rgb * diffuse;
                    
                    vec3 normal = normalize(vNormal);
                    vec3 lightDir = normalize(lightPosition);
                    
                    float intensity = dot(normal, lightDir);
                    
                    if (intensity > 0.95) intensity = 1.0;
                    else if (intensity > 0.75) intensity = 0.8;
                    else if (intensity > 0.5) intensity = 0.6;
                    else if (intensity > 0.25) intensity = 0.4;
                    else intensity = 0.2;
                    
                    vec3 color = baseColor * intensity;
                    
                    float rim = 1.0 - max(dot(normalize(vViewPosition), normal), 0.0);
                    rim = pow(rim, 3.0);
                    color = mix(color, baseColor, rim * 0.3);
                    
                    gl_FragColor = vec4(color, texColor.a * opacity);
                }
            `
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
                    baseColorMap: { value: originalMaterial?.map ?? null }
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
        if (!object.isMesh || this.shouldSkipObject(object)) return;
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
            if (this.isToonEnabled) {
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
}