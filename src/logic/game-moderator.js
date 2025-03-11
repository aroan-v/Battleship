import GameBoard from "./gameboard";
import GameBoardDom from "../dom/gameBoard-dom";
import PlayerState from "../state/player-state";
import GameControls from "../dom/game-controls-dom";
import EventBus from "../state/event-bus";
import GameBoardComputer from "./game-board-computer";
import ComputerState from "../state/computer-state";
import GameBoardComputerDom from "../dom/game-board-computer-dom";
import GameState from "../state/game-state";
import ComputerLogic from "./computer-logic";
import Ship from "./ship";

export class GameModerator {
  constructor({
    mode = "pvc",
    playerOneName,
    playerTwoName,
    eventBusInstance,
    resetRoundCallback,
    resetGameCallback,
  }) {
    this.mode = mode;
    this.resetRoundCallback = resetRoundCallback;
    this.resetGameCallback = resetGameCallback;
    this.playerOneName = playerOneName || "Player One";
    this.playerTwoName = playerTwoName || "Player Two";

    this.playerOneState = null;
    this.playerTwoState = null;
    this.isPlayerTwoComputer = null;

    this.playerOneShips = null;
    this.playerTwoShips = null;

    this.playerOneGameBoard = null;
    this.playerTwoGameBoard = null;

    this.playerOneGameBoardDom = null;
    this.playerTwoGameBoardDom = null;

    this.playerOneGameControls = null;
    this.playerTwoGameControls = null;

    this.playerOneContainer = null;
    this.playerTwoContainer = null;

    // Game Instances
    this.gameEventBus = eventBusInstance;
    this.gameState = null;

    this.newGameInitialization();
  }

  newGameInitialization = () => {
    // Reset the event bus
    this.gameEventBus.reset();

    // Initializers
    this.initializePlayerStates();
    this.initializeGameState();
    this.initializePlayer("playerOne");
    this.initializePlayer("playerTwo");
    this.initializePlayerContainers();

    this.isPlayerTwoComputer = this.playerTwoState.code === "M4CH!N@";

    // Check initialization
    this.validateInitialization();
  };

  initializePlayerStates() {
    this.playerOneState = new PlayerState(this.playerOneName);

    if (this.mode === "pvp") {
      this.playerTwoState = new PlayerState(this.playerTwoName);
    } else if (this.mode === "pvc") {
      const computerLogic = new ComputerLogic();
      this.playerTwoState = new ComputerState(computerLogic);
    } else {
      throw new Error("Invalid mode!", this.mode);
    }
  }

  initializeGameState() {
    this.gameState = new GameState({
      playerOneState: this.playerOneState,
      playerTwoState: this.playerTwoState,
      eventBus: this.gameEventBus,
    });
  }

  initializePlayer(player) {
    if (player !== "playerOne" && player !== "playerTwo") {
      throw new Error("Invalid player!", player);
    }

    const opponent = player === "playerOne" ? "playerTwo" : "playerOne";
    const GameBoardClass =
      this[`${player}State`].code === "M4CH!N@" ? GameBoardComputer : GameBoard;
    const GameBoardDomClass =
      this[`${player}State`].code === "M4CH!N@"
        ? GameBoardComputerDom
        : GameBoardDom;

    this[`${player}Ships`] = new Ship();

    this[`${player}GameBoard`] = new GameBoardClass(
      this[`${player}State`],
      this.gameEventBus,
      this[`${opponent}State`],
      this[`${player}Ships`]
    );

    this[`${player}GameBoardDom`] = new GameBoardDomClass(
      this[`${player}GameBoard`],
      this[`${player}State`],
      this.gameEventBus,
      this[`${opponent}State`]
    );

    this[`${player}GameControls`] = new GameControls(
      this[`${player}State`],
      this.gameEventBus,
      this[`${player}Ships`]
    );
  }

  initializePlayerContainers() {
    // Player Containers
    this.playerOneContainer = this.generatePlayerContainer("playerOne");
    this.playerTwoContainer = this.generatePlayerContainer("playerTwo");
  }

  generatePlayerContainer(player) {
    if (player !== "playerOne" && player !== "playerTwo") {
      throw new Error("Invalid player!", player);
    }

    const counter = player === "playerOne" ? 1 : 2;

    const playerContainer = document.createElement("div");
    playerContainer.classList.add(`container-${counter}`);

    const gameBoardContainer = document.createElement("div");
    gameBoardContainer.classList.add(`game-board-container-${counter}`);
    gameBoardContainer.append(
      this[`${player}GameBoardDom`].gameBoard,
      this[`${player}GameControls`].postGameMenu
    );

    playerContainer.append(
      this[`${player}GameControls`].announcer,
      gameBoardContainer,
      this[`${player}GameControls`].controlsContainer
    );

    return playerContainer;
  }

  subscribeEventBus() {
    this.gameEventBus.subscribe("new-round", () => {
      this.newGameInitialization();
      this.resetRoundCallback();
    });

    this.gameEventBus.subscribe("new-game", this.resetGameCallback);

    this.gameEventBus.subscribe(
      `${this.playerOneState.code}-refresh-ghost`,
      () => this.playerOneGameBoardDom.refreshGhost()
    ); // Must use human players for this - do another one if there's a 2nd human player

    if (this.isPlayerTwoComputer) {
      // Game state will publish the attack-enemy event for the computer
      this.gameEventBus.subscribe(
        `${this.playerTwoState.code}-attack-enemy`,
        (coordinates) =>
          GameBoardDom.computerNextMove(coordinates, this.playerOneState.code)
      );
    } else {
      // Activate the ghost effect for the ship placement for the second player since it's a human
      this.gameEventBus.subscribe(
        `${this.playerTwoState.code}-refresh-ghost`,
        () => this.playerTwoGameBoardDom.refreshGhost()
      );
    }
  }

  validateInitialization() {
    // List of properties to check
    const properties = [
      "playerOneState",
      "playerTwoState",
      "playerOneShips",
      "playerTwoShips",
      "playerOneGameBoard",
      "playerTwoGameBoard",
      "playerOneGameBoardDom",
      "playerTwoGameBoardDom",
      "playerOneGameControls",
      "playerTwoGameControls",
      "gameEventBus",
      "gameState",
      "playerOneContainer",
      "playerTwoContainer",
    ];

    // Collect null properties
    const nullProperties = properties.filter((prop) => this[prop] === null);

    // If any properties are null, return false with the missing properties
    if (nullProperties.length > 0) {
      console.warn("Uninitialized properties:", nullProperties);
      return { initialized: false, missing: nullProperties };
    }

    // If all properties are initialized, return true
    return { initialized: true };
  }
}
