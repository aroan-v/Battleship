export default class GameControls {
  static generateAnnouncer() {
    const h1 = document.createElement("h1");
    h1.textContent = "";
    h1.dataset.placeholder = "\u00A0";
    h1.classList.add("announcer");

    return h1;
  }

  static initializeShipButtonsDispatchEvent(element) {
    const mouseClickEvent = new MouseEvent("click", {
      bubbles: true, // Allow event to propagate up to parent elements
      cancelable: true, // Allow event cancellation if needed
    });

    element.dispatchEvent(mouseClickEvent);
  }

  constructor(playerState, eventBus, shipInstance) {
    this.shipButtonsTracker = new Map();
    this.ships = shipInstance;
    this.playerState = playerState;
    this.isPlayerComputer = this.playerState.code === "M4CH!N@";
    this.eventBus = eventBus;
    this.announcer = GameControls.generateAnnouncer();
    this.shipButtons = this.generateShipButtons();

    this.horizontalButton = null;
    this.verticalButton = null;
    this.orientationButtons = this.generateOrientationButtons();

    this.playerGuide = this.generatePlayerGuide();
    this.postGameMenu = this.generatePostGameMenu();

    this.timeoutTracker = null;
    this.currentShipButton = null;
    this.controlsContainer = this.generateControlsContainer();

    this.initializeEventBus();
    this.initializeSpaceBar();
  }

  generatePostGameMenu() {
    const div = document.createElement("div");
    div.classList.add(`post-game-menu-${this.playerState.counter}`);

    const h2 = document.createElement("h2");
    h2.textContent = "Start another round?";

    const yesButton = document.createElement("button");
    yesButton.textContent = "Yes";

    yesButton.addEventListener("click", () => {
      this.eventBus.publish("new-round");
    });

    const noButton = document.createElement("button");
    noButton.textContent = "No";

    noButton.addEventListener("click", () => {
      this.eventBus.publish("new-game");
    });

    div.append(h2, yesButton, noButton);

    return div;
  }

  generateControlsContainer() {
    const div = document.createElement("div");
    div.classList.add(`controls-container-${this.playerState.counter}`);

    div.append(this.generatePlayerLabel(), this.shipButtons, this.playerGuide);

    if (!this.isPlayerComputer) {
      // The ship rotate button is only available to non-computer players
      div.appendChild(this.orientationButtons);
    }

    return div;
  }

  generatePlayerLabel() {
    const div = document.createElement("div");
    div.classList.add(
      `controls-container__player-label-${this.playerState.counter}`
    );
    div.textContent = `${this.playerState.name}'s Ships`;

    return div;
  }

  generatePlayerGuide() {
    const div = document.createElement("div");
    div.classList.add(`controls-container__player-guide`);

    let guide = "";
    if (this.isPlayerComputer) {
      guide = "The computer auto-places ships after the player.";
    } else {
      guide = "Use the space bar or the buttons below to change orientation";
    }

    div.textContent = guide;
    return div;
  }

  activateNextShipButton = () => {
    if (this.currentShipButton) {
      // Remove the previously announced ship button
      this.clearAnnouncer(0);

      // Update the ship visualizer then disable the previously placed ship button
      this.updateShipVisualizer();
      this.currentShipButton.disabled = true;
      this.currentShipButton.classList.remove(
        ".ship-buttons__button--selected"
      );
      this.eventBus.publish(`${this.playerState.code}-reset-ships`);
    }

    // Get the ship that hasn't been placed yet
    const shipKey = this.ships
      .getAllShips()
      .find((ship) => ship.location.length === 0);

    if (!shipKey) {
      // All the ships has been placed, activate hit mode
      this.currentShipButton.disabled = true;
      this.playerState.placeShipMode = false;
      this.playerState.playerReady = true;
      this.eventBus.publish(`${this.playerState.code}-placed-all-ships`);

      // Hide all the pre-game controls
      this.hidePreGameControls();
      return;
    }

    // Process the currently selected ship
    this.currentShipButton = this.shipButtonsTracker.get(shipKey.name).button;
    GameControls.initializeShipButtonsDispatchEvent(this.currentShipButton);

    // If the player is computer, automatically place the next ship
    if (this.playerState.name === "Computer") {
      setTimeout(() => {
        this.eventBus.publish("place-computer-ship", shipKey);
      }, 500);
    }
  };

  showPostGameMenu = () => {
    this.postGameMenu.style.display = "grid";
  };

  hidePreGameControls() {
    this.playerGuide.style.display = "none";
    this.orientationButtons.style.display = "none";
  }

  updateShipVisualizer() {
    this.currentShipButton.classList.add("placed");
  }

  setShipButtonSink = (shipName) => {
    const shipButton = document.querySelector(
      `.ship-buttons__button-${this.playerState.counter}[data-ship=${shipName}]`
    );

    if (!shipButton) {
      throw new Error("Data attribute not found!");
    }

    shipButton.classList.remove("placed");
    shipButton.classList.add("sunk");
  };

  initializeEventBus() {
    this.eventBus.subscribe(
      `${this.playerState.code}-announce`,
      this.updateAnnouncer
    );

    this.eventBus.subscribe(
      `${this.playerState.code}-reset-ships`,
      this.resetModifier
    );

    this.eventBus.subscribe(
      `${this.playerState.code}-cycle-ships`,
      this.activateNextShipButton
    );

    this.eventBus.subscribe(
      `${this.playerState.code}-sunk-visualizer`,
      this.setShipButtonSink
    );

    this.eventBus.subscribe(
      `${this.playerState.code}-post-game-effects`,
      this.showPostGameMenu
    );
  }

  generateOrientationButtons() {
    const div = document.createElement("div");
    div.classList.add("controls-container__orientation");

    this.horizontalButton = document.createElement("button");
    this.horizontalButton.classList.add(
      "controls-container__orientation-button--horizontal"
    );
    this.horizontalButton.textContent = "Horizontal";

    this.verticalButton = document.createElement("button");
    this.verticalButton.classList.add(
      "controls-container__orientation-button--vertical",
      "selected"
    );
    this.verticalButton.textContent = "Vertical";

    // Attach the event listeners

    this.horizontalButton.addEventListener("click", () => {
      this.playerState.direction = "horizontal";
      this.eventBus.publish(`${this.playerState.code}-refresh-ghost`);
      this.horizontalButton.classList.add("selected");
      this.verticalButton.classList.remove("selected");
    });

    this.verticalButton.addEventListener("click", () => {
      this.playerState.direction = "vertical";
      this.eventBus.publish(`${this.playerState.code}-refresh-ghost`);
      this.verticalButton.classList.add("selected");
      this.horizontalButton.classList.remove("selected");
    });

    div.append(this.verticalButton, this.horizontalButton);

    return div;
  }

  dispatchShipRotationEvent() {
    const mouseClickEvent = new MouseEvent("click", {
      bubbles: true, // Allow event to propagate up to parent elements
      cancelable: true, // Allow event cancellation if needed
    });

    if (!this.playerState.placeShipMode) {
      // Do nothing if its not place ship mode
      return;
    }

    if (this.playerState.direction === "horizontal") {
      this.verticalButton.dispatchEvent(mouseClickEvent);
    } else if (this.playerState.direction === "vertical") {
      this.horizontalButton.dispatchEvent(mouseClickEvent);
    }
  }

  initializeSpaceBar() {
    document.addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        event.preventDefault();
        event.stopPropagation();
        this.dispatchShipRotationEvent();
      }
    });
  }

  changeShipRotation = () => {
    this.playerState.direction =
      this.playerState.direction === "horizontal" ? "vertical" : "horizontal";

    this.eventBus.publish(`${this.playerState.code}-refresh-ghost`);
  };

  initializeShipButtonListener(shipButton, shipName) {
    shipButton.addEventListener("click", () => {
      // Toggle the selected modifier on the ship button
      const isSelected = shipButton.classList.toggle(
        "ship-buttons__button--selected"
      );

      // Update shared state ship tracker
      if (isSelected) {
        this.playerState.ship = shipName;
        this.currentShipButton = shipButton;

        // Activate the ship ghost placement
        this.playerState.placeShipMode = true;

        this.eventBus.publish(`${this.playerState.code}-announce`, {
          event: "place-ship",
          ship: shipName,
        });
      } else {
        this.playerState.placeShipMode = false;
        this.playerState.ship = null;
        this.eventBus.publish(`${this.playerState.code}-announce`, {
          event: "",
        });
        return;
      }

      // Remove selected modifier on all other buttons
      const allShipButtons = this.shipButtons.querySelectorAll("button");

      allShipButtons.forEach((button) => {
        if (shipButton !== button) {
          button.classList.remove("ship-buttons__button--selected");
        }
      });
    });
  }

  generateShipButtons() {
    const shipContainer = document.createElement("div");
    shipContainer.classList.add("controls-container__ship-buttons");

    this.ships.getAllShips().forEach((ship) => {
      const shipButton = document.createElement("button");
      shipButton.textContent =
        ship.name.charAt(0).toUpperCase() + ship.name.slice(1);

      shipButton.classList.add(
        `ship-buttons__button-${this.playerState.counter}`
      );

      // Makes the button unclickable for the player
      if (this.isPlayerComputer) {
        shipButton.classList.add("computer");
      }

      shipButton.setAttribute(`data-ship`, ship.name);

      this.initializeShipButtonListener(shipButton, ship.name);
      this.shipButtonsTracker.set(ship.name, { button: shipButton, ship });

      const shipVisualizer = this.generateShipVisualizer(ship.name);

      shipButton.appendChild(shipVisualizer);
      shipContainer.append(shipButton);
    });

    return shipContainer;
  }

  generateShipVisualizer(ship) {
    let blockCounter = null;

    switch (ship) {
      case "carrier": {
        blockCounter = 5;
        break;
      }
      case "battleship": {
        blockCounter = 4;
        break;
      }
      case "cruiser": {
        blockCounter = 3;
        break;
      }
      case "submarine": {
        blockCounter = 2;
        break;
      }
      case "destroyer": {
        blockCounter = 2;
        break;
      }
    }

    const div = document.createElement("div");
    div.classList.add(
      `ship-buttons__button__visualizer--${this.playerState.counter}`
    );
    div.setAttribute(`data-ship-visualizer-${this.playerState.counter}`, ship);

    for (let i = 0; i < blockCounter; i++) {
      const divIcon = document.createElement("div");
      div.appendChild(divIcon);
    }

    return div;
  }

  resetModifier = () => {
    // Reset the selected state of the buttons now that the ship has been placed

    Array.from(this.shipButtonsTracker.values()).forEach(({ button }) => {
      button.classList.remove("ship-buttons__button--selected");
    });
  };

  retrieveAnnouncer() {
    return this.announcer;
  }

  clearAnnouncer(time = 1000, cancel = false) {
    if (this.timeoutTracker) {
      clearTimeout(this.timeoutTracker);
    }

    if (cancel) {
      // Text reset cancelled
      return;
    }

    this.timeoutTracker = setTimeout(() => {
      this.announcer.textContent = "";
    }, time);
  }

  updateAnnouncer = ({ event, ship, name }) => {
    let finalMessage = null;
    let time = 1000; // 1000 = 1 second
    let cancel = false;

    switch (event) {
      case "hit":
        finalMessage = "";
        break;

      case "place-ship":
        finalMessage = `Placing the ${ship} ship in the game board...`;
        cancel = true;
        break;

      case "winner":
        finalMessage = `${name} has won!`;
        this.announcer.classList.add("game-over-text");
        cancel = true;
        break;

      case "turn-human":
        finalMessage = `Its your turn to attack!`;
        cancel = true;
        break;

      case "turn":
        finalMessage = `It's ${name} turn to attack!`;
        cancel = true;
        break;

      default:
        finalMessage = "";
        cancel = true;
    }

    this.announcer.textContent = finalMessage;
    this.clearAnnouncer(time, cancel);
  };
}
