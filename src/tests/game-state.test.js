import Ship from "../logic/ship";
import ComputerLogic from "../logic/computer-logic";
import ComputerState from "../state/computer-state";
import PlayerState from "../state/player-state";
import EventBus from "../state/event-bus";
import GameState from "../state/game-state";

let newGameState;
let newPlayerState;
let computerState;
let newEventBus;

beforeEach(() => {
  const newShip = new Ship();
  const newLogic = new ComputerLogic();
  computerState = new ComputerState(newShip, newLogic);
  newPlayerState = new PlayerState();
  newEventBus = new EventBus();
  newGameState = new GameState({
    playerOneState: newPlayerState,
    playerTwoState: computerState,
    eventBus: newEventBus,
  });
});

test("Update enemy codes", () => {
  newPlayerState.code = "playerCode";

  newGameState = new GameState({
    playerOneState: newPlayerState,
    playerTwoState: computerState,
    eventBus: newEventBus,
  });

  expect(newPlayerState.enemyCode).toBe("M4CH!N@");
  expect(computerState.enemyCode).toBe("playerCode");
});
