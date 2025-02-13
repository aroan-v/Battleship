import battleShipEventBus from "../state/event-bus";
import gameStateTracker from "../state/state";

export default class GameControls {
  static generateAnnouncer() {
    const h1 = document.createElement("h1");
    h1.textContent = "Test";
    h1.classList.add("announcer");

    return h1;
  }

  static initializeShipButtonListener(shipButton, shipName) {
    shipButton.addEventListener("click", () => {
      // Activate the ship ghost placement
      gameStateTracker.placeShipMode = true;

      // Toggle the selected modifier on the ship button
      const isSelected = shipButton.classList.toggle(
        "ship-buttons__button--selected"
      );

      // Update shared state ship tracker
      if (isSelected) {
        gameStateTracker.ship = shipName;
      } else {
        gameStateTracker.placeShipMode = false;
        gameStateTracker.ship = null;
        return;
      }

      // Remove selected modifier on all other buttons
      const allShipButtons = document.querySelectorAll(
        ".ship-buttons .ship-buttons__button"
      );

      allShipButtons.forEach((button) => {
        if (shipButton !== button) {
          button.classList.remove("ship-buttons__button--selected");
        }
      });
    });
  }

  static initializeDirectionalListener() {
    document.addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        event.preventDefault();
        gameStateTracker.dir =
          gameStateTracker.dir === "horizontal" ? "vertical" : "horizontal";

        battleShipEventBus.publish("refresh-ghost");
      }
    });
  }

  static generateHitButton() {
    const button = document.createElement("button");
    button.classList.add("hit--button");
    button.textContent = "Hit";

    button.addEventListener("click", () => {
      const isSelected = button.classList.toggle("selected"); // Returns true if 'selected' was added, false if removed
      gameStateTracker.hitMode = isSelected; // Update state based on the return value
      gameStateTracker.placeShipMode = !isSelected;
    });

    return button;
  }

  constructor() {
    this.shipButtonsTracker = [];
    this.announcer = GameControls.generateAnnouncer();
    this.hitButton = GameControls.generateHitButton();
    this.shipButtons = this.generateShipButtons();
    this.timeoutTracker = null;

    battleShipEventBus.subscribe("announce", this.updateAnnouncer);
    battleShipEventBus.subscribe("reset-ships", () => this.resetModifier());
    GameControls.initializeDirectionalListener();
  }

  generateShipButtons() {
    const shipContainer = document.createElement("div");
    shipContainer.classList.add("ship-buttons");

    const shipNames = [
      "carrier",
      "battleship",
      "cruiser",
      "submarine",
      "destroyer",
    ];

    shipNames.forEach((ship) => {
      const button = document.createElement("button");
      button.textContent = ship;
      button.classList.add("ship-buttons__button");
      GameControls.initializeShipButtonListener(button, ship);
      this.shipButtonsTracker.push(button);
      shipContainer.appendChild(button);
    });

    return shipContainer;
  }

  resetModifier() {
    // Reset the selected state of the buttons now that the ship has been placed
    this.shipButtonsTracker.forEach((button) =>
      button.classList.remove("ship-buttons__button--selected")
    );
  }

  retrieveElements() {
    return [this.announcer, this.hitButton, this.shipButtons];
  }

  clearAnnouncer() {
    if (this.timeoutTracker) {
      clearTimeout(this.timeoutTracker);
    }

    this.timeoutTracker = setTimeout(() => {
      this.announcer.textContent = "";
    }, 1000);
  }

  updateAnnouncer = ({ event, data }) => {
    let finalMessage = null;

    switch (event) {
      case "sunk":
        finalMessage = `The ${data} ship has sunk!`;
        break;

      case "hit":
        finalMessage = `You hit a ship!`;
        break;

      case "miss":
        finalMessage = `You missed!`;
        break;

      default:
        finalMessage = "";
    }

    console.log("this.announcer", this.announcer);

    this.announcer.textContent = finalMessage;
    this.clearAnnouncer();
  };
}
