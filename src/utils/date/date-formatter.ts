import {
	format,
	isToday,
	isTomorrow,
	isThisYear,
	parse,
	parseISO,
	isValid,
	startOfDay,
} from "date-fns";
import { enUS } from "date-fns/locale";

/**
 * Format a date in a human-readable format
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
	if (isToday(date)) {
		return "Today";
	} else if (isTomorrow(date)) {
		return "Tomorrow";
	}

	// Format as Month Day, Year for other dates
	if (isThisYear(date)) {
		return format(date, "MMM d");
	} else {
		return format(date, "MMM d, yyyy");
	}
}

/**
 * Parse a date string in various formats
 * @param dateString Date string to parse
 * @param customFormats Optional array of custom date format patterns to try
 * @returns Parsed date as a number or undefined if invalid
 */
export function parseLocalDate(
	dateString: string,
	customFormats?: string[],
): number | undefined {
	if (!dateString) return undefined;

	// Trim whitespace
	dateString = dateString.trim();

	// Skip template strings
	if (dateString.includes("{{") || dateString.includes("}}")) {
		return undefined;
	}

	// Check if the date string contains time information
	const hasTimeInfo = /\d{1,2}:\d{2}/.test(dateString);

	// Define default format patterns to try with date-fns
	// Date-time formats (with time) should be tried first when time info is present
	const dateTimeFormats = [
		"yyyy-MM-dd HH:mm", // ISO format with time
		"yyyy-MM-dd H:mm", // ISO format with single-digit hour
		"yyyy/MM/dd HH:mm", // YYYY/MM/DD with time
		"yyyy/MM/dd H:mm",
		"dd-MM-yyyy HH:mm", // DD-MM-YYYY with time
		"dd/MM/yyyy HH:mm", // DD/MM/YYYY with time
		"MM-dd-yyyy HH:mm", // MM-DD-YYYY with time
		"MM/dd/yyyy HH:mm", // MM/DD/YYYY with time
		"yyyy.MM.dd HH:mm", // YYYY.MM.DD with time
		"yyyyMMddHHmmss",
		"yyyyMMdd_HHmmss",
	];

	const dateOnlyFormats = [
		"yyyy-MM-dd", // ISO format
		"yyyy/MM/dd", // YYYY/MM/DD
		"dd-MM-yyyy", // DD-MM-YYYY
		"dd/MM/yyyy", // DD/MM/YYYY
		"MM-dd-yyyy", // MM-DD-YYYY
		"MM/dd/yyyy", // MM/DD/YYYY
		"yyyy.MM.dd", // YYYY.MM.DD
		"dd.MM.yyyy", // DD.MM.YYYY
		"yyyy年M月d日", // Chinese/Japanese format
		"MMM d, yyyy", // MMM DD, YYYY (e.g., Jan 15, 2025)
		"MMM dd, yyyy", // MMM DD, YYYY with leading zero
		"d MMM yyyy", // DD MMM YYYY (e.g., 15 Jan 2025)
		"dd MMM yyyy", // DD MMM YYYY with leading zero
	];

	// Try date-time formats first if time info is present, otherwise try date-only formats
	const defaultFormats = hasTimeInfo
		? [...dateTimeFormats, ...dateOnlyFormats]
		: [...dateOnlyFormats, ...dateTimeFormats];

	// Combine custom formats with default formats
	const allFormats = customFormats
		? [...customFormats, ...defaultFormats]
		: defaultFormats;

	// Try each format with date-fns parse
	for (const formatString of allFormats) {
		try {
			const parsedDate = parse(dateString, formatString, new Date(), {
				locale: enUS,
			});

			// Check if the parsed date is valid
			if (isValid(parsedDate)) {
				// Only normalize to start of day if the original string had no time info
				// and the format pattern also has no time component
				const formatHasTime = /[Hh]:mm/.test(formatString);
				if (!hasTimeInfo && !formatHasTime) {
					const normalizedDate = startOfDay(parsedDate);
					return normalizedDate.getTime();
				}
				// Preserve the time information
				return parsedDate.getTime();
			}
		} catch (e) {
			// Silently continue to next format
			continue;
		}
	}

	// Try parseISO as a fallback for ISO strings
	try {
		const isoDate = parseISO(dateString);
		if (isValid(isoDate)) {
			// Only normalize to start of day if the original string had no time info
			if (!hasTimeInfo) {
				const normalizedDate = startOfDay(isoDate);
				return normalizedDate.getTime();
			}
			return isoDate.getTime();
		}
	} catch (e) {
		// Silently continue
	}

	// If all parsing attempts fail, log a warning
	console.warn(`Worker: Could not parse date: ${dateString}`);
	return undefined;
}

/**
 * Get today's date in local timezone as YYYY-MM-DD format
 * This fixes the issue where using toISOString() can return yesterday's date
 * for users in timezones ahead of UTC
 * @returns Today's date in YYYY-MM-DD format in local timezone
 */
export function getTodayLocalDateString(): string {
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, "0");
	const day = String(today.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/**
 * Convert a Date object to YYYY-MM-DD format in local timezone
 * This fixes the issue where using toISOString() can return wrong date
 * for users in timezones ahead of UTC
 * @param date The date to format
 * @returns Date in YYYY-MM-DD format in local timezone
 */
export function getLocalDateString(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/**
 * Convert a date to a relative time string, such as
 * "yesterday", "today", "tomorrow", etc.
 * using Intl.RelativeTimeFormat
 */
export function getRelativeTimeString(
	date: Date | number,
	lang = navigator.language,
): string {
	// 允许传入日期对象或时间戳
	const timeMs = typeof date === "number" ? date : date.getTime();

	// 获取当前日期（去除时分秒）
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// 获取传入日期（去除时分秒）
	const targetDate = new Date(timeMs);
	targetDate.setHours(0, 0, 0, 0);

	// 计算日期差（以天为单位）
	const deltaDays = Math.round(
		(targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
	);

	// 创建相对时间格式化器
	const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });

	// 返回格式化后的相对时间字符串
	return rtf.format(deltaDays, "day");
}
