# Spark - An Incremental Game

## Description

Spark is a web-based incremental game where you manage resources like Energy, Focus, and Discipline to progress. Build generators to automate energy production, complete tasks to gain various rewards, and eventually prestige to unlock powerful upgrades.

## How to Play

1.  Clone or download this repository.
2.  Navigate to the project directory in your terminal.
3.  Run a simple local HTTP server. If you have Python 3 installed, you can use:
    ```bash
    python3 -m http.server
    ```
    If you have Python 2, use:
    ```bash
    python -m SimpleHTTPServer
    ```
4.  Open your web browser and go to `http://localhost:8000` (or the port specified by the server).

## Features

*   **Resource Management:** Balance Energy, Focus, and Discipline.
*   **Generators:** Purchase different types of generators to passively increase your Energy production.
*   **Task System:** Complete tasks to earn rewards and progress. Includes a task breakdown feature.
*   **Upgrades:** Invest resources in upgrades to boost production or unlock new mechanics.
*   **Prestige System:** Reset your progress for permanent bonuses and access to more powerful content.
*   **Saving/Loading:** Your game progress is automatically saved locally.

## Technology Stack

*   HTML5
*   CSS3
*   Vanilla JavaScript (ES Modules)

## Development

The game logic is organized into several JavaScript modules:

*   `main.js`: Core game loop and initialization.
*   `state.js`: Manages the game's current state.
*   `config.js`: Stores configuration for generators, upgrades, etc.
*   `generators.js`: Handles generator logic and display.
*   `tasks.js`: Manages the task system.
*   `prestige.js`: Contains logic for the prestige mechanic.
*   `saveLoad.js`: Handles saving and loading game state.
*   `utils.js`: Utility functions used across the game.
*   `dom.js`: References to key DOM elements. 