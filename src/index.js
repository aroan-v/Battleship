// index.js
import "./styles.css";
import GameMenuDom from "./dom/game-menu-dom";

// Body
const body = document.querySelector("body");

// Main Div Container
const gameContainer = document.createElement("div");
gameContainer.classList.add("game-container");
body.appendChild(gameContainer);

// Game Menu
const gameMenu = new GameMenuDom(gameContainer);

// Open Menu after appending to DOM
gameMenu.openPreGameDialog();
