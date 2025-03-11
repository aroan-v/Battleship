import ComputerLogic from "../logic/computer-logic";
import ComputerState from "../state/computer-state";

describe("Test Computer State", () => {
  let computerState;
  let computerLogic;

  beforeEach(() => {
    computerLogic = new ComputerLogic();
    computerState = new ComputerState(computerLogic);
  });

  test("Next move method within the computerState must return a valid value", () => {
    const spy = jest.spyOn(computerLogic, "generateRandomCoordinates");
    computerState.generateNextMove();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  // test("determineNextMove method will return a value based that aligns with sinkBodyMode", () => {
  //   computerState.setEnemyShipAttacked();
  //   computerState.setEnemyShipAttacked();

  //   expect(computerState.sinkBodyMode).toBeTruthy();

  //   const spy = jest.spyOn(computerLogic, "determineNextMove");
  //   computerState.previousMoveFeedback();

  //   expect(spy).toHaveBeenCalledWith("sink-ship");
  // });
});
