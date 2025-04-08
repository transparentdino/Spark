// Task Management Logic
import { gameState, tasks, getNextTaskId } from './state.js';
import { saveGame } from './saveLoad.js';
import { updateResources, calculateStreakMultiplier, isSameDay, isYesterday } from './main.js'; // Import from main, as main imports this
import { formatTimeRemaining } from './utils.js'; // Import the new formatter
import * as dom from './dom.js';

// --- DOM Elements for Modal (assuming they exist in index.html) ---
const breakdownModal = document.getElementById('breakdown-modal');
const modalOriginalTaskName = document.getElementById('modal-original-task-name');
const modalParentTaskIdInput = document.getElementById('modal-parent-task-id');
const numSubtasksInput = document.getElementById('num-subtasks');
const subtaskDetailsDiv = document.getElementById('subtask-details');

// --- Modal Management Functions ---

function openBreakdownModal(taskId) {
    const parentTask = tasks.find(task => task.id === taskId);
    if (!parentTask) {
        console.error("Cannot open breakdown modal: Task not found", taskId);
        return;
    }
    if (!parentTask.isBreakable || parentTask.difficulty !== 'hard' || (parentTask.subTaskIds && parentTask.subTaskIds.length > 0)) {
        console.log("Task cannot be broken down (not hard, not breakable, or already has subtasks):", parentTask);
        alert("This task cannot be broken down.");
        return;
    }


    modalOriginalTaskName.textContent = parentTask.text;
    modalParentTaskIdInput.value = parentTask.id;
    numSubtasksInput.value = 2; // Reset to default
    updateSubtaskInputs(); // Generate initial inputs
    breakdownModal.style.display = 'block';
}

function closeBreakdownModal() {
    breakdownModal.style.display = 'none';
    // Clear details to prevent stale data on reopen
    subtaskDetailsDiv.innerHTML = '';
}

function updateSubtaskInputs() {
    const numSubtasks = parseInt(numSubtasksInput.value, 10) || 2; // Default to 2 if invalid
    const parentTaskId = parseInt(modalParentTaskIdInput.value, 10);
    const parentTask = tasks.find(task => task.id === parentTaskId);
    const parentDueDate = parentTask?.dueDate; // Get parent due date for potential default

    subtaskDetailsDiv.innerHTML = ''; // Clear existing inputs

    if (numSubtasks < 2) {
        numSubtasksInput.value = 2; // Enforce minimum of 2
        return updateSubtaskInputs(); // Recalculate with correct minimum
    }


    for (let i = 1; i <= numSubtasks; i++) {
        const div = document.createElement('div');

        const nameLabel = document.createElement('label');
        nameLabel.textContent = `Sub-task ${i}:`;
        nameLabel.htmlFor = `subtask-name-${i}`;

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = `subtask-name-${i}`;
        nameInput.dataset.index = i; // Store index for easier retrieval
        nameInput.placeholder = `Name (e.g., Sub-task ${i}/${numSubtasks})`;
        nameInput.value = `Sub-task ${i}/${numSubtasks}`; // Default name

        const dateLabel = document.createElement('label');
        dateLabel.textContent = `Due:`;
        dateLabel.htmlFor = `subtask-date-${i}`;

        const dateInput = document.createElement('input');
        dateInput.type = 'datetime-local'; // Use datetime-local for date and time
        dateInput.id = `subtask-date-${i}`;
        dateInput.dataset.index = i;
        if (parentDueDate) {
            try {
                // Attempt to format parent date for datetime-local. Needs YYYY-MM-DDTHH:mm
                // If parentDueDate is just YYYY-MM-DD, append T00:00
                const datePart = parentDueDate.includes('T') ? parentDueDate : `${parentDueDate}T00:00`;
                dateInput.value = datePart;
            } catch (e) {
                 console.warn("Could not set default subtask date from parent:", e);
            }
        }


        div.appendChild(nameLabel);
        div.appendChild(nameInput);
        div.appendChild(dateLabel);
        div.appendChild(dateInput);
        subtaskDetailsDiv.appendChild(div);
    }
}


