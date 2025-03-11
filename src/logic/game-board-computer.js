import GameBoard from "./gameboard";

export default class GameBoardComputer extends GameBoard {
  static generateDirection() {
    const randomDirection = Math.floor(Math.random() * 2)
      ? "vertical"
      : "horizontal";

    return randomDirection;
  }

  static generateRandomCoordinates() {
    return [Math.trunc(Math.random() * 10), Math.trunc(Math.random() * 10)];
  }

  constructor(playerState, eventBus, enemyState, shipInstance) {
    super(playerState, eventBus, enemyState, shipInstance);

    this.eventBus.subscribe("place-computer-ship", this.computerPlaceShip);
  }

  updateGeneratedCoordinates(shipSize) {
    if (!shipSize) {
      throw new Error("No ship size provided!");
    }
    let currentBlocks = null;
    let validAdjacentBlocks = false;

    // Keep generating new random coordinates that will produce a valid set of blocks
    while (!validAdjacentBlocks) {
      const currentCoordinates = GameBoardComputer.generateRandomCoordinates();
      currentBlocks =
        GameBoardComputer.generateDirection() === "vertical"
          ? super.generateVerticalBlocks(currentCoordinates, shipSize)
          : super.generateHorizontalBlocks(currentCoordinates, shipSize);

      validAdjacentBlocks = this.validateBlocksForShipUpgraded(currentBlocks);
    }

    this.generatedCoordinates = currentBlocks;
  }

  validateBlocksForShipUpgraded(coordinates) {
    // In this upgraded version of block validation, the target block and its adjacent blocks must be empty
    // The surrounding blocks can be out of bounds.
    // But the target block must still be within bounds.
    // Both blocks must be empty of the ship property.
    // So when checking the surrounding blocks, it cannot be both within bounds and has a ship property.

    const surroundingBlocks = [
      [-1, 1],
      [0, 1],
      [1, 1],
      [-1, 0],
      [0, 0],
      [1, 0],
      [-1, -1],
      [0, -1],
      [1, -1],
    ];

    const validatedBlocks = super.validateBlocksForShip(coordinates);

    if (!validatedBlocks) {
      return undefined;
    }

    return coordinates.every((shipCoordinates) =>
      // Apply the coordinates in each array
      // Check if array if they don't have any ship
      surroundingBlocks
        .map((offset) => [
          offset[0] + shipCoordinates[0],
          offset[1] + shipCoordinates[1],
        ])
        .every((newCoordinates) => {
          if (!super.retrieveBlock(newCoordinates)) {
            // New coordinates are out of bounds which is okay for adjacent blocks
            return true;
          }

          if (!this.retrieveBlock(newCoordinates)[0].ship) {
            // Adjacent blocks must not contain the ship property
            return true;
          }

          return false;
        })
    );
  }

  computerPlaceShip = (shipObject) => {
    if (shipObject.location.length !== 0) {
      throw new Error("A ship has already been placed!");
    }

    // Generate the placement of the ship based on its size
    this.updateGeneratedCoordinates(shipObject.size);
    this.remainingShipsCoordinates.set(
      shipObject.name,
      this.generatedCoordinates
    );

    // Place the ship's name in the designated block
    this.generatedCoordinates.forEach((pos) => {
      super.modifyBlockForShip(pos, shipObject.name);
    });

    // Update the ship's location in the ship object
    this.shipInstance.setCoordinates(
      shipObject.name,
      this.generatedCoordinates
    );
    this.generatedCoordinates = null;

    // For Cheating - to show where the computers placed the ships
    this.eventBus.publish(`${this.playerState.code}-reveal-computer-ships`);

    // Signal for the next ship placement
    this.eventBus.publish(`${this.playerState.code}-cycle-ships`);
  };
}
