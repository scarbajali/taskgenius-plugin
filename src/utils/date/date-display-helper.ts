/**
 * Helper functions for displaying dates correctly in the UI
 * Handles the conversion between UTC noon timestamps and local date display
 */

/**
 * Convert a UTC noon timestamp to a local date string for display in date inputs
 *
 * The timestamp is stored as UTC noon (12:00 UTC) to avoid date boundary issues.
 * This function converts it back to the intended local date for display.
 *
 * @param timestamp - The timestamp stored as UTC noon
 * @returns Date string in YYYY-MM-DD format for the local date
 */
export function timestampToLocalDateString(
	timestamp: number | undefined
): string {
	if (!timestamp) return "";

	const date = new Date(timestamp);

	// Detect UTC-noon storage (exact 12:00 UTC)
	const isUTCNoon = date.getUTCHours() === 12 && date.getUTCMinutes() === 0;

	let year: number;
	let month: number; // 0-based
	let day: number;

	if (isUTCNoon) {
		// Use UTC calendar date to reconstruct the intended local date
		year = date.getUTCFullYear();
		month = date.getUTCMonth();
		day = date.getUTCDate();

		const localDate = new Date(year, month, day);
		const y = localDate.getFullYear();
		const m = String(localDate.getMonth() + 1).padStart(2, "0");
		const d = String(localDate.getDate()).padStart(2, "0");
		return `${y}-${m}-${d}`;
	} else {
		// For local-midnight or arbitrary timestamps, use local calendar date directly
		year = date.getFullYear();
		month = date.getMonth();
		day = date.getDate();
		return `${year}-${String(month + 1).padStart(2, "0")}-${String(
			day
		).padStart(2, "0")}`;
	}
}

/**
 * Convert a local date string (YYYY-MM-DD) to a UTC noon timestamp for storage
 *
 * This ensures consistent date storage across timezones by storing all dates
 * at UTC noon, avoiding edge cases where dates might shift due to timezone differences.
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Timestamp at UTC noon for the given date
 */
export function localDateStringToTimestamp(
	dateString: string
): number | undefined {
	if (!dateString) return undefined;

	const [year, month, day] = dateString.split("-").map(Number);
	if (!year || !month || !day) return undefined;

	// Create date at noon UTC to ensure consistent storage
	return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getTime();
}
