import Ship from "../logic/ship";

const playerShip = new Ship("Aaron");

test("Object should return a carrier ship", () => {
  expect(playerShip.carrier).toHaveProperty("size");
});

test("Cruiser ship got hit", () => {
  playerShip.hit("cruiser");
  playerShip.hit("cruiser");
  expect(playerShip.cruiser).toHaveProperty("hits", 2);
});

test("Cruiser ship got hit for the last time", () => {
  playerShip.hit("cruiser");
  expect(playerShip.cruiser).toHaveProperty("sunk", true);
});

test("Cruiser ship has already sunk, throw an error", () => {
  expect(() => playerShip.hit("cruiser")).toThrow("cruiser is already sunk");
});

test("Avocado is not a ship name, throw an error", () => {
  expect(() => playerShip.hit("Avocado ")).toThrow();
});

test("Should return with the battleship object", () => {
  expect(playerShip.retrieve("battleship")).toHaveProperty(
    "name",
    "battleship"
  );
});
