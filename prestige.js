// Prestige Logic (Focus Layer)
import { gameState, resetForPrestige } from './state.js';
import { PRESTIGE_REQUIREMENT, focusUpgradeConfig } from './config.js';
import { saveGame } from './saveLoad.js';
import { formatNumber } from './utils.js';
import { updateResources } from './main.js';
import { renderGenerators } from './generators.js';
import * as dom from './dom.js';

// Function to calculate Focus Points gained on prestige
function calculateFocusPointsGain() {
    if (gameState.energy < PRESTIGE_REQUIREMENT) {
        return 0;
    }
    // Simple formula for now: 1 FP per requirement met
    return Math.floor(gameState.energy / PRESTIGE_REQUIREMENT);
}

export function attemptPrestige() {
    if (gameState.energy >= PRESTIGE_REQUIREMENT) {
        const focusGain = calculateFocusPointsGain();
        console.log(`Attempting Prestige: Gaining ${formatNumber(focusGain)} Focus Points.`);

        gameState.focusPoints += focusGain;
        resetForPrestige(); // Use the reset function from state.js

        updateResources();
        renderGenerators();
        renderFocusTree(); // Re-render tree after FP gain

        saveGame();
        console.log("Prestige successful!");
    } else {
        console.log(`Cannot prestige yet. Need ${formatNumber(PRESTIGE_REQUIREMENT)} energy, have ${formatNumber(gameState.energy)}.`);
    }
}

export function buyFocusUpgrade(upgradeId) {
    console.log(`Attempting to buy focus upgrade: ${upgradeId}`);
    const config = focusUpgradeConfig[upgradeId];
    if (!config) return;

    const currentLevel = gameState.focusUpgradesPurchased[upgradeId] || 0;
    const maxLevel = config.maxLevel || 1;
    if (currentLevel >= maxLevel) return;

    const cost = config.cost; // TODO: Add cost scaling
    if (gameState.focusPoints >= cost) {
        gameState.focusPoints -= cost;
        gameState.focusUpgradesPurchased[upgradeId] = currentLevel + 1;

        console.log(`Purchased upgrade: ${config.name} (Level ${currentLevel + 1})`);
        updateResources();
        renderFocusTree();
        renderGenerators(); // Re-render generators in case costs/production changed
        saveGame();
    } else {
        console.log(`Not enough Focus Points for ${config.name}. Need ${formatNumber(cost)}, have ${formatNumber(gameState.focusPoints)}`);
    }
}

export function renderFocusTree() {
    dom.focusTreeSection.innerHTML = '<h3>Focus Tree</h3>';

    for (const id in focusUpgradeConfig) {
        const config = focusUpgradeConfig[id];
        const currentLevel = gameState.focusUpgradesPurchased[id] || 0;
        const maxLevel = config.maxLevel || 1;
        const cost = config.cost;
        const canAfford = gameState.focusPoints >= cost;
        const isMaxLevel = currentLevel >= maxLevel;

        const div = document.createElement('div');
        div.classList.add('focus-upgrade-item');

        const nameStrong = document.createElement('strong');
        nameStrong.textContent = config.name;
        div.appendChild(nameStrong);

        let levelText = '';
        if (maxLevel > 1) {
            levelText = ` (Level ${formatNumber(currentLevel)}/${formatNumber(maxLevel)})`;
        } else if (isMaxLevel) {
            levelText = ' (Purchased)';
        }
        div.appendChild(document.createTextNode(levelText));
        div.appendChild(document.createElement('br'));

        div.appendChild(document.createTextNode(config.description));
        div.appendChild(document.createElement('br'));

        div.appendChild(document.createTextNode(`Cost: ${formatNumber(cost)} Focus Points`));

        const buyBtn = document.createElement('button');
        buyBtn.textContent = isMaxLevel ? 'Max Level' : 'Buy';
        buyBtn.onclick = () => buyFocusUpgrade(id);
        buyBtn.disabled = !canAfford || isMaxLevel;

        if (!isMaxLevel || maxLevel > 1) {
            div.appendChild(document.createElement('br'));
            div.appendChild(buyBtn);
        }

        dom.focusTreeSection.appendChild(div);
    }
    // console.log("Rendering focus tree");
}

// Check prestige status and update button in the UI
export function updatePrestigeButton() {
    const canPrestige = gameState.energy >= PRESTIGE_REQUIREMENT;
    dom.prestigeBtn.disabled = !canPrestige;
    dom.prestigeBtn.textContent = `Refocus (Requires ${formatNumber(PRESTIGE_REQUIREMENT)} Energy)${canPrestige ? ' - Ready!' : ''}`;
} 