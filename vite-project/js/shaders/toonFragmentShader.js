const toonFragmentShader = `
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
                    
                    vec3 color;
                    
                    if (intensity > 0.95) color = vec3(0.8, 0.8, 0.8);//intensity = 1.0;
                    else if (intensity > 0.75) color = vec3(0.6, 0.6, 0.6);//intensity = 0.8;
                    else if (intensity > 0.5) color = vec3(0.4, 0.4, 0.4);//intensity = 0.6;
                    else if (intensity > 0.25) color = vec3(0.2, 0.2, 0.2);//intensity = 0.4;
                    else color = vec3(0.1, 0.1, 0.1);//intensity = 0.2;
                    
                    //vec3 color = baseColor * intensity;
                    
                    float rim = 1.0 - max(dot(normalize(vViewPosition), normal), 0.0);
                    rim = pow(rim, 3.0);
                    color = mix(color, baseColor, rim * 0.3);
                    
                    gl_FragColor = vec4(color, texColor.a * opacity);
                }
            `;