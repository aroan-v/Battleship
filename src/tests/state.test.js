import PlayerState from "../state/player-state";

let gameStateTracker;

beforeEach(() => {
  gameStateTracker = new PlayerState();
});

test("Reset the state of lastAttack", () => {
  gameStateTracker.setEnemyAttacked();
  gameStateTracker.setEnemyShipAttacked();

  expect(gameStateTracker.enemyAttacked).toBe(true);

  gameStateTracker.resetLastAttack();

  expect(
    gameStateTracker.enemyAttacked && gameStateTracker.enemyShipAttacked
  ).toBe(false);
});
