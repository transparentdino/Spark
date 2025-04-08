// Utility Functions

export function formatNumber(num) {
    if (num === null || num === undefined) return '0'; // Handle null/undefined
    num = Number(num); // Ensure it's a number
    if (isNaN(num)) return '0'; // Handle NaN

    if (Math.abs(num) < 1000) return num.toFixed(0);
    if (Math.abs(num) < 1000000) return (num / 1000).toFixed(1) + 'k';
    // Add more suffixes (M, B, T, etc.) as needed
    return (num / 1000000).toFixed(1) + 'M';
}

// Formats remaining time until a deadline
export function formatTimeRemaining(dueDateString) {
    if (!dueDateString) return { text: '', status: 'ok', remainingMs: Infinity }; // No due date set

    try {
        // MODIFICATION: Check if the string already includes time.
        let deadlineTimestamp;
        if (typeof dueDateString === 'string' && dueDateString.includes('T')) {
            // If it includes 'T', parse it directly (YYYY-MM-DDTHH:mm format)
            deadlineTimestamp = new Date(dueDateString).getTime();
        } else {
            // Otherwise, assume YYYY-MM-DD and set to end of the day for backward compatibility
            deadlineTimestamp = new Date(dueDateString + 'T23:59:59.999').getTime();
        }

        if (isNaN(deadlineTimestamp)) { // Check if parsing failed
            console.error("Failed to parse due date string:", dueDateString);
            return { text: '', status: 'error', remainingMs: NaN };
        }

        const now = Date.now();
        const remainingMs = deadlineTimestamp - now;

        let status = 'ok';
        let timeString = '';

        if (remainingMs <= 0) {
            status = 'overdue';
            // Ensure overdue span has correct class
            timeString = " <span class='task-time-display overdue'>(Overdue!)</span>";
            return { text: timeString, status: status, remainingMs: remainingMs };
        }

        const oneDayMs = 24 * 60 * 60 * 1000;
        // Make 'due-soon' threshold maybe 48 hours instead of 24?
        if (remainingMs < (oneDayMs * 2)) {
            status = 'due-soon'; // Due within 48 hours
        }

        const totalSeconds = Math.floor(remainingMs / 1000);
        const seconds = totalSeconds % 60;
        const totalMinutes = Math.floor(totalSeconds / 60);
        const minutes = totalMinutes % 60;
        const totalHours = Math.floor(totalMinutes / 60);
        const hours = totalHours % 24;
        const days = Math.floor(totalHours / 24);

        const pad = (n) => String(n).padStart(2, '0');

        // Build the time string based on remaining duration
        if (days > 1) {
            timeString = `${days}d ${hours}h`; // Simplified for longer durations
        } else if (totalHours >= 1) {
            timeString = `${totalHours}h ${pad(minutes)}m`; // Show hours and minutes if >= 1 hour
        } else if (totalMinutes >= 1) {
            timeString = `${minutes}m ${pad(seconds)}s`; // Show minutes and seconds if < 1 hour
        } else {
            timeString = `${seconds}s`; // Show only seconds if < 1 minute
        }

        // Add appropriate class to the span based on status
        const statusClass = status === 'due-soon' ? 'due-soon' : (status === 'overdue' ? 'overdue' : ''); // 'ok' has no extra class
        const formattedText = ` <span class='task-time-display ${statusClass}'>(${timeString} left)</span>`;

        return { text: formattedText, status: status, remainingMs: remainingMs };

    } catch (e) {
        console.error("Error parsing due date:", dueDateString, e);
        return { text: '', status: 'error', remainingMs: NaN }; // Return error status
    }
} 