// Game Configuration Data

export const generatorConfig = {
    'gen1': { name: 'Manual Click', baseCost: 10, costScale: 1.15, baseProduction: 0.1 },
    'gen2': { name: 'Student Intern', baseCost: 100, costScale: 1.20, baseProduction: 1 },
    'gen3': { name: 'Automated Coffee Machine', baseCost: 1100, costScale: 1.25, baseProduction: 10 },
    'gen4': { name: 'Focused Workstation', baseCost: 13000, costScale: 1.30, baseProduction: 85 },
    // Add more generators here...
};

export const PRESTIGE_REQUIREMENT = 1000; // Energy needed to Refocus

export const focusUpgradeConfig = {
    'taskEnergyBoost': {
        name: 'Efficient Tasking',
        cost: 1,
        description: 'Gain +5 base Energy per completed task.',
        maxLevel: 5,
    },
    'gen1Boost': {
        name: 'Click Training',
        cost: 2,
        description: 'Manual Click generators produce 2x more Energy.',
        maxLevel: 1,
    },
    'internDiscount': {
        name: 'Intern Referral',
        cost: 5,
        description: 'Student Interns are 10% cheaper.',
        maxLevel: 1,
    }
}; 