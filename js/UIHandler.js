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

//ayrı bir class yapılabilir
const menu_sfx = new Audio("resources/sound/menu_click.mp3");
const backgroundMusic = null;

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
                        updateSFXVolume(slider.value/100);
                        break;
                    case "Music":
                        updateMusicVolume(slider.value/100);
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
    menu_sfx.play().catch(error => {
        console.error('Audio playback failed:', error);
    });
}

function toggleUI(event) {
    let key = event.key.toLowerCase();
    if (key !== "h") {
        return;
    }
    uiState = !uiState;
    gameUI.style.visibility = uiState ? "unset" : "hidden";
    if(uiState){
        menu_sfx.play().catch(error => {
            console.error('Audio playback failed:', error);
        });
    }
}

function initUI(game) {
    gameRef = game;
    gameUI = document.getElementById("gameUI");
    uiState = false;
    document.addEventListener("keyup",toggleUI);
}

function updateSFXVolume(volume) {
    menu_sfx.volume = volume;
}
function updateMusicVolume(volume) {
    if (backgroundMusic) {
        backgroundMusic.volume = volume; 
    }
}
function playMenuSFX() {
    menu_sfx.play();
}