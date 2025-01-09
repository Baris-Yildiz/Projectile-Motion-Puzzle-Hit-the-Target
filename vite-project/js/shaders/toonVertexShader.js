const toonVertexShader = `
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
            `;