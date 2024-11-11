class UIHandler {
    constructor() {
        this.gameUI = document.getElementById("gameUI");

        this.uiState = false;
        let listener = (event)=> {
            let key = event.key.toLowerCase();
            if (key !== "h") {
                return;
            }
            console.log("s");
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
}