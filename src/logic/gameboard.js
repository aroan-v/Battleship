export default class GameBoard {
  static generateGameBoard = () =>
    Array.from({ length: 10 }, () =>
      Array.from({ length: 10 }, () => [{ gotHit: false }])
    );

  // Checks if the given block is still within the game bounds.
  static validateBlock = (move) => move.every((elem) => elem >= 0 && elem <= 9);

  constructor(playerState, eventBus, enemyState, shipInstance) {
    this.gameBoard = GameBoard.generateGameBoard(); // array of arrays
    this.eventBus = eventBus;
    this.enemyState = enemyState;
    this.shipInstance = shipInstance;
    this.remainingShipsCoordinates = new Map();
    this.generatedCoordinates = null; // To be updated by generateHorizontalBlocks or generateVerticalBlocks
    this.playerState = playerState;
  }

  placeShip(coordinates) {
    // Validate if the provided shipName is part of the ships
    // Note: the target argument is optional as the method relies on the playerState to check the ship to be placed
    // Note: If target exists, the method will rely on the generatedCoordinates property
    const shipName = this.playerState.ship;
    this.shipInstance.updateLastSelected(shipName);

    if (this.remainingShipsCoordinates.has(this.shipInstance.lastSelected)) {
      throw new Error(`The ship: ${shipName} has already been registered`);
    }

    if (!GameBoard.validateBlock(coordinates)) {
      throw new Error("Chosen location goes out of bounds!");
    }

    if (
      !this.generatedCoordinates ||
      !Array.isArray(
        this.generatedCoordinates ||
          !Array.isArray(this.generatedCoordinates[0])
      )
    ) {
      this.generatedCoordinates =
        this.playerState.direction === "vertical"
          ? this.generateVerticalBlocks(
              coordinates,
              this.playerState.shipSize()
            )
          : this.generateHorizontalBlocks(
              coordinates,
              this.playerState.shipSize()
            );
    }

    const ship = this.shipInstance.retrieve(shipName);

    if (!this.validateBlocksForShip(this.generatedCoordinates)) {
      // Ship collision was detected during ship placement
      throw new Error("Collision detected! Place the ship in another cell");
    }

    // Register the ship in the designated block
    this.generatedCoordinates.forEach((pos) =>
      this.modifyBlockForShip(pos, ship.name)
    );

    // Update the ship instance with the location of the ship
    this.shipInstance.setCoordinates(ship.name, this.generatedCoordinates);

    // Update this property for computer's strategy
    this.remainingShipsCoordinates.set(ship.name, this.generatedCoordinates);
    this.generatedCoordinates = null;
  }

  validateBlocksForShip(arr) {
    // Check if all the coordinates in the array are empty to avoid collision

    if (!Array.isArray(arr)) {
      return null;
    }

    return arr.every(
      (coordinates) =>
        this.retrieveBlock(coordinates) &&
        !this.retrieveBlock(coordinates)[0].ship
    );
  }

  receiveAttack(coordinates) {
    if (!GameBoard.validateBlock(coordinates)) {
      throw new Error("Chosen location goes out of bounds!");
    }

    const [currentBlock] = this.retrieveBlock(coordinates);

    if (currentBlock.gotHit) {
      console.log("currentBlock:", currentBlock);
      console.log(
        "received coordinates:",
        coordinates,
        "sent by:",
        this.enemyState.name
      );

      // Doing nothing now instead of throwing an error
      // throw new Error("The block was already hit!");
      return;
    }

    currentBlock.gotHit = true;

    if (currentBlock.ship) {
      // Announce that a ship has been hit via the event bus
      const obj = this.shipInstance.hit(currentBlock.ship); // the method will return the necessary data for the event bus

      if (obj.event === "sunk") {
        // Target ship has sunk

        // For computer's next strategy
        this.updateEnemyState("ship-sunk", currentBlock.ship);

        this.updateRemainingShips(currentBlock.ship); // Update the remaining ships map
        obj.name = this.playerState.name; // Assign the owner of the sunk ship for announcement
        currentBlock.sunk = true;
      } else {
        // Last attack has hit a part of the ship
        // Assign the attacker's name for announcement
        this.updateEnemyState("ship-hit");
      }

      this.eventBus.publish(`${this.playerState.code}-announce`, obj);
    } else {
      this.updateEnemyState("hit");

      // Clear the text fields if the attack missed
      this.eventBus.publish(`${this.playerState.code}-announce`, {
        event: "hit",
      });
    }
  }

  updateRemainingShips(shipName) {
    if (!this.remainingShipsCoordinates.has(shipName)) {
      throw new Error(
        `Specified ship: ${shipName} already sunk - or doesn't exist`
      );
    }

    this.remainingShipsCoordinates.delete(shipName);

    if (this.remainingShipsCoordinates.size === 0) {
      this.enemyState.gameOver = true;
    }
  }

  updateEnemyState(feedback, shipName) {
    // To signal the DOM methods
    // Also used for computer's next move

    switch (feedback) {
      case "ship-hit": {
        this.enemyState.setEnemyShipAttacked();
        break;
      }

      case "ship-sunk": {
        this.enemyState.setEnemyShipSunk(
          this.remainingShipsCoordinates.get(shipName)
        );
        this.eventBus.publish(
          `${this.playerState.code}-sunk-visualizer`,
          shipName
        );
        break;
      }

      case "hit": {
        this.enemyState.setEnemyAttacked();
        break;
      }

      default: {
      }
    }
  }

  generateHorizontalBlocks(loc, shipSize) {
    if (!shipSize) {
      throw new Error("shipSize cannot be undefined!");
    }
    // Generate an array of coordinates ranging from 0-9
    let subtractCounter = 0;

    this.generatedCoordinates = Array.from({ length: shipSize }, (_, i) => {
      const addBase = loc[1] + i;

      if (addBase <= 9) {
        return [loc[0], addBase];
      }

      // Start generating coordinates decreasingly
      subtractCounter++;
      const subtractBase = loc[1] - subtractCounter;

      if (subtractBase >= 0) {
        return [loc[0], subtractBase];
      }

      return null;
    });

    return this.generatedCoordinates;
  }

  generateVerticalBlocks(loc, shipSize) {
    if (!shipSize) {
      throw new Error("shipSize cannot be undefined!");
    }

    let subtractCounter = 0;

    this.generatedCoordinates = Array.from({ length: shipSize }, (_, i) => {
      // Generates an output like [[0,1], [0,2], [0,3], [0,4], [0,5]]
      // The length of the generated array depends on the shipSize

      const addBase = loc[0] + i;

      if (addBase <= 9) {
        return [addBase, loc[1]];
      }

      // Start generating coordinates decreasingly
      subtractCounter++;
      const subtractBase = loc[0] - subtractCounter;

      if (subtractBase >= 0) {
        return [subtractBase, loc[1]];
      }

      return null;
    });

    return this.generatedCoordinates;
  }

  modifyBlockForShip(move, ship) {
    const currentPosition = this.retrieveBlock(move);

    // Retrieve the object in the array then add the ship property
    currentPosition[0].ship = ship;
  }

  retrieveBlock(coordinates) {
    // Checks if the given coordinates are within the game board bounds
    try {
      // returns an array that contains the object data
      return this.gameBoard[coordinates[0]][coordinates[1]];
    } catch (err) {
      // return undefined if the given move is out of bounds
      return undefined;
    }
  }
}
