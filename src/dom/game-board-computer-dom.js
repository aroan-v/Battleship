import GameBoardDom from "./gameBoard-dom";

export default class GameBoardComputerDom extends GameBoardDom {
  constructor(instance, playerState, eventBus, enemyState) {
    super(instance, playerState, eventBus, enemyState);
  }
}
