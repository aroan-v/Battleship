export default class GameBoardDom {
  static createBlockElement(coordinates, playerCode) {
    if (!Array.isArray(coordinates)) {
      throw new Error(`Coordinate: ${coordinates} is NOT an array!`);
    }

    const button = document.createElement("button");
    button.setAttribute("data-coordinates", coordinates);
    button.setAttribute("data-code", playerCode);
    button.className = "cell-block";

    return button;
  }

  static createRowElement() {
    const div = document.createElement("div");
    div.className = "row";

    return div;
  }

  static extractAttribute(element) {
    return element
      .getAttribute("data-coordinates")
      .split(",")
      .map((val) => +val);
  }

  static retrieveComputerElement(coordinates, playerCode) {
    const [val1, val2] = coordinates;
    return document.querySelector(
      `[data-coordinates="${val1},${val2}"][data-code='${playerCode}']`
    );
  }

  static dispatchComputerClickEvent(element) {
    const mouseClickEvent = new MouseEvent("click", {
      bubbles: true, // Allow event to propagate up to parent elements
      cancelable: true, // Allow event cancellation if needed
    });

    element.dispatchEvent(mouseClickEvent);
  }

  static computerNextMove(coordinates, playerCode) {
    GameBoardDom.dispatchComputerClickEvent(
      GameBoardDom.retrieveComputerElement(coordinates, playerCode)
    );
  }

  static retrieveBlocks(array, playerCode) {
    return Array.from({ length: array.length }, (_, i) => {
      const [val1, val2] = array[i];
      return document.querySelector(
        `[data-coordinates="${val1},${val2}"][data-code='${playerCode}']`
      );
    });
  }

  constructor(gameBoardInstance, playerState, eventBus, enemyState) {
    // gameBoard instance passed to this constructor
    this.gameBoardInstance = gameBoardInstance;
    this.enemyState = enemyState;
    this.eventBus = eventBus;
    this.playerState = playerState;
    this.gameBoard = this.createGridContainer(gameBoardInstance);
    this.lastButtonClicked = null;
    this.adjacentBlocks = null;

    this.cheatMode = false; // Turning this to true will show the placement of the ships
    this.occupiedDomElements = []; // Will contain all the elements that have a ship part in them
    this.sunkenShipBlocks = [];

    this.subscribeGameInitializers();
  }

  subscribeGameInitializers() {
    this.eventBus.subscribe(
      `${this.enemyState.code}-post-game-effects`,
      this.updatePostGameEffects
    );

    // If it's PvC mode, keep the player's ships visible on their board
    // since the computer opponent doesn't rely on visuals to play.
    // In PvP mode, hide the ships after placement to prevent the other player from seeing them.
    if (
      (this.enemyState.code !== "M4CH!N@" || this.cheatMode) &&
      this.playerState.code !== "M4CH!N@"
    ) {
      this.eventBus.subscribe(
        `${this.playerState.code}-placed-all-ships`,
        this.removeDomWithOccupied
      );
    }

    // Changes the color of the game board's border to signal player's turn
    this.eventBus.subscribe(`current-turn-${this.enemyState.counter}`, () => {
      this.gameBoard.classList.add(`current-turn`);
    });

    this.eventBus.subscribe(`done-turn-${this.enemyState.counter}`, () => {
      this.gameBoard.classList.remove("current-turn");
    });
  }

  updatePostGameEffects = () => {
    if (this.sunkenShipBlocks.length !== 16) {
      console.log("this.sunkenShipBlocks", this.sunkenShipBlocks);
      throw new Error("Not all ships have been sunk!");
    }

    this.sunkenShipBlocks.forEach((element) => {
      element.className = "cell-block game-over-effect";
    });

    const gameBoard = document.querySelector(
      `div.container-${this.playerState.counter} .game-board`
    );
    gameBoard.classList.add("game-over-effect-border");
  };

  updateDomWithOccupied() {
    if (!Array.isArray(this.adjacentBlocks[0])) {
      throw new Error("Adjacent blocks is not an array!");
    }

    this.adjacentBlocks.forEach((move) => {
      const matchingDiv = document.querySelector([
        `[data-coordinates='${move.join()}'][data-code='${this.playerState.code}']`,
      ]);

      matchingDiv.classList.add(`occupied-${this.playerState.counter}`);
      this.occupiedDomElements.push(matchingDiv);
    });
  }

  removeDomWithOccupied = () => {
    if (this.occupiedDomElements.length !== 16) {
      console.log("current length:", this.occupiedDomElements);
      throw new Error("Not all ships have been placed yet");
    }

    this.occupiedDomElements.forEach((element) =>
      element.classList.remove(`occupied-${this.playerState.counter}`)
    );
  };

  attachHitListener({ element, coordinates, receiveAttackCallback }) {
    element.addEventListener("click", () => {
      if (!this.enemyState.hitMode) {
        return;
      }

      receiveAttackCallback(coordinates);

      if (!this.enemyState.enemyAttacked) {
        return; // Attack unsuccessful, do nothing
      }

      // Modify the class list of the element based on the status of the attacks
      // The properties are updated by receivedAttackCallback method
      if (this.enemyState.enemyShipSunk) {
        this.applySunk(
          GameBoardDom.retrieveBlocks(
            this.enemyState.sunkShipCoordinates,
            this.playerState.code
          )
        );
      } else if (this.enemyState.enemyShipAttacked) {
        element.classList.add(`attacked-ship-${this.playerState.counter}`);
      } else {
        element.classList.add(`attacked-${this.playerState.counter}`);
      }

      // Attack has been successful, reset the player's attack states
      this.enemyState.resetLastAttack();

      this.eventBus.publish(`${this.enemyState.code}-attack-success`);
    });
  }

  applySunk(array) {
    array.forEach((domElement) => {
      this.sunkenShipBlocks.push(domElement);
      domElement.className = `cell-block ship-sunk-${this.playerState.counter}`;
      domElement.disabled = true;
    });
  }

  applyGhostShip(array) {
    if (!this.playerState.placeShipMode) {
      return;
    }

    if (!Array.isArray(array)) {
      throw new Error("Not an array!");
    }

    array.forEach((domElement) =>
      domElement.classList.add(
        `cell-block__button--ghost-${this.playerState.counter}`
      )
    );
  }

  applyGhostAttack(element) {
    element.classList.add(
      `cell-block__button--ghost-attack-${this.playerState.counter}`
    );
  }

  removeGhostShip(array) {
    array.forEach((domElement) =>
      domElement.classList.remove(
        `cell-block__button--ghost-${this.playerState.counter}`
      )
    );
  }

  removeGhostAttack(element) {
    element.classList.remove(
      `cell-block__button--ghost-attack-${this.playerState.counter}`
    );
  }

  generateAdjacentBlocks(element, shipSize) {
    const coordinates = GameBoardDom.extractAttribute(element);
    this.adjacentBlocks =
      this.playerState.direction === "vertical"
        ? this.gameBoardInstance.generateVerticalBlocks(coordinates, shipSize)
        : this.gameBoardInstance.generateHorizontalBlocks(
            coordinates,
            shipSize
          );

    return this.adjacentBlocks;
  }

  attachPlaceShipListener({ element, coordinates, placeShipCallback }) {
    element.addEventListener("click", () => {
      // If the player hasn't clicked a ship button, do nothing
      if (!this.playerState.ship || !this.playerState.placeShipMode) {
        return;
      }

      try {
        // Update the back end
        placeShipCallback(coordinates, this.playerState.shipSize());
      } catch (error) {
        return;
      }

      // Update the DOM
      this.updateDomWithOccupied();

      // reset the last clicked ship
      this.playerState.ship = null;

      // Remove the ghost effects
      this.lastButtonClicked = null;
      this.refreshGhost();

      if (this.playerState.placeShipMode) {
        this.eventBus.publish(`${this.playerState.code}-cycle-ships`);
      }
    });
  }

  attachGhostAttackListener(element) {
    element.addEventListener("mouseenter", () => {
      if (this.enemyState.hitMode) {
        // Apply ghost effect on a single block during hit-mode
        this.applyGhostAttack(element);
      }
    });

    element.addEventListener("mouseleave", () => {
      this.removeGhostAttack(element);
    });
  }

  attachGhostShipListener(element) {
    let blockGroup = null;

    element.addEventListener("mouseenter", () => {
      if (!this.playerState.ship || !this.playerState.placeShipMode) {
        return;
      }

      // Store last element clicked for changing orientation
      this.lastButtonClicked = element;

      // Apply the ghost modifier to the element and the generated adjacent elements
      const generatedArray = this.generateAdjacentBlocks(
        element,
        this.playerState.shipSize()
      );

      blockGroup = GameBoardDom.retrieveBlocks(
        generatedArray,
        this.playerState.code
      );

      this.applyGhostShip(blockGroup);
    });

    element.addEventListener("mouseleave", () => {
      if (this.playerState.hitMode) {
        // Remove ghost effect on a single block during hit-mode
        this.removeGhostAttack(element);
        return;
      }

      if (!this.playerState.ship || !this.playerState.placeShipMode) {
        return;
      }

      // Remove the ghost modifier to the element and the generated adjacent elements
      this.lastButtonClicked = null;
      this.removeGhostShip(blockGroup);
    });
  }

  refreshGhost() {
    // Updates the orientation of the blocks
    const ghostedBlocks = document.querySelectorAll(
      `.cell-block__button--ghost-${this.playerState.counter}`
    );

    ghostedBlocks.forEach((element) =>
      element.classList.remove(
        `cell-block__button--ghost-${this.playerState.counter}`
      )
    );

    if (!this.lastButtonClicked) {
      return;
    }

    // Simulate the mouse leaving the element
    const mouseLeaveEvent = new MouseEvent("mouseleave", {
      bubbles: true,
      cancelable: true,
    });
    const elementPlaceHolder = this.lastButtonClicked;
    this.lastButtonClicked.dispatchEvent(mouseLeaveEvent);

    // Immediately simulate the mouse entering the element
    const mouseEnterEvent = new MouseEvent("mouseenter", {
      bubbles: true,
      cancelable: true,
    });
    elementPlaceHolder.dispatchEvent(mouseEnterEvent);
  }

  createGridContainer(instance) {
    const divContainer = document.createElement("div");
    divContainer.classList.add("game-board");

    for (let i = 0; i < instance.gameBoard.length; i++) {
      for (let j = 0; j < instance.gameBoard[i].length; j++) {
        const newDiv = GameBoardDom.createBlockElement(
          [i, j],
          this.playerState.code
        );

        this.attachHitListener({
          element: newDiv,
          coordinates: [i, j],
          receiveAttackCallback: instance.receiveAttack.bind(instance),
        });

        if (this.enemyState.code !== "M4CH!N@") {
          // Attach this ghost listener if the enemy is a computer, it doesn't need it.
          this.attachGhostAttackListener(newDiv);
        }
        if (this.playerState.code !== "M4CH!N@") {
          // Attach the listeners if this game board is for a human and not for computer
          this.attachGhostShipListener(newDiv);

          this.attachPlaceShipListener({
            element: newDiv,
            coordinates: [i, j],
            placeShipCallback: instance.placeShip.bind(instance),
            shipTrackerCallback: instance.shipTracker,
          });
        }

        divContainer.appendChild(newDiv);
      }
    }
    return divContainer;
  }
}
