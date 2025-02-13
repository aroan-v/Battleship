import Ship from "./ship";
import gameStateTracker from "../state/state";
import battleShipEventBus from "../state/event-bus";

export default class GameBoard {
  static generateGameBoard = () =>
    Array.from({ length: 10 }, () =>
      Array.from({ length: 10 }, () => [{ gotHit: false }])
    );

  // Checks if the given block is still within the game bounds.
  static validateBlock = (move) => move.every((elem) => elem >= 0 && elem <= 9);

  static generateVerticalBlocks(loc) {
    // Generate an array of coordinates ranging from 0-9

    let subtractCounter = 0;
    const size = gameStateTracker.shipSize();

    return Array.from({ length: size }, (_, i) => {
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
  }

  static generateHorizontalBlocks(loc) {
    // Generate an array of coordinates ranging from 0-9
    let subtractCounter = 0;
    const size = gameStateTracker.shipSize();

    return Array.from({ length: size }, (_, i) => {
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
  }

  constructor() {
    this.gameBoard = GameBoard.generateGameBoard(); // array of arrays
    this.ships = new Ship();
    this.shipTracker = new Map();
    this.sunkShips = null;
    this.missedAttacks = [];
    this.generatedCoordinates = null;
  }

  placeShip(target) {
    // Validate if the provided shipName is part of the ships
    const shipName = gameStateTracker.ship;
    this.ships.updateLastSelected(shipName);

    if (this.shipTracker.has(this.ships.lastSelected)) {
      throw new Error(`The ship: ${shipName} has already been registered`);
    }

    if (!GameBoard.validateBlock(target)) {
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
        gameStateTracker.dir === "vertical"
          ? this.generateVerticalBlocks(target)
          : this.generateHorizontalBlocks(target);
    }

    const ship = this.ships.retrieve(shipName);

    if (!this.validateBlocksForShip(this.generatedCoordinates)) {
      throw new Error("Collision detected! Place the ship in another cell");
    }

    this.generatedCoordinates.forEach((pos) =>
      this.modifyBlockForShip(pos, ship.name)
    );
    this.shipTracker.set(ship.name, this.generatedCoordinates);
    this.generatedCoordinates = null;
  }

  validateBlocksForShip(arr) {
    // Check if all the coordinates in the array are empty to avoid collision

    if (!Array.isArray(arr)) {
      return null;
    }

    return arr.every(
      (cell) => this.retrieveBlock(cell) && !this.retrieveBlock(cell)[0].ship
    );
  }

  receiveAttack(move) {
    if (!GameBoard.validateBlock(move)) {
      throw new Error("Chosen location goes out of bounds!");
    }

    const [currentBlock] = this.retrieveBlock(move);

    if (currentBlock.gotHit) {
      throw new Error("The block was already hit!");
    }

    gameStateTracker.lastAttack.attStatus = true;

    if (currentBlock.ship) {
      battleShipEventBus.publish("announce", this.ships.hit(currentBlock.ship));
      gameStateTracker.lastAttack.shipPresent = true;
      return;
    }

    battleShipEventBus.publish("announce", { event: "miss" });
  }

  generateHorizontalBlocks(loc) {
    // Generate an array of coordinates ranging from 0-9
    let subtractCounter = 0;
    const size = gameStateTracker.shipSize();

    this.generatedCoordinates = Array.from({ length: size }, (_, i) => {
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

  generateVerticalBlocks(loc) {
    // Generate an array of coordinates ranging from 0-9
    let subtractCounter = 0;
    const size = gameStateTracker.shipSize();

    this.generatedCoordinates = Array.from({ length: size }, (_, i) => {
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

  retrieveBlock(move) {
    try {
      // returns an array
      return this.gameBoard[move[0]][move[1]];
    } catch (err) {
      // return undefined if the given move is out of bounds
      return undefined;
    }
  }
}
