import PlayerState from "./player-state";

export default class ComputerState extends PlayerState {
  constructor(computerLogicInstance) {
    super();

    if (!computerLogicInstance) {
      throw new Error("No instances passed!");
    }

    this.logicInstance = computerLogicInstance;
    this.name = "Computer";
    this.code = "M4CH!N@";
    this.enemyCode = null;

    this.nextMove = null;
  }

  generateNextMove() {
    this.nextMove = this.logicInstance.determineNextMove();
    return this.nextMove;
  }

  setEnemyAttacked() {
    super.setEnemyAttacked();

    // For computer's next move
    this.logicInstance.previousMoveFeedback("hit");
  }

  setEnemyShipAttacked() {
    super.setEnemyShipAttacked();

    // For computer's next move
    this.logicInstance.previousMoveFeedback("ship-hit");
  }

  setEnemyShipSunk(shipCoordinates) {
    super.setEnemyShipSunk(shipCoordinates);

    // For computer's next move
    this.logicInstance.previousMoveFeedback("ship-sunk", shipCoordinates);
  }
}
