// Saving and Loading Logic
import { gameState, tasks, setTasks, setGameState, initializeGeneratorState } from './state.js';

const SAVE_KEY = 'productivityAscendanceSave';

export function saveGame() {
    try {
        // Make sure gameState includes disciplinePoints before spreading
        const dataToSave = { ...gameState, tasks: tasks };
        localStorage.setItem(SAVE_KEY, JSON.stringify(dataToSave));
        // console.log("Game saved!"); // Reduced console noise
    } catch (error) {
        console.error("Error saving game:", error);
    }
}

export function loadGame() {
    try {
        const savedData = localStorage.getItem(SAVE_KEY);
        if (savedData) {
            const loadedState = JSON.parse(savedData);

            // Use state setters to update the central state
            setGameState(loadedState);
            setTasks(loadedState.tasks || []);

            console.log("Game loaded successfully.");
        } else {
            console.log("No save file found, starting new game.");
        }
    } catch (error) {
        console.error("Error loading game:", error);
        // Reset to default state on error
        setGameState({}); // Reset core state
        setTasks([]); // Reset tasks
        console.log("Starting a new game due to load error.");
    }
    // Ensure generator structure is initialized after loading or starting new
    initializeGeneratorState();
}

// Function to schedule auto-saving
let autoSaveInterval = null;
export function startAutoSave(intervalSeconds = 30) {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
    autoSaveInterval = setInterval(saveGame, intervalSeconds * 1000);
    console.log(`Auto-save started every ${intervalSeconds} seconds.`);
} 