function confirmBreakdown() {
    const parentTaskId = parseInt(modalParentTaskIdInput.value, 10);
    const parentTaskIndex = tasks.findIndex(task => task.id === parentTaskId);
    if (parentTaskIndex === -1) {
        console.error("Parent task not found during confirmation:", parentTaskId);
        closeBreakdownModal();
        return;
    }
    const parentTask = tasks[parentTaskIndex];

    const numSubtasks = parseInt(numSubtasksInput.value, 10);
    const subTaskInputs = subtaskDetailsDiv.querySelectorAll('#subtask-details div');

    if (subTaskInputs.length !== numSubtasks) {
        console.error("Mismatch between expected and found subtask inputs.");
        alert("Error processing sub-tasks. Please try again.");
        return;
    }

    console.log(`Confirming breakdown of task ${parentTaskId} into ${numSubtasks} sub-tasks.`);
    parentTask.isBreakable = false; // Mark parent as no longer breakable
    parentTask.subTaskIds = []; // Ensure it's empty before adding new ones
    parentTask.isCollapsed = false; // Expand parent to show new subtasks


    for (let i = 0; i < numSubtasks; i++) {
        const inputDiv = subTaskInputs[i];
        const nameInput = inputDiv.querySelector('input[type="text"]');
        const dateInput = inputDiv.querySelector('input[type="datetime-local"]');

        const subTaskName = nameInput.value.trim() || `Sub-task ${i + 1}/${numSubtasks}`;
        // Get date value. If empty, set to null. Otherwise, format?
        // datetime-local gives "YYYY-MM-DDTHH:mm". We can store this directly.
        const subTaskDueDate = dateInput.value || null;

        const subTaskId = getNextTaskId();
        const newSubTask = {
            id: subTaskId,
            text: subTaskName,
            dueDate: subTaskDueDate, // Store the datetime-local value or null
            completed: false,
            difficulty: 'medium', // Default difficulty for sub-tasks
            isBreakable: false, // Sub-tasks are not breakable
            isSubtask: true,
            parentTaskId: parentTask.id,
            subTaskIds: [],
            isCollapsed: false,
        };

        tasks.push(newSubTask);
        parentTask.subTaskIds.push(subTaskId);
        console.log("Created sub-task:", newSubTask);
    }


    saveGame();
    closeBreakdownModal();
    renderTasks(); // Re-render the list to show changes
    console.log(`Task ${parentTask.id} successfully broken down.`);
}


// --- Make modal functions globally accessible ---
window.closeBreakdownModal = closeBreakdownModal;
window.updateSubtaskInputs = updateSubtaskInputs;
window.confirmBreakdown = confirmBreakdown;


// --- Existing Task Functions ---

export function addTask() {
    const taskText = dom.taskInput.value.trim();
    const dueDate = dom.taskDueDateInput.value;
    const difficulty = dom.taskDifficultySelect.value; // Get selected difficulty

    if (!taskText) {
        alert("Please enter a task description.");
        return;
    }

    const newTask = {
        id: getNextTaskId(),
        text: taskText,
        dueDate: dueDate || null,
        completed: false,
        difficulty: difficulty,
        // --- New properties for task breakdown ---
        isBreakable: difficulty === 'hard', // Only hard tasks are initially breakable
        isSubtask: false,
        parentTaskId: null,
        subTaskIds: [], // Stores IDs of sub-tasks if broken down
        isCollapsed: false // Relevant only for parent tasks
    };

    tasks.push(newTask);
    dom.taskInput.value = '';
    dom.taskDueDateInput.value = '';
    dom.taskDifficultySelect.value = 'medium'; // Reset difficulty to default (medium)

    renderTasks();
    saveGame();
    console.log("Task added:", newTask);
}

