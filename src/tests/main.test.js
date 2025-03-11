import GameBoardComputer from "../logic/game-board-computer";
import ComputerState from "../state/computer-state";
import ComputerLogic from "../logic/computer-logic";
import Ship from "../logic/ship";

describe("Simulate the computer being able to sink all the ships on its own", () => {
  let computerGameBoard;
  let computerLogic;
  let computerState;
  let shipInstance;

  beforeEach(() => {
    computerLogic = new ComputerLogic();
    computerState = new ComputerState(computerLogic);
    shipInstance = new Ship();

    const predeterminedShipLocations = [
      {
        size: 5,
        location: [
          [0, 1],
          [0, 2],
          [0, 3],
          [0, 4],
          [0, 5],
        ],
      },
      {
        size: 4,
        location: [
          [2, 8],
          [3, 8],
          [4, 8],
          [5, 8],
        ],
      },
      {
        size: 3,
        location: [
          [7, 7],
          [7, 8],
          [7, 9],
        ],
      },
      {
        size: 2,
        location: [
          [4, 3],
          [4, 4],
        ],
      },
      {
        size: 2,
        location: [
          [6, 4],
          [7, 4],
        ],
      },
    ];

    const mockEventBus = {
      subscribe: jest.fn(),
      publish: jest.fn(),
    };

    computerGameBoard = new GameBoardComputer(
      null,
      mockEventBus,
      computerState,
      shipInstance
    );

    computerGameBoard.playerState = {
      name: "Tester",
      code: "Tester",
    };

    // Mock the implementation for the location of each ship with predetermined generated coordinates
    computerGameBoard.updateGeneratedCoordinates = jest
      .fn()
      .mockImplementation((shipSize) => {
        if (shipSize === predeterminedShipLocations[0].size) {
          const data = predeterminedShipLocations.shift();

          computerGameBoard.generatedCoordinates = data.location;
        } else {
          throw new Error("Invalid ship size");
        }
      });

    // Get all the ships then assign each one as an argument for computerPlaceShip method
    shipInstance
      .getAllShips()
      .forEach((ship) => computerGameBoard.computerPlaceShip(ship));
  });

  test("Check if the ships are placed properly by checking the blocks", () => {
    const [carrierBlock] = computerGameBoard.retrieveBlock([0, 1]);
    expect(carrierBlock.ship).toBe("carrier");

    const [battleShipBlock] = computerGameBoard.retrieveBlock([2, 8]);
    expect(battleShipBlock.ship).toBe("battleship");

    const [cruiserBlock] = computerGameBoard.retrieveBlock([7, 8]);
    expect(cruiserBlock.ship).toBe("cruiser");

    const [submarine] = computerGameBoard.retrieveBlock([4, 4]);
    expect(submarine.ship).toBe("submarine");

    const [destroyer] = computerGameBoard.retrieveBlock([6, 4]);
    expect(destroyer.ship).toBe("destroyer");
  });

  test("Confirm the blocks without ships should not have ships at all", () => {
    const [randomBlock] = computerGameBoard.retrieveBlock([8, 8]);
    expect(randomBlock.ship).toBeFalsy();

    const [randomBlock2] = computerGameBoard.retrieveBlock([0, 0]);
    expect(randomBlock2.ship).toBeFalsy();
  });

  test("Fire 100 attacks to the game board (unknown if the ships are hit)", () => {
    const spyOnReceiveAttack = jest.spyOn(computerGameBoard, "receiveAttack");

    for (let i = 1; i <= 100; i++) {
      computerGameBoard.receiveAttack(computerState.generateNextMove());
    }

    expect(computerGameBoard.remainingShipsCoordinates.size).toBe(0);
    expect(spyOnReceiveAttack).toHaveBeenCalledTimes(100);
  });
});
