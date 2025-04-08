# Productivity Ascendance - Development Plan

This document outlines the planned steps for developing the incremental game.

## 1. Foundation & Setup (✓ Done)

*   Create `index.html`, `style.css`, `main.js`, and module files (`state.js`, `tasks.js`, etc.).
*   Set up the basic HTML structure with areas for resources (Energy, Discipline, Focus), tasks, generators, automation, and prestige.
*   Apply initial CSS for layout and basic styling.
*   Initialize core game variables (`energy`, `disciplinePoints`, `focusPoints`, `tasks`, etc.) in `state.js`.
*   Set up the main `gameLoop` using `requestAnimationFrame` in `main.js`.

## 2. Core Task Management (✓ Done - Modified, Expanding for Difficulty)

*   **Task Data:** Add a `difficulty` property to task objects in `gameState.tasks` (e.g., 'easy', 'medium', 'hard').
*   **State:** Add `activeEnergyMultipliers` array to `gameState` to track temporary multipliers (e.g., `[{ multiplier: 1.2, duration: 30000 }]`).
*   Implement `addTask` to add new tasks. Modify to include UI for selecting task `difficulty`.
*   Implement `renderTasks` to display the current tasks, including their `difficulty`.
*   Implement `completeTask` to:
    *   Remove the task.
    *   Award base **Discipline** (plus any due date bonuses).
    *   Award *additional* **Discipline** based on `difficulty`.
    *   Award *additional* **Energy** based on `difficulty`.
    *   Add a temporary Energy production multiplier object to `gameState.activeEnergyMultipliers` based on `difficulty`.
    *   Update the display.
*   Implement `deleteTask` to remove a task without awarding anything.
*   Update `updateResources` to show the current `energy`, `disciplinePoints`, and `focusPoints`.
*   **Game Loop:** Update `gameLoop` to:
    *   Process `activeEnergyMultipliers`, decreasing durations and removing expired ones.
    *   Calculate the *combined* active Energy multiplier.
    *   Apply the combined multiplier to passive Energy generation calculations.

## 3. Generators (Energy Production)

*   **Define Data:** Create `generatorConfig` defining generators. Properties: `id`, `name`, `baseCost` (in **Energy**), `costScale`, `baseProduction` (Energy per second). Initialize `gameState.generators`.
*   **Buying Logic:** Implement `buyGenerator(generatorId)`. Check for enough **Energy**. Subtract cost from **Energy**, increment count. Update UI.
*   **Rendering:** Implement `renderGenerators()` to display name, count, Energy production/sec, and cost (in **Energy**).
*   **Game Loop Integration:** `gameLoop` calculates `passiveEnergyGain` from generators and adds it to `energy` based on `deltaTime`.

## 4. Task Automation & Discipline Upgrades

*   **Define Automation/Upgrades:** Create a configuration for things purchased with **Discipline**. Examples: "Auto-complete X tasks per second", "Increase base Discipline gain per task", "Unlock new Generator types". Include properties: `id`, `name`, `cost` (in **Discipline**), `description`, `effect`.
*   **Buying Logic:** Implement `buyAutomationUpgrade(upgradeId)`. Check for enough **Discipline**. Subtract cost, apply effect (this might involve modifying `gameLoop`, `completeTask`, or adding new state variables).
*   **Rendering:** Implement `renderAutomationUpgrades()` to display available upgrades, costs (in **Discipline**), and purchased status.
*   **Applying Effects:** Update relevant game logic (e.g., add an auto-completion check in `gameLoop`, modify Discipline calculation in `completeTask`).

## 5. Prestige Layer 1 ("Focus")

*   **Define Trigger & Formula:** Decide on the **Energy** threshold to "Refocus". Determine how Focus Points (`focusPoints`) are calculated (e.g., based on peak **Energy** or **Discipline**?).
*   **Prestige Logic:** Implement `attemptPrestige()`. Check requirement. Calculate Focus Points, add to `focusPoints`, reset **Energy**, **Discipline** (?), generator counts, potentially automation progress (?). Update UI.
*   **UI Update:** In `gameLoop`, check if prestige requirement is met. Update `prestigeBtn` text and state.