export function completeTask(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];

    // Prevent completing parent tasks that have been broken down
    if (task.subTaskIds && task.subTaskIds.length > 0) {
        alert("Complete all sub-tasks first.");
        console.log("Attempted to complete parent task with active sub-tasks:", taskId);
        return;
    }

    // --- Existing Completion Logic (needs adjustment for sub-task rewards) ---

    let isSubTaskCompletion = task.isSubtask;
    let parentTask = null;
    if (isSubTaskCompletion) {
        parentTask = tasks.find(p => p.id === task.parentTaskId);
        if (!parentTask) {
            console.error("Could not find parent task for sub-task:", task);
            // Proceed with caution or potentially remove orphaned sub-task?
        }
    }

    // Default to 'medium' if difficulty is missing (shouldn't happen with new logic)
    const difficulty = task.difficulty || 'medium';

    // --- Update Daily Streak ---
    const now = Date.now();
    if (!gameState.lastCompletionTimestamp || !isSameDay(now, gameState.lastCompletionTimestamp)) {
        // Check if it continues the streak (completed yesterday) or starts a new streak (completed earlier or never)
        if (isYesterday(now, gameState.lastCompletionTimestamp)) {
            gameState.currentStreak++;
            console.log(`Streak continued! Current streak: ${gameState.currentStreak}`);
        } else {
            // Reset streak if last completion wasn't yesterday or today (today is handled by just updating timestamp)
            if (!isSameDay(now, gameState.lastCompletionTimestamp)) {
               console.log(`New streak started. Previous streak was ${gameState.currentStreak}.`);
               gameState.currentStreak = 1;
            } else {
                // Completed another task same day, don't increment streak
                console.log(`Completed another task today. Streak remains ${gameState.currentStreak}.`);
            }
        }
        // Update the multiplier whenever the streak changes
        calculateStreakMultiplier(); // Recalculate the energy multiplier
    } else {
         console.log(`Completed another task today. Streak remains ${gameState.currentStreak}.`);
    }
    // Always update the timestamp to the latest completion
    gameState.lastCompletionTimestamp = now;

    // --- Reward Calculation (NEEDS ADJUSTMENT FOR SUB-TASKS) ---
    // For now, let's give sub-tasks a smaller base reward, maybe 1/3rd?
    // A more robust approach would be to define the parent's total reward
    // and distribute it among sub-tasks.

    let baseReward = isSubTaskCompletion ? 4 : 10; // Smaller base for sub-tasks (approx 10 / 3)

    // Apply upgrades affecting base reward
    if (gameState.focusUpgradesPurchased['taskEnergyBoost']) {
        // Maybe apply less boost to sub-tasks?
        const boostAmount = isSubTaskCompletion ? 2 : 5;
        baseReward += boostAmount * gameState.focusUpgradesPurchased['taskEnergyBoost'];
    }

    // Calculate Due Date Bonus (based on base reward)
    let dueDateBonus = 0;
    if (task.dueDate) {
        try {
            const dueDate = new Date(task.dueDate + 'T23:59:59');
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (!isNaN(dueDate.getTime())) {
                if (today <= dueDate) {
                    dueDateBonus = Math.ceil(baseReward * 0.5);
                    console.log(`Due date bonus calculated: ${dueDateBonus}`);
                }
            }
        } catch (e) { /* ignore date errors */ }
    }

    let calculatedReward = baseReward + dueDateBonus;

    // Calculate Difficulty Bonuses & Multiplier
    let difficultyMultiplier = 1.0;
    let energyMultiplier = 1.0;
    let multiplierDuration = 0; // ms

    switch (difficulty) {
        case 'easy':
            // No bonus for easy
            break;
        case 'medium':
            difficultyMultiplier = 1.5;
            energyMultiplier = 1.1;
            multiplierDuration = 15000; // 15 seconds
            break;
        case 'hard':
            difficultyMultiplier = 2.0;
            energyMultiplier = 1.25;
            multiplierDuration = 30000; // 30 seconds
            break;
    }

    let finalEnergyAward = Math.ceil(calculatedReward * difficultyMultiplier);
    let finalDisciplineAward = Math.ceil(calculatedReward * difficultyMultiplier);

    // --- Award Resources ---
    gameState.disciplinePoints += finalDisciplineAward;
    gameState.energy += finalEnergyAward;

    // Add temporary energy multiplier if applicable
    if (energyMultiplier > 1.0 && multiplierDuration > 0) {
        gameState.activeEnergyMultipliers.push({
            multiplier: energyMultiplier,
            duration: multiplierDuration
        });
        console.log(`Added energy multiplier: ${energyMultiplier}x for ${multiplierDuration / 1000}s`);
    }

    // --- Remove Task & Update Parent (if sub-task) ---
    tasks.splice(taskIndex, 1);

    if (isSubTaskCompletion && parentTask) {
        // Remove completed sub-task ID from parent's list
        const subTaskIndexInParent = parentTask.subTaskIds.indexOf(taskId);
        if (subTaskIndexInParent > -1) {
            parentTask.subTaskIds.splice(subTaskIndexInParent, 1);
            console.log(`Sub-task ${taskId} removed from parent ${parentTask.id}. Remaining: ${parentTask.subTaskIds.length}`);
        }

        // Check if all sub-tasks for the parent are now complete
        if (parentTask.subTaskIds.length === 0) {
            console.log(`All sub-tasks for parent ${parentTask.id} completed. Removing parent task.`);
            const parentTaskToRemoveIndex = tasks.findIndex(p => p.id === parentTask.id);
            if (parentTaskToRemoveIndex > -1) {
                tasks.splice(parentTaskToRemoveIndex, 1);
            } else {
                 console.error("Could not find parent task ${parentTask.id} to remove after final sub-task completion.");
            }
        }
    }

    renderTasks();
    updateResources(); // Call the central update function
    saveGame();
    console.log(`Task completed: ${taskId} (Subtask: ${isSubTaskCompletion}, Difficulty: ${difficulty}). Awarded: ${finalDisciplineAward} Discipline & ${finalEnergyAward} Energy.`);
}

