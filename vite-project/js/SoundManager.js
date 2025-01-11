class SoundManager{
    constructor(game){
        this.game = game;
        this.backgroundMusic = new Audio("resources/sound/background_music.mp3");
        this.sfxList = [];
        this.sfxList.push(new Audio("resources/sound/menu_click.mp3"));
        this.sfxList.push(new Audio("resources/sound/auto_rifle.mp3"));
        this.sfxList.push(new Audio("resources/sound/walking.mp3"));
        this.sfxList.push(new Audio("resources/sound/rain_15s.mp3"));
    }
    setSFX(value){
        for(let i = 0; i < this.sfxList.length; i++){
            this.sfxList[i].volume = value;
        }
    }
    setBackgroundMusicVolume(value){
        this.backgroundMusic.volume = value;
    }
    playBackgroundMusic(){
        setTimeout(() => {
            this.backgroundMusic.volume = this.game.settings.music;

            this.backgroundMusic.loop = true;
            this.backgroundMusic.play().catch(error => {
            console.error('Music playback failed:', error);
          });
        }, 200);
    }
    playGunSound(){
        this.sfxList[1].volume = this.game.settings.sfx;
        this.sfxList[1].play().catch(error => {
            console.error('Gun sound playback failed:', error);
        });
    }
    playWalkingSound(){
        this.sfxList[2].volume = this.game.settings.sfx;
        this.sfxList[2].play().catch(error => {
            console.error('Walking sound playback failed:', error);
        });
    }
    playRainSound(){
        this.sfxList[3].volume = this.game.settings.sfx;
        this.sfxList[3].loop = true;
        this.sfxList[3].play().catch(error => {
           console.error('Rain sound playback failed:', error);
        });
    }
    stopRainSound(){
        this.sfxList[3].volume = 0;
        this.sfxList[3].loop = false;
    }
}
export default SoundManager;