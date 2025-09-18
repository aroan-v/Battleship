# Battleships

A simple Battleships game built with a focus on smart computer and robust game logic. Supports **Player vs Computer** and **Player vs Player** modes.

## Features

### Smart Computer Opponent

- **Random search mode**: The computer randomly searches for ships until it hits a part of one.
- **Sink ship mode**: Once a hit is detected, the computer actively targets the remaining parts of the ship until it’s completely sunk.
- **Handles adjacent ships**: Even if ships are next to each other, the computer continues to target unsunk ships logically.
- **Human-like play**: No cheating — the computer only uses information a player could know, making moves realistic.

### Gameplay

- **Automatic turn switching** between players.
- **Simple, clear styling** with visual feedback when ships are sunk.
- **Straightforward interface** for easy play and readability.

### Testing

- Game logic is **fully tested with Jest**, covering:
  - Hit detection
  - Sink detection
  - Turn switching
  - Computer targeting logic

## Notes

This project demonstrates how to build game computer that simulates human reasoning rather than relying on hidden knowledge. Jest ensures that the core game mechanics remain reliable as features are added or refactored.
