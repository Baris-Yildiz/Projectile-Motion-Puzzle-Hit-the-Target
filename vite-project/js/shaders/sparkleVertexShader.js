const sparkleVertexShader = `
        precision mediump float;
        uniform mat4 projectionMatrix;
        uniform mat4 modelViewMatrix;
        uniform float iTime;

        in vec3 position;
        in vec2 uv;

        out vec2 vUv;

        // Function to generate pseudo-random numbers
        float rand(vec2 co) {
            return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vUv = uv;

            
            float stretchX = 1.0 + rand(position.xy + iTime) * 0.9; 
            float stretchY = 1.0 + rand(position.xy - iTime) * 1.2; 

            vec3 stretchedPosition = vec3(position.x * stretchX, position.y * stretchY, position.z);

            gl_Position = projectionMatrix * modelViewMatrix * vec4(stretchedPosition, 1.0);
        }
        `