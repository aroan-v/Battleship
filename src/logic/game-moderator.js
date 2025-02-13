import GameBoard from "./gameboard";
import Ship from "./ship";
import GameBoardDom from "../dom/gameBoard-dom";
import gameStateTracker from "../state/state";
import GameControls from "../dom/central-controls-dom";

const playerShip = new Ship();
const playerGameBoard = new GameBoard(playerShip);
const gameBoardDOM = new GameBoardDom(playerGameBoard);
const gameControls = new GameControls();

const body = document.querySelector("body");
body.appendChild(gameBoardDOM.gameBoard);

export default gameBoardDOM;

// Horizontal and Vertical Buttons

function createDirButton(dir) {
  const button = document.createElement("button");
  button.className = `directional-button`;
  button.textContent = `${dir}`;

  button.addEventListener("click", () => {
    const allDirectionalButtons = document.querySelectorAll(
      ".directional-button"
    ); // TODO in the future, keep the reference of the buttons created instead of doing this
    gameStateTracker.dir = `${dir}`;

    allDirectionalButtons.forEach((dirButton) =>
      dirButton.classList.remove("selected")
    );
    button.classList.add("selected");
  });

  return button;
}

["horizontal", "vertical"].forEach((dir) => {
  body.appendChild(createDirButton(dir));
});

gameControls.retrieveElements().forEach((element) => body.appendChild(element));
