import gameStateTracker from "../state/state";

beforeEach(() => {
  gameStateTracker.lastAttack.attStatus = false;
  gameStateTracker.lastAttack.shipPresent = false;
});

test("Reset the state of lastAttack", () => {
  gameStateTracker.lastAttack.attStatus = true;
  gameStateTracker.lastAttack.shipPresent = true;

  expect(gameStateTracker.lastAttack.attStatus).toBe(true);

  gameStateTracker.resetLastAttack();

  expect(
    gameStateTracker.lastAttack.attStatus &&
      gameStateTracker.lastAttack.shipPresent
  ).toBe(false);
});