export function deleteTask(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;

    const taskToDelete = tasks[taskIndex];

    // Check if it's a parent task with sub-tasks
    if (taskToDelete.subTaskIds && taskToDelete.subTaskIds.length > 0) {
        console.log(`Deleting parent task ${taskId} and its sub-tasks.`);
        // Find and remove all sub-tasks first
        // Iterate backwards to avoid index issues while splicing
        for (let i = tasks.length - 1; i >= 0; i--) {
            if (tasks[i].parentTaskId === taskId) {
                console.log(`Deleting sub-task ${tasks[i].id} of parent ${taskId}`);
                tasks.splice(i, 1);
            }
        }
        // Now remove the parent task itself
        tasks.splice(taskIndex, 1);
    }
    // Check if it's a sub-task
    else if (taskToDelete.isSubtask && taskToDelete.parentTaskId) {
        console.log(`Deleting sub-task ${taskId}.`);
        // Find the parent and remove this sub-task's ID from its list
        const parentTask = tasks.find(p => p.id === taskToDelete.parentTaskId);
        if (parentTask) {
            const subIdIndex = parentTask.subTaskIds.indexOf(taskId);
            if (subIdIndex > -1) {
                parentTask.subTaskIds.splice(subIdIndex, 1);
                console.log(`Removed sub-task ID ${taskId} from parent ${parentTask.id}`);
            }
        }
        // Remove the sub-task itself
        tasks.splice(taskIndex, 1);
    }
    // Just a regular task (or an empty parent)
    else {
        console.log(`Deleting regular task ${taskId}.`);
        tasks.splice(taskIndex, 1);
    }

    renderTasks();
    saveGame();
}

export function renderTasks() {
    dom.taskList.innerHTML = '';
    const topLevelTasks = tasks.filter(task => !task.isSubtask);

    if (topLevelTasks.length === 0 && tasks.length > 0) {
         // This might happen if only subtasks remain after loading/operations, find orphans?
         console.warn("No top-level tasks found, but tasks array is not empty. Displaying all tasks.");
         const orphanedSubtasks = tasks.filter(task => task.isSubtask);
         if (orphanedSubtasks.length > 0) {
             dom.taskList.innerHTML = '<p>Orphaned sub-tasks found:</p>';
             const ul = document.createElement('ul');
             orphanedSubtasks.forEach(task => renderSingleTask(task, ul, 1));
             dom.taskList.appendChild(ul);
         } else {
            dom.taskList.innerHTML = '<p>No tasks yet. Add some!</p>';
         }
         return;
    } else if (topLevelTasks.length === 0) {
         dom.taskList.innerHTML = '<p>No tasks yet. Add some!</p>';
         return;
    }

    const ul = document.createElement('ul');

    topLevelTasks.forEach(task => {
        // Render the parent/top-level task
        renderSingleTask(task, ul, 0); // 0 = indentation level

        // If it's a parent and not collapsed, render its sub-tasks
        if (task.subTaskIds && task.subTaskIds.length > 0 && !task.isCollapsed) {
            task.subTaskIds.forEach(subTaskId => {
                const subTask = tasks.find(t => t.id === subTaskId);
                if (subTask) {
                    renderSingleTask(subTask, ul, 1); // 1 = indentation level for sub-tasks
                } else {
                    console.warn(`Could not find sub-task with ID: ${subTaskId} for parent ${task.id}`);
                }
            });
        }
    });

    dom.taskList.appendChild(ul);
}

