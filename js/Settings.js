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


}