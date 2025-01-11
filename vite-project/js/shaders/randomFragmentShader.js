const redBlackFragmentShader = `
                const float PI = 3.1415;
                uniform float iTime;
                varying vec2 vUv;
                float rand(vec2 uv){
                    return fract(sin(dot(uv, vec2(12.345, 67.890))) * 43758.5453123);
                }
                vec2 rotate(vec2 uv, float angle){
                    return vec2(cos(angle) * uv.x - sin(angle) * uv.y, sin(angle) * uv.x + cos(angle) * uv.y);
                }
                void main() {
                    vec2 center = vec2(0.5, 0.5);
                    vec2 uv = vUv;
                    uv  = 4.*uv;
                    vec2 curr = floor(uv);
                    vec2 fuv = fract(uv);
                    vec3 color = vec3(0.0,0.0,0.0);
                    for(int i = 0; i <= 2; i++){
                        for(int j = 0; j <= 2; j++){
                            vec2 index = vec2(float(i),float(j));
                            vec2 adj = (curr + index + fuv);
                            vec3 neighborColor =  0.3+sin(iTime * adj.x) * vec3(fract(adj) ,0.);
                            float weight = 1.0 / length(index)/sqrt(2.);
                            color += neighborColor*weight;
                        }
                    }
                    color = vec3(rotate(color.xy, PI/rand(curr)*5.) , abs(cos(iTime)));
                    color /= 9.0;
                    //float dist = length(vec3(fuv,0.) - color);
                    //dist -= mod(iTime, 1.);
                    //color *= -dist; 
                    
                    //dist -= mod(iTime, 1.);
                    
                    //float r = abs(dist * sin(iTime * 2. * PI) * cos(iTime * PI));
                    //r += 0.1;
    
                    gl_FragColor = vec4(color, 1.0);
                }
            `;