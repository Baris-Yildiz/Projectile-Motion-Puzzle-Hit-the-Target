// this.UIHandler = new UIHandler(game);
// TODO: code above only adds keyH listener and instantiates gameRef, change to function not class.

const buttons = Object.freeze({
    ABOUT_BUTTON:0,
    OPTIONS_BUTTON:1,
    KEYBINDINGS_BUTTON:2
});

let quality = ["LOW", "MEDIUM", "HIGH"];
let gameRef;
let gameUI;
let uiState;
let moveState = false;
let scoreText ;

let score = 0;
let PICKUP_ARRIVE_SCORE = 100;
let scoreNeededForNextPickup = 100;
let bulletMass = 100;
let bulletVelocity = 100;
let shootFrequency = 250;

function onSettingsSliderValueChanged(id) {
    let labels = document.getElementsByTagName('label');
    let slider = document.getElementById(id);
    for( let i = 0; i < labels.length; i++ ) {
        if (labels[i].htmlFor === id){
            if (id === "Texture Quality" || id === "Environment Quality") {
                labels[i].innerText = id + ": " + quality[slider.value];
            } else {
                labels[i].innerText = id + ": " + slider.value;
                switch (id) {
                    case "FOV":
                        gameRef.settings.setFov(slider.value);
                        break;
                    case "X Sensitivity":
                        gameRef.settings.horizontalSensitivity = slider.value / 50.0;
                        break;
                    case "Y Sensitivity":
                        gameRef.settings.verticalSensitivity = slider.value / 50.0;
                        break;
                    case "Brightness":
                        gameRef.settings.setBrightness(slider.value / 50.0);
                        break;
                    case "SFX":
                        gameRef.settings.setSfx(slider.value / 100.0);
                        break;
                    case "Music":
                        gameRef.settings.setMusic(slider.value / 100.0);
                        break;
                }
            }

            break;
        }
    }
}

function onButtonClick(clickedButton) {
    let uiPages = [
        document.getElementById("aboutPage"),
        document.getElementById("optionsPage"),
        document.getElementById("keybindingPage"),
    ];

    for (let i = 0; i < uiPages.length; i++) {
        uiPages[i].style.display = "none";
    }

    let uiButtons = document.getElementsByClassName("navBarButton");

    for (let i = 0; i < uiButtons.length; i++) {
        uiButtons.item(i).classList.remove("navBarButtonClicked");
    }

    uiButtons.item(clickedButton).classList.add("navBarButtonClicked");
    uiPages[clickedButton].style.display = "block";
    playMenuSFX();
}

function toggleUI(event) {
    let key = event.key.toLowerCase();
    if (key !== "h") {
        return;
    }
    uiState = !uiState;
    gameUI.style.visibility = uiState ? "unset" : "hidden";
    console.log(uiState);
    if(uiState){
        playMenuSFX();
        document.exitPointerLock();
    }else{
        document.body.requestPointerLock();
    }
}

function initUI(game) {
    gameRef = game;
    gameUI = document.getElementById("gameUI");
    uiState = false;
    document.addEventListener("keyup",toggleUI);
}


function playMenuSFX() {
    gameRef.soundManager.sfxList[0].play().catch(error => {
        console.error('Audio playback failed:', error);
    });
}

