const redBlackFragmentShader = `
                const float PI = 3.1415;
                uniform float iTime;
                varying vec2 vUv;
                
                void main() {
                   
                    vec2 center = vec2(0.5, 0.5);
                    float dist = length(center - vUv);
                    dist -= mod(iTime, 1.);
                    
                    float r = abs(dist * sin(iTime * 2. * PI) * cos(iTime * PI));
                    r += 0.1;
    
                    gl_FragColor = vec4(r, 0.0, 0.0, 1.0);
                }
            `;