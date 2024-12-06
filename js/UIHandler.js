let buttons = {
    ABOUT_BUTTON:0,
    OPTIONS_BUTTON:1,
    KEYBINDINGS_BUTTON:2
};

let quality = ["LOW", "MEDIUM", "HIGH"];

function onSettingsSliderValueChanged(id) {
    let labels = document.getElementsByTagName('label');
    let slider = document.getElementById(id);
    for( let i = 0; i < labels.length; i++ ) {
        if (labels[i].htmlFor === id){
            if (id === "Texture Quality" || id === "Environment Quality") {
                labels[i].innerText = id + ": " + quality[slider.value];
            } else {
                labels[i].innerText = id + ": " + slider.value;
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
}

class UIHandler {
    constructor() {
        this.gameUI = document.getElementById("gameUI");

        this.uiState = false;
        let listener = (event)=> {
            let key = event.key.toLowerCase();
            if (key !== "h") {
                return;
            }
            this.uiState = !this.uiState;
            this.gameUI.style.visibility = this.uiState ? "unset" : "hidden";
        };
        document.addEventListener("keyup",listener);
    }

    AppendUIText(content) {
        const textElement = document.createElement("p");
        textElement.className = "gameUIText";
        textElement.innerText = content;
        this.gameUI.appendChild(textElement);
    }

    CreateHelpMenu() {
        /*this.AppendUIText("HELP MENU");
        this.AppendUIText("-----------------");

        this.AppendUIText("CONTROLS");
        this.AppendUIText("-----------------");

        this.AppendUIText("SHORTCUTS");
        this.AppendUIText("-----------------");*/
    }
}