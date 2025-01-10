const toonFragmentShader = `
                uniform vec3 lightPosition;
                uniform float iTime;
                
                varying vec3 vNormal;
                varying vec2 vUv;
                
                void main() {
                   
                    vec3 normal = normalize(vNormal);
                    vec3 lightDir = normalize(lightPosition);
                    
                    float intensity = dot(normal, lightDir);
                    
                    float colorMultiplier;
                    float redColorComponent = abs(sin(iTime));
                    float blueColorComponent = abs(cos(iTime));
                    float greenColorComponent = abs(sin(iTime / 2.) * cos(iTime * 2.));
                    
                    if (intensity > 0.95)
                        colorMultiplier = 0.8;
                    else if (intensity > 0.75)
                        colorMultiplier = 0.6; 
                    else if (intensity > 0.5)
                        colorMultiplier = 0.4; 
                    else if (intensity > 0.25) 
                        colorMultiplier = 0.2;
                    else 
                        colorMultiplier = 0.1;
                    
                    vec3 color = vec3(redColorComponent, 
                    blueColorComponent, greenColorComponent) * colorMultiplier;
                    gl_FragColor = vec4(color, 1.0);
                }
            `;