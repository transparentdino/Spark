// Game State Management
import { generatorConfig } from './config.js';

// Core game state variables, exported for modification by other modules
export let gameState = {
    energy: 0,
    focusPoints: 0,
    disciplinePoints: 0,
    generators: {},
    focusUpgradesPurchased: {}, // Store { upgradeId: level }
    activeEnergyMultipliers: [], // Array to store { multiplier: 1.x, duration: ms }
    // Streak Tracking
    currentStreak: 0,
    lastCompletionTimestamp: 0, // Store timestamp of last task completion
    streakEnergyMultiplier: 1.0 // Multiplier derived from the streak
};

// Task list, managed here but potentially modified by tasks.js
export let tasks = [];
export let lastTaskId = 0;

// Function to update the task list (used by loadGame)
export function setTasks(newTasks) {
    // Normalize tasks to ensure all properties exist (important after adding new props)
    tasks = newTasks.map(task => ({
        id: task.id || 0,
        text: task.text || 'Unnamed Task',
        dueDate: task.dueDate || null,
        completed: task.completed || false,
        difficulty: task.difficulty || 'medium',
        // --- Default values for breakdown properties ---
        isBreakable: task.isBreakable !== undefined ? task.isBreakable : (task.difficulty === 'hard'), // Default breakable if hard and prop missing
        isSubtask: task.isSubtask || false,
        parentTaskId: task.parentTaskId || null,
        subTaskIds: task.subTaskIds || [], // Ensure it's always an array!
        isCollapsed: task.isCollapsed || false
    }));

    lastTaskId = tasks.reduce((maxId, task) => Math.max(maxId, task.id || 0), 0);
    console.log("Tasks state updated and normalized.");
}

// Function to update the whole gameState (used by loadGame)
export function setGameState(newState) {
    gameState.energy = newState.energy ?? 0;
    gameState.focusPoints = newState.focusPoints ?? 0;
    gameState.disciplinePoints = newState.disciplinePoints ?? 0;
    gameState.generators = newState.generators ?? {};
    gameState.focusUpgradesPurchased = newState.focusUpgradesPurchased ?? {};
    gameState.activeEnergyMultipliers = newState.activeEnergyMultipliers ?? [];
    // Load streak data
    gameState.currentStreak = newState.currentStreak ?? 0;
    gameState.lastCompletionTimestamp = newState.lastCompletionTimestamp ?? 0;
    gameState.streakEnergyMultiplier = newState.streakEnergyMultiplier ?? 1.0; // Recalculated later, but load for safety
}

// Function to reset parts of the game state (used by prestige)
export function resetForPrestige() {
    gameState.energy = 0;
    gameState.disciplinePoints = 0; // Reset Discipline on prestige
    // Reset generator counts
    for (const id in generatorConfig) {
        if (gameState.generators[id]) {
            gameState.generators[id].count = 0;
        }
    }
    // tasks = []; // Optionally reset tasks on prestige? Currently keeping them.
}

// Function to increment lastTaskId safely
export function getNextTaskId() {
    lastTaskId++;
    return lastTaskId;
}

// Initialize generator counts in the state object
export function initializeGeneratorState() {
    for (const id in generatorConfig) {
        if (!gameState.generators[id]) {
            gameState.generators[id] = { count: 0 };
        }
    }
} 