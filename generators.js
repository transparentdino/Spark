// Generator Logic
import { gameState } from './state.js';
import { generatorConfig } from './config.js';
import { saveGame } from './saveLoad.js';
import { formatNumber } from './utils.js';
import { updateResources } from './main.js'; // Circular dependency okay for function calls
import * as dom from './dom.js';

// Object to hold references to generator DOM elements for updating
let generatorElements = {};

// Function to calculate the current cost of a generator, applying discounts
export function getGeneratorCost(generatorId) {
    const config = generatorConfig[generatorId];
    const currentCount = gameState.generators[generatorId]?.count || 0;
    let costMultiplier = 1;

    // Apply cost reductions from upgrades
    if (generatorId === 'gen2' && gameState.focusUpgradesPurchased['internDiscount']) {
        costMultiplier *= 0.9; // 10% discount
    }

    return Math.ceil(config.baseCost * Math.pow(config.costScale, currentCount) * costMultiplier);
}

export function buyGenerator(generatorId) {
    console.log(`Attempting to buy generator: ${generatorId}`);
    const cost = getGeneratorCost(generatorId);
    const config = generatorConfig[generatorId];

    if (gameState.energy >= cost) {
        gameState.energy -= cost;
        gameState.generators[generatorId].count++;
        updateResources();
        saveGame();
        console.log(`Bought ${config.name}, new count: ${gameState.generators[generatorId].count}`);
    } else {
        console.log(`Not enough energy to buy ${config.name}. Need ${formatNumber(cost)}, have ${formatNumber(gameState.energy)}`);
    }
}

// Renders the initial structure for generators (Called ONCE)
export function renderGenerators() {
    dom.generatorsSection.innerHTML = ''; // Clear only once during init
    generatorElements = {}; // Clear refs on full re-render

    for (const id in generatorConfig) {
        const config = generatorConfig[id];

        const div = document.createElement('div');
        div.classList.add('generator-item');

        const nameStrong = document.createElement('strong');
        nameStrong.textContent = config.name;
        div.appendChild(nameStrong);
        div.appendChild(document.createElement('br'));

        const countSpan = document.createElement('span');
        div.appendChild(document.createTextNode('Count: '));
        div.appendChild(countSpan);
        div.appendChild(document.createElement('br'));

        const prodSpan = document.createElement('span');
        div.appendChild(document.createTextNode('Producing: '));
        div.appendChild(prodSpan);
        div.appendChild(document.createTextNode(' Energy/sec'));
        div.appendChild(document.createElement('br'));

        const costSpan = document.createElement('span');
        div.appendChild(document.createTextNode('Cost: '));
        div.appendChild(costSpan);
        div.appendChild(document.createTextNode(' Energy'));
        div.appendChild(document.createElement('br'));

        const buyBtn = document.createElement('button');
        buyBtn.textContent = 'Buy';
        buyBtn.onclick = () => buyGenerator(id); // Attach listener permanently
        div.appendChild(buyBtn);

        // Store references for updating
        generatorElements[id] = {
            count: countSpan,
            production: prodSpan,
            cost: costSpan,
            button: buyBtn
        };

        dom.generatorsSection.appendChild(div);
    }
    updateGeneratorDisplay(); // Update display with initial values
}

// Updates the displayed values for generators (Called in gameLoop)
export function updateGeneratorDisplay() {
     for (const id in generatorConfig) {
        if (!generatorElements[id]) continue; // Skip if element doesn't exist yet

        const config = generatorConfig[id];
        const state = gameState.generators[id] || { count: 0 }; // Handle potential undefined state initially
        const currentCost = getGeneratorCost(id);

        // Calculate production including boosts
        let currentProduction = state.count * config.baseProduction;
        let displayMultiplier = 1;
        if (id === 'gen1' && gameState.focusUpgradesPurchased['gen1Boost']) {
            displayMultiplier *= 2;
        }
        // TODO: Apply general production boosts here
        currentProduction *= displayMultiplier;

        // Update the text content and button state using stored references
        generatorElements[id].count.textContent = formatNumber(state.count);
        generatorElements[id].production.textContent = formatNumber(currentProduction);
        generatorElements[id].cost.textContent = formatNumber(currentCost);
        generatorElements[id].button.disabled = gameState.energy < currentCost;
    }
}

// Calculate total passive energy generation per second
export function calculatePassiveEnergyGain() {
    let passiveEnergyGain = 0;
    for (const id in gameState.generators) {
        const generatorState = gameState.generators[id];
        const config = generatorConfig[id];
        if (generatorState.count > 0 && config) {
            let productionMultiplier = 1;
            // Apply specific generator boosts
            if (id === 'gen1' && gameState.focusUpgradesPurchased['gen1Boost']) {
                productionMultiplier *= 2;
            }
            // TODO: Apply general production boosts affecting all generators

            passiveEnergyGain += generatorState.count * config.baseProduction * productionMultiplier;
        }
    }
    return passiveEnergyGain;
}

// Calculate total Discipline drain per second from generators
const DISCIPLINE_DRAIN_PER_GENERATOR = 0.1; // Adjust this value for balance

export function calculateDisciplineDrain() {
    let totalGenerators = 0;
    for (const id in gameState.generators) {
        totalGenerators += gameState.generators[id].count;
    }
    return totalGenerators * DISCIPLINE_DRAIN_PER_GENERATOR;
} 