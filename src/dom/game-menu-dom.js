import { GameModerator } from "../logic/game-moderator";
import EventBus from "../state/event-bus";

export default class GameMenuDom {
  static generatePreGameDialog() {
    const dialog = document.createElement("dialog");
    dialog.classList.add("game-dialog");

    const h1 = document.createElement("h1");
    h1.textContent = "BlockFleet";

    const h3 = document.createElement("h3");
    h3.textContent = "A Battleships Game";

    dialog.append(h1, h3);

    return dialog;
  }

  static generateButtonContainer() {
    const div = document.createElement("div");
    div.classList.add("game-dialog__button-container");

    return div;
  }

  static generateNameInputContainer(player) {
    // player argument accepts 'player-one' or 'player-two'

    const div = document.createElement("div");
    div.classList.add(`${player}-details`);

    const label = document.createElement("label");
    const labelTextContent =
      player === "player-one" ? "Player One" : "Player Two";
    label.textContent = `${labelTextContent} Name:`;
    label.for = `${player}-name`;

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = labelTextContent;
    input.id = `${player}-name`;
    input.maxLength = 10;

    div.append(label, input);

    return div;
  }

  static generateButton(purpose) {
    const button = document.createElement("button");
    button.textContent = purpose.charAt(0).toUpperCase() + purpose.slice(1);
    button.classList.add(`${purpose}-button`);

    return button;
  }

  static generateInteractiveSection() {
    const section = document.createElement("section");
    section.classList.add("game-dialog__interactive-section");

    return section;
  }

  constructor(mainContainer) {
    this.preGameDialog = GameMenuDom.generatePreGameDialog();
    this.interactiveSection = GameMenuDom.generateInteractiveSection();
    this.mainContainer = mainContainer;
    this.eventBusInstance = new EventBus();

    this.playerOneInputContainer = null;
    this.playerTwoInputContainer = null;
    this.mode = "pvc";
    this.gameInstance = null;

    this.mainContainer.appendChild(this.preGameDialog);
    this.initialize();
  }

  openPreGameDialog() {
    this.preGameDialog.showModal();
  }

  closePreGameDialog() {
    this.preGameDialog.close();
  }

  initialize() {
    this.initializeGameModeButtons();
    this.initializePlayerInputContainers();
    this.initializeStartButton();
    this.initializeInteractiveSection();
  }

  initializeInteractiveSection() {
    this.preGameDialog.appendChild(this.interactiveSection);
  }

  initializeGameModeButtons() {
    const pvcButton = document.createElement("button");
    pvcButton.classList.add("pvc-mode__button", "pvc-mode__button--selected");
    pvcButton.textContent = "Player vs Computer";
    this.attachModeEventListener(pvcButton, "pvc");

    const pvpButton = document.createElement("button");
    pvpButton.classList.add("pvp-mode__button");
    pvpButton.textContent = "Player vs Player";
    this.attachModeEventListener(pvpButton, "pvp");

    const buttonContainer = GameMenuDom.generateButtonContainer();
    buttonContainer.append(pvcButton, pvpButton);

    this.interactiveSection.appendChild(buttonContainer);
  }

  initializePlayerInputContainers() {
    this.playerOneInputContainer =
      GameMenuDom.generateNameInputContainer("player-one");
    this.playerTwoInputContainer =
      GameMenuDom.generateNameInputContainer("player-two");

    this.interactiveSection.append(
      this.playerOneInputContainer,
      this.playerTwoInputContainer
    );
  }

  attachModeEventListener(element, mode) {
    // mode argument accepts either 'pvp-mode' or 'pvc-mode'
    if (mode !== "pvp" && mode !== "pvc") {
      return;
    }
    element.addEventListener("click", () => {
      // Select all buttons that might be selected, using a combined selector.
      // This assumes that the buttons use a consistent class naming pattern.
      const selectedButtons = document.querySelectorAll(
        ".pvp-mode__button--selected, .pvc-mode__button--selected"
      );

      // Iterate over each selected button and remove the selection classes.
      selectedButtons.forEach((btn) => {
        // Remove both classes in case a button has either.
        btn.classList.remove("pvp-mode__button--selected");
        btn.classList.remove("pvc-mode__button--selected");
      });

      // Now, add the selected class to the clicked button.
      // This ensures that only the clicked button shows as selected.
      element.classList.add(`${mode}-mode__button--selected`);

      // Update the mode property (or any related state) with the current mode.
      this.mode = mode;

      if (mode === "pvc") {
        this.handlePvcMode();
      } else if (mode === "pvp") {
        this.handlePvpMode();
      }
    });
  }

  handlePvpMode() {
    // Shows the name input for both player one and player two
    this.playerOneInputContainer.style.display = "flex";
    this.playerTwoInputContainer.style.display = "flex";
  }

  handlePvcMode() {
    // Hides the name input for player two since it will be computer
    this.playerOneInputContainer.style.display = "flex";
    this.playerTwoInputContainer.style.display = "none";
  }

  initializeStartButton() {
    const startButton = GameMenuDom.generateButton("start");

    startButton.addEventListener("click", () => {
      const getPlayerOneName = document.querySelector("#player-one-name").value;

      const getPlayerTwoName = document.querySelector("#player-two-name").value;

      this.gameInstance = new GameModerator({
        mode: this.mode,
        playerOneName: getPlayerOneName,
        playerTwoName: getPlayerTwoName,
        eventBusInstance: this.eventBusInstance,
        resetRoundCallback: this.resetRound,
        resetGameCallback: this.resetGame,
      });
      this.startGame();
    });

    this.interactiveSection.appendChild(startButton);
  }

  startGame() {
    this.closePreGameDialog();

    // Add the newly generated game containers for each player and the post game dialog
    this.mainContainer.append(
      this.gameInstance.playerOneContainer,
      this.gameInstance.playerTwoContainer
    );

    this.gameInstance.subscribeEventBus();
  }

  resetRound = () => {
    this.mainContainer.replaceChildren();

    // Add the newly generated game containers for each player and the post game dialog
    this.mainContainer.append(
      this.preGameDialog,
      this.gameInstance.playerOneContainer,
      this.gameInstance.playerTwoContainer
    );

    this.closePreGameDialog();

    this.gameInstance.subscribeEventBus();
  };

  resetGame = () => {
    this.mainContainer.replaceChildren();

    this.mainContainer.appendChild(this.preGameDialog);

    this.openPreGameDialog();
  };

  attachCloseDialogListener(element) {
    element.addEventListener("click", () => {
      this.preGameDialog.close();
    });

    return element;
  }
}
