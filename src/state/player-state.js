export default class PlayerState {
  static playerCounter = 0;

  constructor(name = null) {
    this.name = name;
    this.ship = null;
    this.direction = "vertical";
    this.hitMode = false;
    this.placeShipMode = false;
    this.playerReady = false;

    this.gameOver = false;
    this.code = null;
    this.counter = ++PlayerState.playerCounter % 2 === 0 ? 2 : 1; // The counter wil always be either 1 or 2 which stands for Player 1 and Player 2 each game
    this.enemyCode = null;

    this.enemyAttacked = false;
    this.enemyShipAttacked = false;

    this.enemyShipSunk = false;
    this.sunkShipCoordinates = null;
    this.generatePlayerCode();
  }

  generatePlayerCode() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars[randomIndex];
    }

    this.code = result;
  }

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
  }

  setEnemyAttacked() {
    this.enemyAttacked = true;
  }

  setEnemyShipAttacked() {
    // For DOM methods
    this.enemyAttacked = true;
    this.enemyShipAttacked = true;
  }

  setEnemyShipSunk(coordinates) {
    // For DOM methods
    this.enemyAttacked = true;
    this.enemyShipSunk = true;
    this.sunkShipCoordinates = coordinates;
  }

  resetLastAttack() {
    this.enemyShipSunk = false;
    this.enemyAttacked = false;
    this.enemyShipAttacked = false;
    this.sunkShipCoordinates = null;
  }
}
