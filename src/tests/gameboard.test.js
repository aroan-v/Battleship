import GameBoard from "../logic/gameboard";
import gameStateTracker from "../state/state";

let newGameBoard;

beforeEach(() => {
  newGameBoard = new GameBoard();
  jest.replaceProperty(gameStateTracker, "ship", null);
  jest.replaceProperty(gameStateTracker, "dir", "vertical");
});

test("Returns a 10x10 array of empty arrays", () => {
  const result = newGameBoard.gameBoard; // The function being tested

  // 1. Check if result is an array
  expect(Array.isArray(result)).toBe(true);

  // 2. Check if the main array has 10 sub-arrays
  expect(result.length).toBe(10);

  // 3. Check if each sub-array has 10 elements
  result.forEach((row) => {
    expect(Array.isArray(row)).toBe(true);
    expect(row.length).toBe(10);
  });

  // 4. Check if each element in sub-arrays is an empty array
  result.forEach((row) => {
    row.forEach((cell) => {
      expect(Array.isArray(cell)).toBe(true);
      expect(cell[0].gotHit).toBe(false);
    });
  });

  // 5. Check deep equality against expected output
  const expectedBoard = Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => [{ gotHit: false }])
  );
  expect(result).toEqual(expectedBoard);
});

test("Place a cruiser and a submarine in different location, then check if expectations are met", () => {
  jest.replaceProperty(gameStateTracker, "ship", "cruiser");
  newGameBoard.generatedCoordinates = [
    [5, 5],
    [6, 5],
    [7, 5],
    [8, 5],
    [9, 5],
  ];

  newGameBoard.placeShip([5, 5]);

  jest.replaceProperty(gameStateTracker, "ship", "submarine");
  newGameBoard.generatedCoordinates = [
    [2, 3],
    [3, 3],
  ];

  newGameBoard.placeShip([8, 5]);

  expect(newGameBoard.gameBoard[5][5]).toHaveLength(1);

  expect(Array.from(newGameBoard.shipTracker.keys())).toStrictEqual([
    "cruiser",
    "submarine",
  ]);

  expect(Array.from(newGameBoard.shipTracker.get("submarine"))).toEqual([
    [2, 3],
    [3, 3],
  ]);

  newGameBoard.receiveAttack([2, 3]);

  expect(newGameBoard.ships.retrieve("submarine").hits).toBe(1);
});

test("Check if the this.shipTracker is still null", () => {
  expect(newGameBoard.shipTracker.size).toBe(0);
});

test("Purposely collide ships when placing it in the gameBoard", () => {
  expect(() => {
    jest.replaceProperty(gameStateTracker, "ship", "cruiser");
    newGameBoard.placeShip([8, 5]);

    jest.replaceProperty(gameStateTracker, "ship", "destroyer");
    newGameBoard.placeShip([8, 5]);
  }).toThrow("Collision detected! Place the ship in another cell");
});

test("Purposely place ships out of the gameBoard - horizontally ", () => {
  expect(() => {
    jest.replaceProperty(gameStateTracker, "dir", "horizontal");
    jest.replaceProperty(gameStateTracker, "ship", "cruiser");
    newGameBoard.placeShip([1, 1]);

    jest.replaceProperty(gameStateTracker, "ship", "submarine");
    newGameBoard.placeShip([1, 1]);
  }).toThrow("Collision detected! Place the ship in another cell");
});

test("Check the shipTracker property if it contains all the placed ships", () => {
  jest.replaceProperty(gameStateTracker, "ship", "cruiser");
  jest.replaceProperty(gameStateTracker, "dir", "horizontal");
  newGameBoard.placeShip([1, 1]);

  jest.replaceProperty(gameStateTracker, "ship", "submarine");
  newGameBoard.placeShip([5, 5]);

  expect(Array.from(newGameBoard.shipTracker.keys()).join(",")).toBe(
    "cruiser,submarine"
  );
});

test("Check the dynamic vertical block generator placed in collision with the wall", () => {
  jest.replaceProperty(gameStateTracker, "ship", "carrier");

  expect(GameBoard.generateVerticalBlocks([8, 5])).toEqual([
    [8, 5],
    [9, 5],
    [7, 5],
    [6, 5],
    [5, 5],
  ]);
});
