import {THREE, EffectComposer, RenderPass, ShaderPass} from "./LibImports.js"

//In Game class constructor: this.postProcessing = new PostProcessing(this);
//In Game class onAnimate(): this.postProcessing.composer.render();
class PostProcessing{
    constructor(game){
        this.game = game;
        this.enabled = false;

        this.postProcessingVShader = `
            out vec2 fTexCoords;        
            void main() {
                fTexCoords = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`;

        this.postProcessingFShader = `
            in vec2 fTexCoords;
            out vec4 fColor;
        
            uniform sampler2D tDiffuse;
            uniform float brightness;
            uniform float applicationTime;
            
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


        this.composer = null;
        this.renderPass = null;
        this.shaderPass = null;
        this.setupPostProcessing();
    }

    setupPostProcessing() {
        const postProcessingShader = new THREE.ShaderMaterial(
            {
                glslVersion:THREE.GLSL3,
                vertexShader: this.postProcessingVShader,
                fragmentShader: this.postProcessingFShader,
                uniforms: {
                    tDiffuse: { value: null },
                    brightness: { value: 1.0 },
                    applicationTime: {value: 0.0}
                },
            }
        );

        this.composer = new EffectComposer(this.game.renderer);
        this.renderPass = new RenderPass(this.game.scene, this.game.renderCamera);
        this.composer.addPass(this.renderPass);

        this.shaderPass = new ShaderPass(postProcessingShader);
        this.shaderPass.uniforms.brightness.value = 1.0;
        this.composer.addPass(this.shaderPass);
    }

    updatePostProcessingTime(t) {
        this.game.postProcessing.shaderPass.uniforms.applicationTime.value = t;
    }

    render() {
        if(this.enabled){
            this.composer.render();
        }
    }
    toggleOn(isEnabled){
        this.enabled = isEnabled;
    }   
}

export default PostProcessing;