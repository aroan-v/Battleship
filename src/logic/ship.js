export default class Ship {
  static shipNames = [
    "carrier",
    "battleship",
    "cruiser",
    "submarine",
    "destroyer",
  ];

  constructor(player) {
    this.name = player;
    this.lastSelected = null;
    this.carrier = { name: "carrier", size: 5, hits: 0, location: [] };
    this.battleship = { name: "battleship", size: 4, hits: 0, location: [] };
    this.cruiser = { name: "cruiser", size: 3, hits: 0, location: [] };
    this.submarine = { name: "submarine", size: 2, hits: 0, location: [] };
    this.destroyer = { name: "destroyer", size: 2, hits: 0, location: [] };
  }

  updateLastSelected(ship) {
    if (!Ship.shipNames.includes(ship)) {
      throw new Error(`Invalid ship name: ${ship}`);
    }

    this.lastSelected = this[ship].name;
  }

  getAllShips() {
    return [
      this.carrier,
      this.battleship,
      this.cruiser,
      this.submarine,
      this.destroyer,
    ];
  }

  retrieve(ship) {
    if (!Ship.shipNames.includes(ship)) {
      throw new Error(`Invalid ship name: ${ship}`);
    }

    return this[ship];
  }

  setCoordinates(ship, array) {
    if (!Ship.shipNames.includes(ship)) {
      throw new Error(`Invalid ship name: ${ship}`);
    }

    if (!Array.isArray(array)) {
      throw new Error("Invalid array passed!:", array);
    }

    this[ship].location = [...array];
  }

  hit(ship) {
    if (!Ship.shipNames.includes(ship)) {
      throw new Error(`Invalid ship name: ${ship}`);
    }
    if (this[ship].sunk) {
      throw new Error(`${ship} is already sunk`);
    }

    this[ship].hits += 1;

    // return an argument for the event bus
    return this.hasSunk(ship) ? { event: "sunk", ship } : { event: "hit" };
  }

  areAllShipsSunk() {
    return this.getAllShips().every((ship) => ship.sunk);
  }

  hasSunk(ship) {
    if (this[ship].size === this[ship].hits) {
      this[ship].sunk = true;
      return true;
    }

    return false;
  }
}