// Helper function to render a single task (parent or sub-task)
function renderSingleTask(task, parentElement, indentationLevel) {
    const li = document.createElement('li');
    li.dataset.taskId = task.id;
    li.style.marginLeft = `${indentationLevel * 30}px`; // Indent sub-tasks
    if (task.isSubtask) {
        li.classList.add('subtask');
    }
    if (task.subTaskIds.length > 0) {
        li.classList.add('parent-task'); // Add class for potential styling
    }

    if (task.dueDate) {
        li.dataset.dueDate = task.dueDate;
    }

    // --- Task Information Display ---
    const infoDiv = document.createElement('div');
    infoDiv.classList.add('task-info');

    let difficultyText = task.difficulty ? ` [${task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}]` : '';
    const taskTextSpan = document.createElement('span');
    taskTextSpan.textContent = task.text + difficultyText;
    infoDiv.appendChild(taskTextSpan);

    // Only add time remaining if there's a due date
    if (task.dueDate) {
        let initialTimeInfo = formatTimeRemaining(task.dueDate);
        const timeSpan = document.createElement('span');
        // Assign class here for initial styling based on status
        timeSpan.className = `task-time-display ${initialTimeInfo.status === 'due-soon' ? 'due-soon' : initialTimeInfo.status === 'overdue' ? 'overdue' : ''}`.trim();
        timeSpan.innerHTML = initialTimeInfo.text; // Use the formatted text
        infoDiv.appendChild(timeSpan);
    }

    li.appendChild(infoDiv);

    // --- Buttons --- 
    const buttonsDiv = document.createElement('div');
    buttonsDiv.classList.add('task-buttons');

    // Collapse/Expand Button (for parents with subtasks)
    if (task.subTaskIds && task.subTaskIds.length > 0) {
        const collapseBtn = document.createElement('button');
        collapseBtn.textContent = task.isCollapsed ? 'Expand' : 'Collapse';
        collapseBtn.classList.add('collapse-btn');
        collapseBtn.onclick = () => toggleCollapseTask(task.id);
        buttonsDiv.appendChild(collapseBtn);
    }

    // Break Down Button (only for breakable hard tasks with NO existing subtasks)
    if (task.isBreakable && task.difficulty === 'hard' && (!task.subTaskIds || task.subTaskIds.length === 0)) {
        const breakDownBtn = document.createElement('button');
        breakDownBtn.textContent = 'Break Down';
        breakDownBtn.classList.add('breakdown-btn');
        // CHANGE: Call openBreakdownModal instead of breakDownTask directly
        breakDownBtn.onclick = () => openBreakdownModal(task.id);
        buttonsDiv.appendChild(breakDownBtn);
    }

    // Complete Button (disabled for parents with sub-tasks)
    const completeBtn = document.createElement('button');
    completeBtn.textContent = 'Complete';
    completeBtn.classList.add('complete-btn');
    if (task.subTaskIds && task.subTaskIds.length > 0) {
        completeBtn.disabled = true;
        completeBtn.title = "Complete all sub-tasks first";
    } else {
        completeBtn.onclick = () => completeTask(task.id);
    }
    buttonsDiv.appendChild(completeBtn);

    // Delete Button (Handles deleting children if parent)
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.onclick = () => deleteTask(task.id);
    buttonsDiv.appendChild(deleteBtn);

    li.appendChild(buttonsDiv);
    parentElement.appendChild(li);
}

// --- MODIFIED: breakDownTask is now just a placeholder/internal logic if needed ---
// --- The actual initiation now happens via openBreakdownModal called by the button ---
// --- We keep the export signature in case it was imported elsewhere, but it does nothing ---
export function breakDownTask(taskId) {
   console.warn("breakDownTask function called directly, but UI interaction now uses openBreakdownModal. Opening modal instead.");
   openBreakdownModal(taskId); // Redirect to the modal opener
}

// --- Function to toggle the collapsed state of a parent task ---
export function toggleCollapseTask(taskId) {
    const task = tasks.find(task => task.id === taskId);
    if (task && task.subTaskIds.length > 0) { // Only toggle parents with subtasks
        task.isCollapsed = !task.isCollapsed;
        console.log(`Task ${taskId} collapsed state: ${task.isCollapsed}`);
        renderTasks(); // Re-render to show/hide sub-tasks
        saveGame();
    }
} 