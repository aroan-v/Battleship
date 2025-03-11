export default class ComputerLogic {
  static generateRandomCoordinates() {
    return [Math.trunc(Math.random() * 10), Math.trunc(Math.random() * 10)];
  }

  static generateAllCoordinates() {
    const allCoordinates = [];

    for (let i = 0; i <= 9; i++) {
      for (let j = 0; j <= 9; j++) {
        allCoordinates.push(JSON.stringify([i, j]));
      }
    }

    return allCoordinates;
  }

  static generateOffsetCoordinates() {
    return [
      {
        direction: "right",
        coordinates: [0, 1],
        opposite: [0, -1],
      },

      {
        direction: "left",
        coordinates: [0, -1],
        opposite: [0, 1],
      },
      {
        direction: "down",
        coordinates: [1, 0],
        opposite: [-1, 0],
      },

      {
        direction: "up",
        coordinates: [-1, 0],
        opposite: [1, 0],
      },
    ];
  }

  constructor() {
    this.remainingMoves = new Set(ComputerLogic.generateAllCoordinates());
    this.successfulHitShips = [];
    this.previousMove = null;
    this.legacyMove = null;

    this.currentStrategy = "random";

    // For tracking the adjacent moves in 'search-body' strategy
    this.legacyOffsetQueue = [];
    this.currentOffset = [];
  }

  previousMoveFeedback(feedback, coordinates) {
    // Analyze feedback from previous move

    switch (feedback) {
      case "ship-hit": {
        this.successfulHitShips.push(this.previousMove);
        // determine if it needs to keep searching for another part of the ship by checking the adjacent blocks
        // or if it needs to start sinking the ship by going in one direction
        if (this.currentStrategy === "random") {
          this.initializeLegacyMove();
        } else if (this.currentStrategy === "search-body") {
          this.currentStrategy = "sink-ship";
        } else if (this.currentStrategy === "sink-ship-opposite-transition") {
          this.currentStrategy = "sink-ship-opposite";
        }
        break;
      }

      case "ship-sunk": {
        this.updateHitShipsTracker(coordinates);

        if (this.successfulHitShips.length !== 0) {
          // Remaining unsunk ships are still on the board — prepare for next move.
          this.initializeLegacyMove("new");
        } else {
          // Reset the overall logic back to generating random moves
          this.currentStrategy = "random";
          this.legacyMove = null;
          this.legacyOffsetQueue.length = 0;
          this.currentOffset.length = 0;
        }

        break;
      }

      case "hit": {
        if (this.currentStrategy === "sink-ship") {
          this.currentStrategy = "sink-ship-opposite-transition";
        } else if (this.currentStrategy === "sink-ship-opposite") {
          this.initializeLegacyMove("new");
        }
        break;
      }

      default:
    }
  }

  updateHitShipsTracker(coordinates) {
    if (!Array.isArray(coordinates)) {
      console.log("coordinates:", coordinates);
      throw new Error("Expected an array of arrays!");
    }

    // Stringify the argument then put it in a set
    const coordinateString = new Set(
      coordinates.map((array) => JSON.stringify(array))
    );

    // Filter out all the coordinates present from the sunk ship
    this.successfulHitShips = this.successfulHitShips.filter(
      (hitShipMoves) => !coordinateString.has(JSON.stringify(hitShipMoves))
    );
  }

  initializeLegacyMove(code, turn) {
    // Check if there are still ships need to be sunk
    if (this.successfulHitShips.length === 0) {
      throw new Error(
        "No more successful hit ships - revert back to generating randoms"
      );
    }

    this.legacyOffsetQueue = ComputerLogic.generateOffsetCoordinates();
    this.currentStrategy = "search-body";

    if (code === "new") {
      this.legacyMove = this.successfulHitShips[0];
    } else {
      this.legacyMove = this.previousMove;
    }

    // Checks if it's still the computer's turn to move
    // If yes, then produce the move right now
    // If not, then the next move will follow the strategy prepared by this method
    if (turn === "current") {
      this.determineNextMove();
    }
  }

  determineNextMove = () => {
    switch (this.currentStrategy) {
      case "random": {
        this.generateRandomCoordinates();
        break;
      }

      case "search-body": {
        // Last attack randomly hit a part of the ship
        // Must search the right, left, down, and up adjacent moves to find the rest of the ship
        this.generateAdjacentCoordinates();
        break;
      }

      case "sink-ship": {
        // Successfully found the body of the ship
        // Continue attacking in the same adjacent direction until the ship sinks
        // If the ship suddenly ends, switch to sink-ship-opposite transition strategy
        this.generateDirectionalCoordinates(
          this.calculateSameDirectionCoordinates()
        );
        break;
      }

      case "sink-ship-opposite-transition": {
        // Still in the process of sinking a ship
        // Go back to the legacy move and check the opposite direction originally used in the sink-ship strategy
        this.generateDirectionalCoordinates(
          this.calculateInitialOppositeDirectionCoordinates()
        );
        break;
      }

      case "sink-ship-opposite": {
        // Successfully found the body of the ship
        // Continue attacking in the same opposite direction until the ship sinks
        this.generateDirectionalCoordinates(
          this.calculateOppositeDirectionCoordinates()
        );
        break;
      }

      default: {
        throw new Error(
          `Invalid strategy: ${this.currentStrategy} - Please put a strategy for computer"s next move!`
        );
      }
    }

    // previousMove will be updated by the methods above
    return this.previousMove;
  };

  extractMoveFromQueue() {
    this.previousMove = this.moveQueue.shift();
    return this.previousMove;
  }

  generateRandomCoordinates() {
    // Extract a random coordinate then turn the string into an array of numbers format
    const randomIndex = Math.floor(Math.random() * this.remainingMoves.size);
    this.previousMove = this.extractValidMove(randomIndex);
  }

  generateAdjacentCoordinates() {
    if (!this.legacyMove) {
      throw new Error("No legacy move! Revisit the strategy");
    }

    let adjacentMove = null;
    let adjacentMovesCounter = 0;

    while (!adjacentMove && adjacentMovesCounter < 4) {
      // Validate if the adjacent move is still available
      const value = this.calculateAdjacentMove();
      adjacentMove = this.updateRemainingMoves(JSON.stringify(value));
      adjacentMovesCounter++;
    }

    adjacentMove = JSON.parse(adjacentMove);

    if (!adjacentMove || !Array.isArray(adjacentMove)) {
      // Reassign the legacy move to a new unsunk ship and search its adjacent blocks
      this.initializeLegacyMove("new", "current");
      return;
    }

    this.previousMove = adjacentMove;
  }

  calculateAdjacentMove() {
    if (this.legacyOffsetQueue.length === 0) {
      return undefined;
    }

    // Reassign the offset calculations to this property for future use
    this.currentOffset = this.legacyOffsetQueue.shift();

    const value1 = this.currentOffset.coordinates[0] + this.legacyMove[0];
    const value2 = this.currentOffset.coordinates[1] + this.legacyMove[1];

    if (value1 < 0 || value2 < 0 || value1 > 9 || value2 > 9) {
      return undefined;
    }

    // Returns an array of number coordinates
    // [4,2]
    return [value1, value2];
  }

  extractValidMove(index) {
    if (this.remainingMoves.size === 0) {
      throw new Error("No more moves left!");
    }

    if (index < 0 || this.remainingMoves.size < index) {
      return undefined;
    }

    const convertedArray = [...this.remainingMoves];
    this.remainingMoves.delete(convertedArray[index]);

    // '[4,2]' becomes [4,2]
    return JSON.parse(convertedArray[index]);
  }

  updateRemainingMoves(string) {
    // Expects something like '[4,2]' as an argument
    if (!this.remainingMoves.has(string)) {
      return undefined;
    }

    // Update the tracker
    this.remainingMoves.delete(string);
    return string;
  }

  calculateSameDirectionCoordinates() {
    // Continues moving in the same direction as the previous move.
    return [
      this.currentOffset.coordinates[0] + this.previousMove[0],
      this.currentOffset.coordinates[1] + this.previousMove[1],
    ];
  }

  calculateInitialOppositeDirectionCoordinates() {
    // Go back to the legacy move and start moving in opposite direction
    return [
      this.currentOffset.opposite[0] + this.legacyMove[0],
      this.currentOffset.opposite[1] + this.legacyMove[1],
    ];
  }

  calculateOppositeDirectionCoordinates() {
    // Continues moving in the same opposite direction as the previous move.
    return [
      this.currentOffset.opposite[0] + this.previousMove[0],
      this.currentOffset.opposite[1] + this.previousMove[1],
    ];
  }

  generateDirectionalCoordinates(calculatedCoordinates) {
    if (!Array.isArray(calculatedCoordinates) || !calculatedCoordinates) {
      throw new Error("Invalid argument passed! It should be an array");
    }

    let finalProposedMove = null;

    // Validate the proposed move if it still exists
    finalProposedMove = this.updateRemainingMoves(
      JSON.stringify(calculatedCoordinates)
    );

    // Failed to target the next move, go back to the legacy move
    if (!finalProposedMove) {
      this.initializeLegacyMove("new", "current");
      return;
    }

    this.previousMove = JSON.parse(finalProposedMove);
  }
}
