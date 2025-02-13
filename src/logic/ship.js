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
    this.carrier = { name: "carrier", size: 5, hits: 0 };
    this.battleship = { name: "battleship", size: 4, hits: 0 };
    this.cruiser = { name: "cruiser", size: 3, hits: 0 };
    this.submarine = { name: "submarine", size: 2, hits: 0 };
    this.destroyer = { name: "destroyer", size: 2, hits: 0 };
  }

  updateLastSelected(ship) {
    if (!Ship.shipNames.includes(ship)) {
      throw new Error(`Invalid ship name: ${ship}`);
    }

    this.lastSelected = this[ship].name;
  }

  retrieve(ship) {
    if (!Ship.shipNames.includes(ship)) {
      throw new Error(`Invalid ship name: ${ship}`);
    }

    return this[ship];
  }

  shipCoordinates(ship, array) {
    if (!Ship.shipNames.includes(ship)) {
      throw new Error(`Invalid ship name: ${ship}`);
    }

    this[ship].loc = array;
  }

  hit(ship) {
    if (!Ship.shipNames.includes(ship)) {
      throw new Error(`Invalid ship name: ${ship}`);
    }
    if (this[ship].sunk) {
      throw new Error(`${ship} is already sunk`);
    }

    this[ship].hits += 1;

    // return the argument for the publish event bus
    return this.hasSunk(ship)
      ? { event: "sunk", data: ship }
      : { event: "hit" };
  }

  hasSunk(ship) {
    if (this[ship].size === this[ship].hits) {
      this[ship].sunk = true;
      return true;
    }

    return false;
  }
}
