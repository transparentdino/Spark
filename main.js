// Main Game Logic and Initialization
import { gameState, initializeGeneratorState } from './state.js';
import { loadGame, startAutoSave } from './saveLoad.js';
import { renderTasks, addTask } from './tasks.js';
import { renderGenerators, calculatePassiveEnergyGain, updateGeneratorDisplay, calculateDisciplineDrain } from './generators.js';
import { renderFocusTree, attemptPrestige, updatePrestigeButton } from './prestige.js';
import { formatNumber, formatTimeRemaining } from './utils.js';
import * as dom from './dom.js';

let lastUpdateTime;

// --- Helper Date Functions ---
export function isSameDay(ts1, ts2) {
    if (!ts1 || !ts2) return false; // Cannot compare if one is missing
    const d1 = new Date(ts1);
    const d2 = new Date(ts2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

export function isYesterday(ts1, ts2) {
    if (!ts1 || !ts2) return false;
    const yesterday = new Date(ts1);
    yesterday.setDate(yesterday.getDate() - 1);
    const d2 = new Date(ts2);
    return yesterday.getFullYear() === d2.getFullYear() &&
           yesterday.getMonth() === d2.getMonth() &&
           yesterday.getDate() === d2.getDate();
}

// --- Streak Calculation --- 
// Recalculates the streak energy multiplier based on the current streak
// Example: 1% bonus per streak day (max 50%)
export function calculateStreakMultiplier() {
    const bonusPerDay = 0.01;
    const maxBonus = 0.5;
    gameState.streakEnergyMultiplier = 1.0 + Math.min(gameState.currentStreak * bonusPerDay, maxBonus);
    console.log(`Streak: ${gameState.currentStreak}, Multiplier: ${gameState.streakEnergyMultiplier.toFixed(2)}x`);
}

// Checks the daily streak status on game load
function checkDailyStreak() {
    const now = Date.now();
    if (!gameState.lastCompletionTimestamp) {
        // No previous completion, start fresh
        gameState.currentStreak = 0;
    } else {
        // Check if the last completion was NOT today or yesterday
        if (!isSameDay(now, gameState.lastCompletionTimestamp) && !isYesterday(now, gameState.lastCompletionTimestamp)) {
            console.log(`Streak broken. Last completion was on ${new Date(gameState.lastCompletionTimestamp).toLocaleDateString()}.`);
            gameState.currentStreak = 0; // Reset streak
        } else {
             console.log(`Streak maintained at ${gameState.currentStreak}. Last completion: ${new Date(gameState.lastCompletionTimestamp).toLocaleDateString()}`);
        }
    }
    calculateStreakMultiplier(); // Calculate multiplier based on loaded/reset streak
}

// Central function to update resource displays
export function updateResources() {
    dom.energyDisplay.textContent = formatNumber(gameState.energy);
    dom.disciplineDisplay.textContent = formatNumber(gameState.disciplinePoints);
    dom.focusPointsDisplay.textContent = formatNumber(gameState.focusPoints);
    dom.streakDisplay.textContent = gameState.currentStreak; // Update streak display
}

// --- Update Buff Timers Display ---
function updateBuffTimers() {
    dom.activeBuffsSection.innerHTML = ''; // Clear previous timers
    if (gameState.activeEnergyMultipliers.length === 0) {
        dom.activeBuffsSection.style.display = 'none'; // Hide if no buffs
        return;
    }

    dom.activeBuffsSection.style.display = 'block'; // Show if buffs exist
    gameState.activeEnergyMultipliers.forEach((buff, index) => {
        const buffElement = document.createElement('div');
        buffElement.classList.add('buff-timer');
        // Display multiplier and remaining seconds (rounded up)
        const remainingSeconds = Math.ceil(buff.duration / 1000);
        buffElement.textContent = `Energy x${buff.multiplier.toFixed(2)} (${remainingSeconds}s)`;
        dom.activeBuffsSection.appendChild(buffElement);
    });
}

// --- Update Task Due Date Timers --- 
function updateTaskTimers() {
    const timerElements = dom.taskList.querySelectorAll('.task-time-display');
    timerElements.forEach(timerSpan => {
        const listItem = timerSpan.closest('li'); // Find the parent list item
        if (listItem && listItem.dataset.dueDate) {
            const timeInfo = formatTimeRemaining(listItem.dataset.dueDate);
            timerSpan.innerHTML = timeInfo.text; // Update the text
            
            // Update classes based on status
            timerSpan.classList.remove('due-soon', 'overdue'); // Clear old statuses
            if (timeInfo.status === 'due-soon') {
                timerSpan.classList.add('due-soon');
            } else if (timeInfo.status === 'overdue') {
                timerSpan.classList.add('overdue');
            }
        }
    });
}

// The main game loop
function gameLoop() {
    const now = Date.now();
    const deltaTime = (now - (lastUpdateTime || now)) / 1000; // Time delta in seconds
    const deltaTimeMs = deltaTime * 1000; // Time delta in milliseconds
    lastUpdateTime = now;

    // --- Process Active Energy Multipliers ---
    let combinedEnergyMultiplier = 1.0; // Start with temporary multiplier
    gameState.activeEnergyMultipliers = gameState.activeEnergyMultipliers.filter(m => {
        m.duration -= deltaTimeMs;
        if (m.duration > 0) {
            combinedEnergyMultiplier *= m.multiplier;
            return true; // Keep the multiplier
        } else {
            console.log(`Energy multiplier ${m.multiplier}x expired.`);
            return false; // Remove the multiplier
        }
    });

    // --- Apply Streak Multiplier ---
    // Combine streak multiplier with temporary multipliers
    combinedEnergyMultiplier *= gameState.streakEnergyMultiplier;

    // Calculate passive energy gain from generators
    const passiveGain = calculatePassiveEnergyGain(); // From generators.js

    // Calculate and apply Discipline drain from generators
    const disciplineDrain = calculateDisciplineDrain(); // From generators.js
    gameState.disciplinePoints -= disciplineDrain * deltaTime;

    // Ensure Discipline doesn't go below zero (optional, but good practice)
    if (gameState.disciplinePoints < 0) {
        gameState.disciplinePoints = 0;
    }

    // --- Apply Energy Gain (only if Discipline > 0) ---
    if (gameState.disciplinePoints > 0) {
        // Apply the combined multiplier (temporary + streak)
        gameState.energy += (passiveGain * combinedEnergyMultiplier) * deltaTime; 
    } else {
        // Optional: Could add logic here if generators should consume *something* even with 0 discipline
        // console.log("Generators running inefficiently due to zero discipline.");
    }

    // Update UI
    updateResources();
    updateBuffTimers();
    updateTaskTimers();
    updatePrestigeButton(); // From prestige.js
    updateGeneratorDisplay(); // Call the update function instead of full render

    // Request the next frame
    requestAnimationFrame(gameLoop);
}

// Initialization function
function init() {
    // Load saved state first
    loadGame(); // From saveLoad.js
    initializeGeneratorState(); // Initialize generator counts based on config
    checkDailyStreak(); // Check and potentially reset streak after loading

    // Set up event listeners
    dom.addTaskBtn.addEventListener('click', addTask); // From tasks.js
    dom.prestigeBtn.addEventListener('click', attemptPrestige); // From prestige.js

    // Initial render of all UI components
    renderTasks(); // Renders tasks including initial timer text
    renderGenerators(); // From generators.js
    renderFocusTree(); // From prestige.js

    // Start the game loop
    lastUpdateTime = Date.now();
    requestAnimationFrame(gameLoop);

    // Start auto-saving
    startAutoSave(); // From saveLoad.js

    console.log("Game initialized (using modules)");
}

// Start the game
init(); 