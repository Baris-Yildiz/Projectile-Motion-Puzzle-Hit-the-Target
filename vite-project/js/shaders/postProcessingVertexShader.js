const postProcessingVertexShader = `
            out vec2 fTexCoords;        
            void main() {
                fTexCoords = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`;