import { moment } from "obsidian";

type DateInput = number | string | Date | undefined | null;

const toDate = (value: DateInput): Date | null => {
	if (value === undefined || value === null) return null;
	if (value instanceof Date) return value;
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Check whether a timestamp represents a date-only value (00:00:00.000).
 */
export function isDateOnly(timestamp: DateInput): boolean {
	const date = toDate(timestamp);
	if (!date) return false;

	return (
		date.getHours() === 0 &&
		date.getMinutes() === 0 &&
		date.getSeconds() === 0 &&
		date.getMilliseconds() === 0
	);
}

/**
 * Format a timestamp using smart date/time detection.
 * - 00:00:00.000 -> "YYYY-MM-DD"
 * - Otherwise -> "YYYY-MM-DD HH:mm" (seconds optional)
 */
export function formatDate(
	timestamp: DateInput,
	options?: {
		forceFormat?: "date-only" | "date-time";
		includeSeconds?: boolean;
	},
): string {
	const date = toDate(timestamp);
	if (!date) return "";

	const includeSeconds = options?.includeSeconds ?? false;

	if (options?.forceFormat === "date-only") {
		return moment(date).format("YYYY-MM-DD");
	}

	if (options?.forceFormat === "date-time") {
		return moment(date).format(
			includeSeconds ? "YYYY-MM-DD HH:mm:ss" : "YYYY-MM-DD HH:mm",
		);
	}

	if (isDateOnly(date)) {
		return moment(date).format("YYYY-MM-DD");
	}

	return moment(date).format(
		includeSeconds ? "YYYY-MM-DD HH:mm:ss" : "YYYY-MM-DD HH:mm",
	);
}
