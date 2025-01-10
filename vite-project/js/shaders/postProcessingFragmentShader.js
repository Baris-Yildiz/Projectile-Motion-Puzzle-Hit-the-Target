const postProcessingFragmentShader = `
            in vec2 fTexCoords;
            out vec4 fColor;
        
            uniform sampler2D tDiffuse;
            uniform float brightness;
            uniform float applicationTime;
            uniform bool isRaining;
            
            float random(float x, float y) {
                return fract((sin(x+.01*y) * 12.9898) * 43758.5453);
            }
            
            void drawRainDrop(vec2 p) {
                const float width = 0.001;
                const float height = 0.03;
                vec2 distVector = fTexCoords - p;
                
                if (abs(distVector.x) <= width && abs(distVector.y) <= height) {
                    fColor += vec4(0.1);
                }
            }
            
            void addRedVignette() {
                vec2 center = vec2(0.5, 0.5);
                
                float distToCenter = length( fTexCoords - center );
                float maxDist = 0.5 * sqrt(2.0);
                
                fColor.gb *= smoothstep(0.01, 0.5, maxDist - distToCenter);
            }
            
            void addRain() {
                if (!isRaining) return;
                float rainDropsPerCol = 5.;
                float rainDropColAmount = 30.;
                float t = applicationTime;
                float speed = 2.;
                
                for (float i = 1.; i <= rainDropColAmount; i++) {
                    float x = (i / rainDropColAmount);
                    
                    for (float j = 1.; j <= rainDropsPerCol; j++) {
                        float y = 1.0 + (j / rainDropsPerCol);
                        y = mod(random(i, j) * y - speed * t, 1.);
                        drawRainDrop(vec2(x,y));
                    }
                }
            }
        
            void main() {
                vec4 color = texture(tDiffuse, fTexCoords);
                fColor = color * brightness;
                addRedVignette();
                addRain();
                fColor.a = 1.0;
            }`;