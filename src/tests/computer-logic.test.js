import ComputerLogic from "../logic/computer-logic";
import GameBoard from "../logic/gameboard";
import Ship from "../logic/ship";

let computerLogic;

beforeEach(() => {
  computerLogic = new ComputerLogic(); // Fresh instance before each test
});

describe("Test the core logic strategy", () => {
  let leftAdjacentMove, rightAdjacentMove, upAdjacentMove, downAdjacentMove;
  beforeEach(() => {
    computerLogic = new ComputerLogic(); // Fresh instance before each test

    // Set the starting state common for tests.
    // For example, setting previousMove and providing initial feedback.
    computerLogic.previousMove = [5, 5];
    computerLogic.previousMoveFeedback("ship-hit");

    leftAdjacentMove = [
      // left offset
      computerLogic.previousMove[0],
      computerLogic.previousMove[1] + 1,
    ];
    rightAdjacentMove = [
      // right offset
      computerLogic.previousMove[0],
      computerLogic.previousMove[1] - 1,
    ];

    upAdjacentMove = [
      // up offset
      computerLogic.previousMove[0] + 1,
      computerLogic.previousMove[1],
    ];

    downAdjacentMove = [
      // down offset
      computerLogic.previousMove[0] - 1,
      computerLogic.previousMove[1],
    ];
  });

  test("Next move generated should be adjacent to the previous move", () => {
    // Expect legacy move to be reassigned with the previous move since the attack successfully hit a ship
    expect(computerLogic.legacyMove).toEqual(computerLogic.previousMove);

    // Strategy should change from 'random' to 'search-body'
    expect(computerLogic.currentStrategy).toBe("search-body");

    // Next move should be right offset
    expect(computerLogic.determineNextMove()).toEqual(leftAdjacentMove);
  });

  test("Generate a 2nd adjacent move if the 1st adjacent move didn't hit a ship", () => {
    // Going back from the legacy move, fire the right offset again
    expect(computerLogic.determineNextMove()).toEqual(leftAdjacentMove);

    // Simulate a "hit" feedback based on the previous move
    // "hit" means it didn't hit any part of the ship so it has to keep searching for valid adjacent moves
    computerLogic.previousMoveFeedback("hit");

    // Next move should be the the right offset
    expect(computerLogic.determineNextMove()).toEqual(rightAdjacentMove);

    // Current offset should be the second one as the first has already been discarded.
    expect(computerLogic.currentOffset.coordinates).toEqual([0, -1]);

    // The remaining adjacent queue length should be 2
    // Since right and left has already been used, the remaining offsets are up and down.
    expect(computerLogic.legacyOffsetQueue.length).toBe(2);
  });

  test("Generate the 4th adjacent move if the first three adjacent moves didn't hit a ship", () => {
    // Generate the right offset
    computerLogic.determineNextMove();

    // Simulate a "hit" feedback based on the previous move
    computerLogic.previousMoveFeedback("hit");

    // Generate the right offset
    computerLogic.determineNextMove();

    // Simulate the 'ship-hit feedback based on the previous move
    computerLogic.previousMoveFeedback("hit");

    // Generate the up offset
    computerLogic.determineNextMove();

    // Simulate the 'ship-hit feedback based on the previous move
    computerLogic.previousMoveFeedback("hit");

    expect(computerLogic.determineNextMove()).toEqual(downAdjacentMove);

    // All four offsets has been used, the array should be empty at this point
    expect(computerLogic.legacyOffsetQueue.length).toBe(0);

    // Last offset should be saved, which will be used to keep reapplying the directional offset
    expect(computerLogic.currentOffset.coordinates).toEqual([-1, 0]);
  });

  test("Use the same offset calculations if the adjacent move manages to hit the ship", () => {
    // Generate the right offset
    computerLogic.determineNextMove();

    // Simulate the 'ship-hit feedback based on the previous move
    computerLogic.previousMoveFeedback("ship-hit");

    // Compute for the block 2 moves from the right of the legacy move
    const targetBlock = [
      computerLogic.legacyMove[0],
      computerLogic.legacyMove[1] + 2,
    ];

    expect(computerLogic.determineNextMove()).toEqual(targetBlock);
  });

  test("Change strategy to 'sink-ship after successfully hitting the body of the ship through adjacent moves", () => {
    // Generate the right offset
    const nextMove = computerLogic.determineNextMove();

    // Simulate the 'ship-hit feedback based on the previous move
    computerLogic.previousMoveFeedback("ship-hit");

    // Switch strategies
    expect(computerLogic.currentStrategy).toBe("sink-ship");

    // Make sure that the previousMove property is updated
    expect(computerLogic.previousMove).toEqual(nextMove);
  });

  test("Keep traversing the same direction as long as the feedback is ship-hit", () => {
    // Generate the right offset
    computerLogic.determineNextMove();

    // Simulate a "hit" feedback based on the previous move
    computerLogic.previousMoveFeedback("hit");

    // Generate the right offset
    computerLogic.determineNextMove();

    // Simulate a "hit" feedback based on the previous move
    computerLogic.previousMoveFeedback("hit");

    // Generate the up offset
    computerLogic.determineNextMove();

    // Simulate a "ship-hit" feedback based on the previous move
    computerLogic.previousMoveFeedback("ship-hit");

    // Compute for the block - 2 moves above the legacy move
    const twoBlocksAbove = [
      computerLogic.legacyMove[0] + 2,
      computerLogic.legacyMove[1],
    ];

    // Check first if the currentOffset property aligns with the add offset
    expect(computerLogic.currentOffset.coordinates).toEqual([1, 0]);

    const spy = jest.spyOn(computerLogic, "generateDirectionalCoordinates");
    const nextMove = computerLogic.determineNextMove();
    expect(nextMove).toEqual(twoBlocksAbove);
    expect(spy).toHaveBeenCalledTimes(1);

    // Simulate a "ship-hit" feedback based on the previous move
    computerLogic.previousMoveFeedback("ship-hit");

    // Compute for the block - 3 moves above the legacy move
    const secondTargetBlock = [
      computerLogic.legacyMove[0] + 3,
      computerLogic.legacyMove[1],
    ];

    expect(computerLogic.determineNextMove()).toEqual(secondTargetBlock);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  test('Switch directions if the feedback returns "hit" while on "sink-ship mode', () => {
    // Generate the right offset
    computerLogic.determineNextMove();

    // Simulate a "ship-hit" feedback based on the previous move
    computerLogic.previousMoveFeedback("ship-hit");

    // Traverse the same direction based from the last offset
    expect(computerLogic.currentOffset.direction).toBe("right");

    // Generate the right move of the last move
    computerLogic.determineNextMove();

    // Simulate 'hit' feedback
    computerLogic.previousMoveFeedback("hit");

    // Change strategy and use the opposite of the currentOffset direction
    // Also must go back to the legacy move's position

    const oppositeOffset = [
      computerLogic.legacyMove[0],
      computerLogic.legacyMove[1] - 1,
    ];

    // Maintain the direction, but use the 'opposite' property of the currentOffset object
    expect(computerLogic.currentOffset.direction).toBe("right");
    expect(computerLogic.currentStrategy).toBe("sink-ship-opposite-transition");
    expect(computerLogic.determineNextMove()).toEqual(oppositeOffset);
  });

  test("Keep traversing the opposite direction for future moves after switching", () => {
    // Generate the right offset
    computerLogic.determineNextMove();
    computerLogic.previousMoveFeedback("ship-hit");
    computerLogic.determineNextMove();
    computerLogic.previousMoveFeedback("hit");

    // Switch to the left direction by this point
    computerLogic.determineNextMove();

    // Simulate the continuation of hitting a ship after going the opposite direction from the legacy move
    computerLogic.previousMoveFeedback("ship-hit");

    const twoBlocksRightFromLegacy = [
      computerLogic.legacyMove[0],
      computerLogic.legacyMove[1] - 2,
    ];

    expect(computerLogic.determineNextMove()).toEqual(twoBlocksRightFromLegacy);

    // Simulate the continuation of hitting a ship after going the opposite direction from the legacy move
    computerLogic.previousMoveFeedback("ship-hit");

    const threeBlocksRightFromLegacy = [
      computerLogic.legacyMove[0],
      computerLogic.legacyMove[1] - 3,
    ];

    expect(computerLogic.determineNextMove()).toEqual(
      threeBlocksRightFromLegacy
    );
  });

  test("Revert back to generating random valid coordinates after receiving sink-ship feedback", () => {
    // Simulate the logic receiving 'ship-hit feedback, activating the strategy 'sink-ship'
    computerLogic.previousMoveFeedback("ship-hit");

    // Simulate the coordinates of the sunk ship
    const sunkShip = [
      [3, 3],
      [4, 3],
      [5, 3],
      [6, 3],
      [5, 5],
    ];

    // Simulate the logic receiving 'ship-sunk'
    computerLogic.previousMoveFeedback("ship-sunk", sunkShip);
    expect(computerLogic.successfulHitShips.length).toBe(0);

    expect(computerLogic.currentStrategy).toBe("random");
    expect(computerLogic.legacyMove).toBeNull();
    expect(computerLogic.legacyOffsetQueue.length).toBe(0);
    expect(computerLogic.currentOffset.length).toBe(0);

    const spy = jest.spyOn(computerLogic, "generateRandomCoordinates");

    computerLogic.determineNextMove();

    // Test if the next move generated is random
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test("Should invoke extractValidMove five times during a complete ship sinking sequence", () => {
    const spy = jest.spyOn(computerLogic, "extractValidMove");
    const spyValidateMove = jest.spyOn(computerLogic, "updateRemainingMoves");

    // Simulate the computer sinking the Cruiser which has a size of 5
    // Therefore the 'ship-hit' feedback must be called 3 times, with the 4th being 'ship-sunk'

    expect(computerLogic.currentStrategy).toBe("search-body");
    computerLogic.determineNextMove();

    // Meet the prerequisites for 'search-body' move method
    computerLogic.previousMoveFeedback("ship-hit");
    expect(computerLogic.currentStrategy).toBe("sink-ship");
    computerLogic.determineNextMove();

    // Meet the prerequisites for 'sink-ship' move method
    computerLogic.previousMoveFeedback("ship-hit");
    expect(computerLogic.currentStrategy).toBe("sink-ship");
    computerLogic.determineNextMove();

    // Meet the prerequisites for 'sink-ship-opposite-transition' move method
    computerLogic.previousMoveFeedback("hit");
    expect(computerLogic.currentStrategy).toBe("sink-ship-opposite-transition");
    computerLogic.determineNextMove();

    // Meet the prerequisites for 'sink-ship-opposite' move method
    computerLogic.previousMoveFeedback("ship-hit");
    expect(computerLogic.currentStrategy).toBe("sink-ship-opposite");
    computerLogic.determineNextMove();

    // Meet the prerequisites for 'sink-ship-opposite' move method

    // Simulate the coordinates of the sunk ship
    const sunkShip = [
      [5, 5],
      [5, 6],
      [5, 7],
      [5, 4],
    ];

    computerLogic.previousMoveFeedback("ship-sunk", sunkShip);
    computerLogic.determineNextMove();
    expect(computerLogic.currentStrategy).toBe("random");

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spyValidateMove).toHaveBeenCalledTimes(5);
  });

  // In the core logic, all the move generating methods must use the extract valid move method
});

describe("Testing the edge cases", () => {
  let leftAdjacentMove, rightAdjacentMove, upAdjacentMove, downAdjacentMove;
  beforeEach(() => {
    computerLogic = new ComputerLogic(); // Fresh instance before each test

    // Set the starting state common for tests.
    // For example, setting previousMove and providing initial feedback.
    computerLogic.previousMove = [0, 0];
    computerLogic.previousMoveFeedback("ship-hit");

    rightAdjacentMove = [
      // right offset
      computerLogic.previousMove[0],
      computerLogic.previousMove[1] + 1,
    ];
    leftAdjacentMove = [
      // right offset
      computerLogic.previousMove[0],
      computerLogic.previousMove[1] - 1,
    ];

    upAdjacentMove = [
      // up offset
      computerLogic.previousMove[0] - 1,
      computerLogic.previousMove[1],
    ];

    downAdjacentMove = [
      // down offset
      computerLogic.previousMove[0] + 1,
      computerLogic.previousMove[1],
    ];
  });
  test("Handle a case where the generated adjacent move goes out of bounds", () => {
    // Simulate right adjacent move missing the ship
    computerLogic.determineNextMove();
    computerLogic.previousMoveFeedback("hit");

    // The next move generated should be down offset from the legacy move
    computerLogic.determineNextMove();
    expect(computerLogic.previousMove).toEqual(downAdjacentMove);
  });

  test("Handle a case where the generated adjacent move goes out of bounds", () => {
    // Simulate right adjacent move missing the ship
    computerLogic.determineNextMove();
    computerLogic.previousMoveFeedback("hit");

    // The next move generated should be down offset from the legacy move
    computerLogic.determineNextMove();
    expect(computerLogic.previousMove).toEqual(downAdjacentMove);
  });

  // Maybe if we get more than 5 sink ships, lets reevaluate because 5 should be the max consecutive ship attacks, unless there are ships that are linked together?
  // Now what if in calculateInitialOppositeDirectionCoordinates - the block is invalid?
  // Make a test where the coordinate generating methods will exhaust all the supply of given moves
  // Test where it should reset even with other strategies
  // Test the offset moves queue running out
  // Test a scenario in which the during search body strategy, the adjacent move gave a different ship's body
  // Test a scenario in which all four adjacent moves didn't hit a ship
  // After sink body is given, sweep the ship for untouched / sunk ships
  // Test a scenario in which it has not gotten a sunk ship feedback after already switching positions (extreme)
});

describe("Test the cases where the enemy ships are sitting right next to each other", () => {
  let gameBoard;
  let shipInstance;
  const ships = [];

  beforeEach(() => {
    computerLogic = new ComputerLogic();
    gameBoard = new GameBoard(null, null, null, shipInstance);
    shipInstance = new Ship();

    computerLogic.previousMove = [3, 3];
    // Enemy ship coordinates
    // Carrier: [3,3], [4,3], [5,3], [6,3], [7,3]
    // Battleship: [4,4], [5,4], [5,3], [6,3]

    ships.push(
      {
        shipName: "carrier",
        coordinates: [
          [3, 3],
          [4, 3],
          [5, 3],
          [6, 3],
          [7, 3],
        ],
      },
      {
        shipName: "battleship",
        coordinates: [
          [4, 4],
          [5, 4],
          [6, 4],
          [7, 4],
        ],
      }
    );

    ships.forEach((obj) => {
      obj.coordinates.forEach((array) => {
        gameBoard.modifyBlockForShip(array, obj.shipName);
      });

      gameBoard.remainingShipsCoordinates.set(obj.shipName, obj.coordinates);
    });

    gameBoard.enemyState = {
      setEnemyShipSunk: jest.fn().mockImplementation((coordinates) => {
        computerLogic.previousMoveFeedback("ship-sunk", coordinates);
      }),
      setEnemyShipAttacked: jest.fn().mockImplementation(() => {
        computerLogic.previousMoveFeedback("ship-hit");
      }),

      setEnemyAttacked: jest.fn().mockImplementation(() => {
        computerLogic.previousMoveFeedback("hit");
      }),
    };

    gameBoard.eventBus = {
      publish: jest.fn(),
    };

    gameBoard.playerState = {
      name: "tester",
      code: "tester",
    };
  });

  test("Fire a missed attack and check it gets registered in the computer logic and the game board", () => {
    const spy = jest.spyOn(computerLogic, "previousMoveFeedback");

    jest
      .spyOn(computerLogic, "generateRandomCoordinates")
      .mockImplementationOnce(() => {
        computerLogic.previousMove = JSON.parse(
          computerLogic.updateRemainingMoves("[5,5]")
        );
      });

    gameBoard.receiveAttack(computerLogic.determineNextMove());

    // Confirm if the computer logic registered the attack
    expect(spy).toHaveBeenCalledTimes(1);
    expect(computerLogic.currentStrategy).toBe("random");
    expect(computerLogic.remainingMoves.size).toBe(99);
    expect(computerLogic.previousMove).toEqual([5, 5]);

    // Confirm if the game board received the attack
    expect(gameBoard.retrieveBlock([5, 5])[0].gotHit).toBeTruthy();
  });

  test("Fire an attack that hits a ship and check if the computer logic and the game board responds accordingly", () => {
    // Mock an initial not-so-random attack to the specified coordinates
    jest
      .spyOn(computerLogic, "generateRandomCoordinates")
      .mockImplementationOnce(() => {
        computerLogic.previousMove = JSON.parse(
          computerLogic.updateRemainingMoves("[3,3]")
        );
      });

    const spyGameBoard = jest.spyOn(gameBoard, "receiveAttack");

    gameBoard.receiveAttack(computerLogic.determineNextMove());

    expect(spyGameBoard.mock.calls).toEqual([[[3, 3]]]);

    // Check if the computer logic registers the attack
    expect(computerLogic.currentStrategy).toBe("search-body");
    expect(computerLogic.legacyMove).toEqual([3, 3]);
  });

  test("Sink the carrier ship", () => {
    // Carrier: [3,3], [4,3], [5,3], [6,3], [7,3]
    // Battleship: [4,4], [5,4], [5,3], [6,3]

    // Mock the initial random attack with a predetermined move
    jest
      .spyOn(computerLogic, "generateRandomCoordinates")
      .mockImplementationOnce(() => {
        computerLogic.previousMove = JSON.parse(
          computerLogic.updateRemainingMoves("[3,3]")
        );
      });

    const spyGameBoard = jest.spyOn(gameBoard, "receiveAttack");

    // Receive the [3,3] attack - initial
    gameBoard.receiveAttack(computerLogic.determineNextMove());

    // Receive the [3,4] attack - right adjacent
    gameBoard.receiveAttack(computerLogic.determineNextMove());

    // Receive the [3,2] attack - left adjacent
    gameBoard.receiveAttack(computerLogic.determineNextMove());

    // Confirm if the coordinates are recorded
    expect(computerLogic.successfulHitShips).toEqual([[3, 3]]);

    // Sink the ship by continuing the attack downward
    gameBoard.receiveAttack(computerLogic.determineNextMove()); // ship part confirmed

    gameBoard.receiveAttack(computerLogic.determineNextMove());
    gameBoard.receiveAttack(computerLogic.determineNextMove());
    gameBoard.receiveAttack(computerLogic.determineNextMove());

    // Confirm if the game board registered the attacks
    expect(spyGameBoard.mock.calls).toEqual([
      [[3, 3]],
      [[3, 4]],
      [[3, 2]],
      [[4, 3]],
      [[5, 3]],
      [[6, 3]],
      [[7, 3]],
    ]);

    // Confirm if the computer logic registered the 'ship-sunk' feedback
    expect(computerLogic.legacyMove).toBeNull();
    expect(computerLogic.currentStrategy).toBe("random");
    expect(computerLogic.successfulHitShips).toEqual([]);
    expect(computerLogic.remainingMoves.size).toBe(93);
  });

  test("Handle a case where two ships are right next to each other", () => {
    // Simulate [3,3] hit successfully hitting a ship
    computerLogic.previousMoveFeedback("ship-hit");
    expect(computerLogic.legacyMove).toEqual([3, 3]);

    // Enter the search-body strategy
    expect(computerLogic.currentStrategy).toBe("search-body");

    // Simulate the adjacent move to the right
    computerLogic.determineNextMove();
    const [value1, value2] = computerLogic.legacyMove;
    expect(computerLogic.previousMove).toEqual([value1, value2 + 1]);
    computerLogic.previousMoveFeedback("hit");

    // Simulate the adjacent move to the left
    computerLogic.determineNextMove();
    expect(computerLogic.previousMove).toEqual([value1, value2 - 1]);
    computerLogic.previousMoveFeedback("ship-hit");

    // Enter sink-ship strategy upon getting a 'ship-hit' feedback during 'search-body' strategy
    expect(computerLogic.currentStrategy).toBe("sink-ship");

    // Simulate the continuation to the left
    computerLogic.determineNextMove();
    expect(computerLogic.previousMove).toEqual([value1, value2 - 2]);
    computerLogic.previousMoveFeedback("hit");

    // Since we are already in sink-ship mode, and upon receiving the 'hit' feedback
    // rely on the legacy move to generate new coordinates

    computerLogic.determineNextMove();
    const [value7, value8] = computerLogic.legacyMove;
    expect(computerLogic.previousMove).toEqual([value7 + 1, value8]);
    computerLogic.previousMoveFeedback("hit");
  });

  test("Sink two ships that are right next to each other", () => {
    // Carrier: [3,3], [4,3], [5,3], [6,3], [7,3]
    // Battleship: [4,4], [5,4], [5,3], [6,3]

    const initialMove = [4, 3];

    // Mock the initial random attack with a predetermined move
    jest
      .spyOn(computerLogic, "generateRandomCoordinates")
      .mockImplementationOnce(() => {
        computerLogic.previousMove = JSON.parse(
          computerLogic.updateRemainingMoves(JSON.stringify(initialMove))
        );
      });

    const [value1, value2] = initialMove;

    const spyGameBoard = jest.spyOn(gameBoard, "receiveAttack");
    const spyPreviousMoveFeedback = jest.spyOn(
      computerLogic,
      "previousMoveFeedback"
    );

    // Receive the [4,3] attack - initial
    gameBoard.receiveAttack(computerLogic.determineNextMove());

    // Upon entering the adjacent move state, the next move (to the right) will hit the ship beside it
    gameBoard.receiveAttack(computerLogic.determineNextMove());

    // Confirm if the game board registered the attacks
    expect(spyGameBoard.mock.calls).toEqual([
      [initialMove],
      [[value1, value2 + 1]],
    ]);

    // Last move should give a feedback of 'ship-hit' so technically it should keep attacking the same direction
    gameBoard.receiveAttack(computerLogic.determineNextMove());

    // 3rd attack (2nd index) should be a continuation but will get a 'hit' feedback
    expect(spyGameBoard.mock.calls[2][0]).toEqual([value1, value2 + 2]);
    expect(computerLogic.currentStrategy).toBe("sink-ship-opposite-transition");

    // 4th attack (3rd index) - Will go the opposite direction but it will it empty
    gameBoard.receiveAttack(computerLogic.determineNextMove());
    expect(spyGameBoard.mock.calls[3][0]).toEqual([4, 2]);
    expect(spyPreviousMoveFeedback.mock.calls[3][0]).toBe("hit");

    // Reassign back to the search-body strategy
    // Go back to the legacy move and search for more valid blocks
    expect(computerLogic.currentStrategy).toBe("sink-ship-opposite-transition");

    // 5th attack (4th index)
    gameBoard.receiveAttack(computerLogic.determineNextMove());
    expect(spyGameBoard.mock.calls[4][0]).toEqual([5, 3]);

    // 6th attack (5th index)
    gameBoard.receiveAttack(computerLogic.determineNextMove());
    expect(spyGameBoard.mock.calls[5][0]).toEqual([6, 3]);

    // 7th attack (6th index)
    gameBoard.receiveAttack(computerLogic.determineNextMove());
    expect(spyGameBoard.mock.calls[6][0]).toEqual([7, 3]);

    // 8th attack (7th call index) - transition to the opposite side
    gameBoard.receiveAttack(computerLogic.determineNextMove());
    expect(spyGameBoard.mock.calls[7][0]).toEqual([8, 3]);
    expect(computerLogic.currentStrategy).toBe("sink-ship-opposite-transition");

    // 9th attack (8th call index) - sink the ship
    gameBoard.receiveAttack(computerLogic.determineNextMove());
    expect(spyGameBoard.mock.calls[8][0]).toEqual([3, 3]);
    expect(spyPreviousMoveFeedback.mock.calls[8][0]).toBe("ship-sunk");

    // Expect that the coordinates of the sunk ship are removed from successfulHitShips
    expect(computerLogic.successfulHitShips).toEqual([[4, 4]]);
    expect(computerLogic.currentStrategy).toBe("search-body");

    // Now try to sink the 2nd ship

    // 1st attack (9th call index)
    gameBoard.receiveAttack(computerLogic.determineNextMove());
    expect(spyGameBoard.mock.calls[9][0]).toEqual([5, 4]);
    expect(computerLogic.successfulHitShips).toEqual([
      [4, 4],
      [5, 4],
    ]);

    // 2st attack (10th call index)
    gameBoard.receiveAttack(computerLogic.determineNextMove());
    expect(spyGameBoard.mock.calls[10][0]).toEqual([6, 4]);

    // 3rd attack (11th call index)
    // Final attack that will sink the ship
    gameBoard.receiveAttack(computerLogic.determineNextMove());
    expect(spyGameBoard.mock.calls[11][0]).toEqual([7, 4]);
    expect(spyPreviousMoveFeedback.mock.calls[11][0]).toBe("ship-sunk");
    expect(computerLogic.successfulHitShips.length).toBe(0);
  });
});
