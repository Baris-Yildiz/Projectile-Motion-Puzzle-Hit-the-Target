const redBlackFragmentShaderBeforeMain = `#include <common>
                varying vec2 f_uv;
`

const redBlackFragmentShaderEndOfMain = `#include <dithering_fragment>
                    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
`