import {THREE, EffectComposer, RenderPass, ShaderPass} from "./LibImports.js"

//In Game class constructor: this.postProcessing = new PostProcessing(this);
//In Game class onAnimate(): this.postProcessing.composer.render();
class PostProcessing{
    constructor(game){
        this.game = game;

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
            
            void addRedVignette() {
                vec2 center = vec2(0.5, 0.5);
                
                float distToCenter = length( fTexCoords - center );
                float maxDist = 0.5 * sqrt(2.0);
                
                fColor.gb *= smoothstep(0.01, 0.5, maxDist - distToCenter);
            }
        
            void main() {
                vec4 color = texture(tDiffuse, fTexCoords);
                fColor = color * brightness;
                addRedVignette();
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
                },
            }
        );

        this.composer = new EffectComposer(this.game.renderer);
        this.renderPass = new RenderPass(this.game.scene, this.game.camera);
        this.composer.addPass(this.renderPass);

        this.shaderPass = new ShaderPass(postProcessingShader);
        this.shaderPass.uniforms.brightness.value = 1.0;
        this.composer.addPass(this.shaderPass);
    }
}

export default PostProcessing;