// In Game class, call inside constructor with this.settings = new Settings(this);

const Quality = Object.freeze({
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2
});

class Settings {
    constructor(game) {
        this.sfx = 50;
        this.music = 50;
        this.fov = 70;

        this.textureQuality = Quality.MEDIUM;
        this.environmentQuality = Quality.MEDIUM;
        this.brightness = 50;

        this.horizontalSensitivity = 1;
        this.verticalSensitivity = 1;

        this.game = game;
    }

    setSfx(value) {
        this.sfx = value;
        this.game.soundManager.setSFX(value);
        
    }

    setMusic(value) {
        this.music = value;
        this.game.soundManager.setBackgroundMusicVolume(value);
    }

    setFov(value) {
        this.fov = value;
        this.game.camera.fov = this.fov;
        this.game.camera.updateProjectionMatrix();
    }

    setBrightness(value) {
        this.brightness = value;
        // reference game object's postProcessing member and adjust brightness.

        this.game.postProcessing.shaderPass.uniforms.brightness.value = this.brightness;
        //this.game.composer.passes[1].uniforms.brightness.value = this.brightness;
    }

    setEnvironmentQuality(value) {
        this.environmentQuality = value;
        let turbidity;
        let rayleigh;
        let mieCoef;
        let mieDir;

        switch (this.environmentQuality) {
            case 0:
                turbidity = 0.2;
                rayleigh = 0.05;
                mieCoef = 0.005;
                mieDir = 0.2;
                break;
            case 1:
                turbidity = 0.2;
                rayleigh = 0.05;
                mieCoef = 0.05;
                mieDir = 0.55;
                break;
            case 2:
                turbidity = 0.5;
                rayleigh = 0.1;
                mieCoef = 0.0005;
                mieDir = 0.98;
                break;
        }

        let skyUniforms = gameRef.skybox.sky.material.uniforms;
        skyUniforms['turbidity'].value = turbidity;
        skyUniforms['rayleigh'].value = rayleigh;
        skyUniforms['mieCoefficient'].value = mieCoef;
        skyUniforms['mieDirectionalG'].value = mieDir;
    }


}