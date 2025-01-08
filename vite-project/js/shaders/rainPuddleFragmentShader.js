const rainPuddleFragmentShaderBeforeMain = `#include <common>
                uniform vec2 iTime;
                uniform vec2 iUVRes;
                varying vec2 f_uv;
                
                float random (vec2 st) {
                    return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
                }
                
                void drawPuddle(vec2 pos, float rInner, float rOuter) {
                    float dist = length( f_uv - pos);
                    float smoothing = smoothstep(0.0, rOuter + 0.05, rOuter + 0.05 - dist);
                    if (dist <= rInner) {
                        gl_FragColor += vec4(0.52, 0.52, 0.52, 0.0) * smoothing;
                        gl_FragColor.a = 1.0 - mod(iTime.x, 1.);
                    } else if (dist <= rOuter){
                        gl_FragColor += vec4(0.5, 0.5, 0.5, 0.0) * smoothing;
                        gl_FragColor.a = 1.0 - mod(iTime.x, 1.);
                    }
                }
                
                void drawPuddles(){
                    if (iTime.x <= 1.) return;
                    const float xAmount = 15.;
                    const float yAmount = 10.;
                    for (float j = 1.; j < xAmount; j++) {
                        for (float i = 1.; i < yAmount ; i++) {
                            vec2 pos = vec2(j/xAmount, i/yAmount);
                            float randomMult = clamp(1.5, 2., 1.+random(pos));
                            float rInner = 0.0025 * mod(iTime.x* randomMult, 1.);
                            float rOuter = 0.0040 * mod(iTime.x* randomMult, 1.);
                            
                            drawPuddle(pos, rInner, rOuter);
                        }
                    }   
                }
`

const rainPuddleFragmentShaderEndOfMain = `#include <dithering_fragment>
                    drawPuddles();`