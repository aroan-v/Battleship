const gameStateTracker = {
  ship: null,
  shipSize() {
    switch (this.ship) {
      case "carrier":
        return 5;
      case "battleship":
        return 4;
      case "cruiser":
        return 3;
      case "submarine":
      case "destroyer":
        return 2;
      default:
        return null;
    }
  },
  dir: "vertical", // direction
  hitMode: false,
  placeShipMode: false,
  setLastShip(shipName) {
    this.ship = shipName.toLowerCase();
  },
  lastAttack: { attStatus: null, loc: null, shipPresent: false },
  resetLastAttack() {
    this.lastAttack.attStatus = false;
    this.lastAttack.shipPresent = false;
  },
};

export default gameStateTracker;
