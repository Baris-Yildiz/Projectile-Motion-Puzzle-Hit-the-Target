import {THREE, EffectComposer, RenderPass, ShaderPass} from "./LibImports.js"

//In Game class constructor: this.postProcessing = new PostProcessing(this);
//In Game class onAnimate(): this.postProcessing.composer.render();
class PostProcessing{
    constructor(game){
        this.game = game;
        this.enabled = false;

        this.postProcessingVShader = postProcessingVertexShader;
        this.postProcessingFShader = postProcessingFragmentShader;

        this.composer = null;
        this.renderPass = null;
        this.shaderPass = null;
        this.raining = false;

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
                    applicationTime: {value: 0.0},
                    isRaining:{value: this.raining},
                    isInRedBlackMode: {value: this.game.redBlackShaderManager.isRedBlackEnabled}
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

    updatePostProcessing(t) {
        this.game.postProcessing.shaderPass.uniforms.applicationTime.value = t;
        this.game.postProcessing.shaderPass.uniforms.isRaining.value = this.raining;
        this.game.postProcessing.shaderPass.uniforms.isInRedBlackMode.value = this.game.redBlackShaderManager.isRedBlackEnabled;
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