## 6. Focus Tree (Prestige Upgrades)

*   **Define Upgrades:** Create `focusUpgradeConfig`. Properties: `id`, `name`, `cost` (in Focus Points), `description`, `purchased`, `prerequisites`. Examples: "Increase base task Discipline reward," "Energy generators are X% more effective," "Start with basic automation after Refocus."
*   **Buying Logic:** Implement `buyFocusUpgrade(upgradeId)`. Check for Focus Points, prerequisites, purchased status. Subtract cost, mark `purchased`.
*   **Rendering:** Implement `renderFocusTree()`.
*   **Applying Effects:** Modify relevant logic (e.g., `completeTask`, `gameLoop`, `attemptPrestige`).

## 7. Saving & Loading

*   **Save Function:** `saveGame()` bundles `energy`, `disciplinePoints`, `focusPoints`, `tasks`, generator counts, purchased upgrade IDs (both Discipline and Focus) into `localStorage`.
*   **Load Function:** `loadGame()` restores the state from `localStorage`.
*   **Auto-Save:** Call `saveGame()` periodically and after important actions.

## 8. Refinements & Polish

*   Implement due date bonuses/penalties in `completeTask` (confirm it applies to Discipline).
*   Add number formatting (`formatNumber`).
*   Balance the numbers (costs, rewards, production for *both* resources).
*   Improve CSS styling.

## 9. Achievements

*   **Define System:** Design the structure for achievements (e.g., `achievementId`, `name`, `description`, `condition`, `reward`, `unlocked`). Conditions could involve reaching resource milestones, completing tasks, buying upgrades, etc.
*   **Tracking Logic:** Implement checks in relevant game logic (`gameLoop`, `completeTask`, `buyGenerator`, etc.) to see if achievement conditions are met.
*   **Reward Application:** Apply rewards when unlocked (could be passive bonuses, one-time resource boosts, multipliers).
*   **Rendering:** Create a UI section to display locked and unlocked achievements.

## 10. Challenges

*   **Define Challenges:** Create configurations for specific challenges (`challengeId`, `name`, `description`, `rules`, `goal`, `reward`). Rules might restrict certain mechanics (e.g., disable generators, increase task difficulty). Goals would be specific objectives (e.g., reach X Energy under the rules). Rewards should be significant permanent bonuses.
*   **Challenge State:** Add game state to track if a challenge is active, and potentially challenge-specific progress. Modify game logic (`gameLoop`, buying functions, etc.) to respect challenge rules when active.
*   **UI Integration:** Add UI elements to select, start, track, and exit challenges. Display rewards for completed challenges.

## 11. Further Prestige Layers (Inspired by Antimatter Dimensions)

*   **Design Layer 2 ("Mastery"?):**
    *   **Trigger:** Define the condition to unlock this layer (e.g., reaching a high amount of Focus Points, completing certain Focus Upgrades or Challenges?).
    *   **Reset:** What gets reset? Energy, Discipline, Generators, Automation, Focus Points, Focus Upgrades? Perhaps only some of these?
    *   **New Currency/Mechanic:** Introduce a new currency (e.g., "Mastery Points") earned based on the reset state (e.g., based on Focus Points at reset). Unlock a new set of upgrades or mechanics purchasable with this currency.
*   **Design Subsequent Layers:** Consider how subsequent layers build upon previous ones, potentially introducing new resources, mechanics, or altering the core gameplay loop in more significant ways, similar to how later layers in Antimatter Dimensions introduce new dimensions, mechanics like Time Dilation, etc.
*   **Interactions:** How do upgrades from later layers affect earlier ones? (e.g., Mastery upgrades might boost Energy production or Focus Point gain).
