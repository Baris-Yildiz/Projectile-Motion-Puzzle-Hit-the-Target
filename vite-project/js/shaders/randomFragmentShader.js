const randomFragmentShader = `
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
                    
                    vec2 uv = vUv;
                    uv  = 4.*uv;
                    vec2 curr = floor(uv);
                    vec2 fuv = fract(uv);
    
                    vec3 color = vec3(0.0,0.0,0.0);
                    for(int i = 0; i <= 3 ; i++){
                        for(int j = 0; j <= 3 ; j++){
                            if(float(i) == curr.x && float(j) == curr.y){
                                continue;
                            }
                            vec2 index = vec2(float(i),float(j));
                            vec2 adj = (curr + index + fuv);
                            vec2 neighborColor =vec2((cos(iTime)+1./2.)*fuv.x+(sin(iTime)+1./2.)*fuv.y) *mix(curr+fuv , adj, 1./abs(length(curr-index)));
                            color += vec3(neighborColor , 0.);
                        }
                    }
                    color = vec3(rotate(color.xy, PI/rand(curr)) , 0.2);
                    color /= 4.0; 
                    if(color.x < 0.1 && color.y <0.1){
                        color = fuv.xyx;
                    }
                    gl_FragColor = vec4(color, 1.0);
                }
            `;