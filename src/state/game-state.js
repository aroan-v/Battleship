export default class GameState {
  constructor({ playerOneState, playerTwoState, eventBus }) {
    this.playerOneState = playerOneState;
    this.playerTwoState = playerTwoState;
    this.isSecondPlayerComputer = this.playerTwoState.code === "M4CH!N@";
    this.eventBus = eventBus;
    this.gameOver = false;
    this.lastTurn = null;

    this.updateEnemyCodes();
    this.subscribeGameInitializers();
  }

  checkGameStart = () => {
    if (
      this.playerOneState.playerReady &&
      !this.playerTwoState.playerReady &&
      this.playerTwoState.code === "M4CH!N@"
    ) {
      // Start the ship button dispatch
      this.eventBus.publish(`${this.playerTwoState.code}-cycle-ships`);
    } else if (
      this.playerOneState.playerReady &&
      this.playerTwoState.playerReady
    ) {
      console.log("Starting the game");

      // Publish pre game event
      this.eventBus.publish("clear-player-guide");

      // Unsubscribe the pre game events
      this.unsubscribeGameInitializers();

      // Activate hit mode and switching of turns
      this.activateHitMode();
    }
  };

  updateEnemyCodes() {
    this.playerOneState.enemyCode = this.playerTwoState.code;
    this.playerTwoState.enemyCode = this.playerOneState.code;
  }

  subscribeGameInitializers() {
    this.eventBus.subscribe(
      `${this.playerOneState.code}-placed-all-ships`,
      this.checkGameStart
    );
    this.eventBus.subscribe(
      `${this.playerTwoState.code}-placed-all-ships`,
      this.checkGameStart
    );
  }

  unsubscribeGameInitializers() {
    const playerCode = [this.playerOneState.code, this.playerTwoState.code];

    playerCode.forEach((code) => {
      this.eventBus.unsubscribe(`${code}-placed-all-ships`);
      this.eventBus.unsubscribe(`${code}-refresh-ghost`);
      this.eventBus.unsubscribe(`${code}-reset-ships`);
      this.eventBus.unsubscribe(`${code}-cycle-ships`);
    });

    if (this.playerTwoState.code === "M4CH!N@") {
      this.eventBus.unsubscribe("place-computer-ship");
    }

    this.eventBus.unsubscribe("clear-player-guide");
  }

  activateHitMode = () => {
    this.firstPlayerTurn();
    this.lastTurn = 1;

    this.eventBus.subscribe(
      `${this.playerOneState.code}-attack-success`,
      this.switchTurns
    );
    this.eventBus.subscribe(
      `${this.playerTwoState.code}-attack-success`,
      this.switchTurns
    );
  };

  firstPlayerTurn() {
    this.playerOneState.hitMode = true;
    this.playerTwoState.hitMode = false;

    // Use different turn announcement messages for pvc and pvp modes
    if (this.isSecondPlayerComputer) {
      this.eventBus.publish(`${this.playerTwoState.code}-announce`, {
        event: "turn-human",
      });
    } else {
      this.eventBus.publish(`${this.playerTwoState.code}-announce`, {
        event: "turn",
        name: this.playerOneState.name,
      });
    }

    // Update the border colors of the game board to signal their turn
    this.eventBus.publish(`current-turn-${this.playerOneState.counter}`);
    this.eventBus.publish(`done-turn-${this.playerTwoState.counter}`);
  }

  secondPlayerTurn() {
    this.playerOneState.hitMode = false;
    this.playerTwoState.hitMode = true;

    // Update the border colors of the game board to signal their turn
    this.eventBus.publish(`current-turn-${this.playerTwoState.counter}`);
    this.eventBus.publish(`done-turn-${this.playerOneState.counter}`);

    // Announce that its second player's turn to attack
    this.eventBus.publish(`${this.playerOneState.code}-announce`, {
      event: "turn",
      name: this.playerTwoState.name,
    });

    // Automatically attack the enemy if its pvc mode
    if (this.isSecondPlayerComputer) {
      setTimeout(() => {
        this.eventBus.publish(
          `${this.playerTwoState.code}-attack-enemy`,
          this.playerTwoState.generateNextMove()
        );
      }, 1000);
    }
  }

  checkGameOver = () => {
    // The player with the truthy gameOver has won
    if (this.playerOneState.gameOver || this.playerTwoState.gameOver) {
      this.eventBus.unsubscribe(`${this.playerOneState.code}-attack-success`);
      this.eventBus.unsubscribe(`${this.playerTwoState.code}-attack-success`);

      this.playerOneState.hitMode = false;
      this.playerTwoState.hitMode = false;

      const [winner, loser] = this.playerOneState.gameOver
        ? ["playerOneState", "playerTwoState"]
        : ["playerTwoState", "playerOneState"];

      console.log("this.eventBus", this.eventBus.events);

      this.eventBus.publish(`${this[winner].code}-post-game-effects`);
      this.eventBus.publish(`${this[loser].code}-announce`, {
        event: "winner",
        name: this[winner].name,
      });

      return true;
    }

    return false;
  };

  switchTurns = () => {
    if (this.checkGameOver()) {
      // Check if the game is over before proceeding
      return;
    }

    if (this.lastTurn === 1) {
      // It's player two's turn
      this.lastTurn = 2;
      this.secondPlayerTurn();
    } else {
      // It's player one's turn
      this.lastTurn = 1;
      this.firstPlayerTurn();
    }
  };
}
