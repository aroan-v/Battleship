import gameStateTracker from "../state/state";
import battleShipEventBus from "../state/event-bus";

function createBlockElement(coordinates) {
  if (!Array.isArray(coordinates)) {
    throw new Error(`Coordinate: ${coordinates} is NOT an array!`);
  }

  const div = document.createElement("div");
  div.setAttribute("data-coordinates", coordinates);
  div.className = "cell-block";

  return div;
}

function createRowElement() {
  const div = document.createElement("div");
  div.className = "row";

  return div;
}

function updateDOMWithOccupied(moveArray) {
  // array of coordinates
  if (Array.isArray(moveArray[0])) {
    moveArray.forEach((move) => {
      const matchingDiv = document.querySelector([
        `[data-coordinates='${move.join()}']`,
      ]);

      matchingDiv.classList.add("occupied");
    });
  }
}

export default class GameBoardDom {
  static extractAttribute(element) {
    return element
      .getAttribute("data-coordinates")
      .split(",")
      .map((val) => +val);
  }

  static applyGhost(array) {
    if (!gameStateTracker.placeShipMode) {
      return;
    }

    if (!Array.isArray(array)) {
      throw new Error("Not an array!");
    }

    array.forEach((domElement) =>
      domElement.classList.add("ship-buttons__button--ghost")
    );
  }

  static removeGhost(array) {
    array.forEach((domElement) =>
      domElement.classList.remove("ship-buttons__button--ghost")
    );
  }

  static retrieveBlocks(array) {
    return Array.from({ length: array.length }, (_, i) => {
      const [val1, val2] = array[i];
      return document.querySelector(`[data-coordinates="${val1},${val2}"]`);
    });
  }

  static attachHitListener({ element, coordinates, receiveAttackCallback }) {
    element.addEventListener("click", () => {
      if (!gameStateTracker.hitMode) {
        return;
      }

      receiveAttackCallback(coordinates);

      // Modify the class list of the element based on the status of the attacks
      if (gameStateTracker.lastAttack.attStatus) {
        if (gameStateTracker.lastAttack.shipPresent) {
          element.classList.add("ship-attacked");
        } else {
          element.classList.add("attacked");
        }
      }

      // Attack has been successful, reset the shared state
      gameStateTracker.resetLastAttack();
    });
  }

  static attachPlaceShipListener({
    element,
    coordinates,
    placeShipCallback,
    shipTrackerCallback,
  }) {
    element.addEventListener("click", () => {
      if (!gameStateTracker.ship) {
        return;
      }

      placeShipCallback(coordinates);

      console.log("coordinates:", coordinates);

      updateDOMWithOccupied(shipTrackerCallback.get(gameStateTracker.ship));
      gameStateTracker.ship = null; // reset the state
      battleShipEventBus.publish("reset-ships");
    });
  }

  constructor(instance) {
    // gameBoard instance passed to this constructor
    this.gameBoardInstance = instance;
    this.gameBoard = this.createGridContainer(instance);
    this.lastElement = null;
    this.adjacentBlocks = null;

    battleShipEventBus.subscribe("refresh-ghost", () => this.refreshGhost());
  }

  generateAdjacentBlocks(element) {
    const coordinates = GameBoardDom.extractAttribute(element);
    this.adjacentBlocks =
      gameStateTracker.dir === "vertical"
        ? this.gameBoardInstance.generateVerticalBlocks(coordinates)
        : this.gameBoardInstance.generateHorizontalBlocks(coordinates);

    return this.adjacentBlocks;
  }

  attachPlaceShipListener({ element, coordinates, placeShipCallback }) {
    element.addEventListener("click", () => {
      if (!gameStateTracker.ship) {
        return;
      }

      // Update the back end
      placeShipCallback(coordinates);

      // Update the DOM
      updateDOMWithOccupied(this.adjacentBlocks);

      gameStateTracker.ship = null; // reset the state
      battleShipEventBus.publish("reset-ships");
    });
  }

  attachGhostListener(element) {
    let blockGroup = null;

    element.addEventListener("mouseenter", () => {
      // Store last element clicked for changing orientation
      this.lastElement = element;

      // Apply the ghost modifier to the element and the generated adjacent elements
      const generatedArray = this.generateAdjacentBlocks(element);
      blockGroup = GameBoardDom.retrieveBlocks(generatedArray);
      GameBoardDom.applyGhost(blockGroup);
    });

    element.addEventListener("mouseleave", () => {
      // Remove the ghost modifier to the element and the generated adjacent elements
      this.lastElement = null;
      GameBoardDom.removeGhost(blockGroup);
    });
  }

  refreshGhost() {
    // Updates the orientation of the blocks
    const ghostedBlocks = document.querySelectorAll(
      ".ship-buttons__button--ghost"
    );

    ghostedBlocks.forEach((element) =>
      element.classList.remove("ship-buttons__button--ghost")
    );

    if (!this.lastElement) {
      return;
    }

    // Simulate the mouse leaving the element
    const mouseLeaveEvent = new MouseEvent("mouseleave", {
      bubbles: true,
      cancelable: true,
    });
    const elementPlaceHolder = this.lastElement;
    this.lastElement.dispatchEvent(mouseLeaveEvent);

    // Immediately simulate the mouse entering the element
    const mouseEnterEvent = new MouseEvent("mouseenter", {
      bubbles: true,
      cancelable: true,
    });
    elementPlaceHolder.dispatchEvent(mouseEnterEvent);
  }

  createGridContainer(instance) {
    const divContainer = document.createElement("div");

    for (let i = 0; i < instance.gameBoard.length; i++) {
      const newRow = createRowElement();

      for (let j = 0; j < instance.gameBoard[i].length; j++) {
        const newDiv = createBlockElement([i, j]);

        this.attachGhostListener(newDiv);

        GameBoardDom.attachHitListener({
          element: newDiv,
          coordinates: [i, j],
          receiveAttackCallback: instance.receiveAttack.bind(instance),
        });

        this.attachPlaceShipListener({
          element: newDiv,
          coordinates: [i, j],
          placeShipCallback: instance.placeShip.bind(instance),
          shipTrackerCallback: instance.shipTracker,
        });

        newRow.appendChild(newDiv);
      }

      divContainer.appendChild(newRow);
    }
    return divContainer;
  }
}
