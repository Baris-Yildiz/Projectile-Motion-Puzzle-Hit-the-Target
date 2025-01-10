const redBlackVertexShaderAttributes = `#include <common>
                varying vec2 f_uv;`;
const redBlackVertexShaderEndOfMain = `f_uv = uv;
                gl_FragColor = vec4(texelColor, 1.0);
                }`;