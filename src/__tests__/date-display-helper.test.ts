/**
 * Tests for date display helper functions
 * Ensures correct conversion between UTC noon timestamps and local date display
 */

import { timestampToLocalDateString, localDateStringToTimestamp } from "@/utils/date/date-display-helper";

describe("Date Display Helper", () => {
	describe("timestampToLocalDateString", () => {
		it("should convert UTC noon timestamp to correct local date string", () => {
			// Test date: 2025-09-01 stored as UTC noon
			const utcNoonTimestamp = new Date(Date.UTC(2025, 8, 1, 12, 0, 0)).getTime();
			
			// The result should always be 2025-09-01 regardless of timezone
			const result = timestampToLocalDateString(utcNoonTimestamp);
			expect(result).toBe("2025-09-01");
		});

		it("should handle undefined timestamp", () => {
			const result = timestampToLocalDateString(undefined);
			expect(result).toBe("");
		});

		it("should handle dates at year boundaries", () => {
			// Test date: 2024-12-31 stored as UTC noon
			const utcNoonTimestamp = new Date(Date.UTC(2024, 11, 31, 12, 0, 0)).getTime();
			const result = timestampToLocalDateString(utcNoonTimestamp);
			expect(result).toBe("2024-12-31");
		});

		it("should handle leap year date", () => {
			// Test date: 2024-02-29 (leap year) stored as UTC noon
			const utcNoonTimestamp = new Date(Date.UTC(2024, 1, 29, 12, 0, 0)).getTime();
			const result = timestampToLocalDateString(utcNoonTimestamp);
			expect(result).toBe("2024-02-29");
		});
	});

	describe("localDateStringToTimestamp", () => {
		it("should convert local date string to UTC noon timestamp", () => {
			const dateString = "2025-09-01";
			const result = localDateStringToTimestamp(dateString);
			
			// Should be UTC noon for the given date
			const expected = new Date(Date.UTC(2025, 8, 1, 12, 0, 0)).getTime();
			expect(result).toBe(expected);
		});

		it("should handle undefined date string", () => {
			const result = localDateStringToTimestamp("");
			expect(result).toBeUndefined();
		});

		it("should handle invalid date string", () => {
			const result = localDateStringToTimestamp("invalid-date");
			expect(result).toBeUndefined();
		});

		it("should handle dates at year boundaries", () => {
			const dateString = "2024-12-31";
			const result = localDateStringToTimestamp(dateString);
			
			const expected = new Date(Date.UTC(2024, 11, 31, 12, 0, 0)).getTime();
			expect(result).toBe(expected);
		});
	});

	describe("Round-trip conversion", () => {
		it("should maintain date integrity through round-trip conversion", () => {
			const testDates = [
				"2025-09-01",
				"2024-12-31",
				"2025-01-01",
				"2024-02-29", // Leap year
				"2025-06-15",
			];

			for (const originalDate of testDates) {
				const timestamp = localDateStringToTimestamp(originalDate);
				const convertedBack = timestampToLocalDateString(timestamp);
				expect(convertedBack).toBe(originalDate);
			}
		});
	});

	describe("Timezone edge cases", () => {
		it("should handle dates correctly even when local time would be different day", () => {
			// This simulates the issue where a date stored as UTC noon
			// might appear as a different day in certain timezones
			
			// Create a timestamp for 2025-09-01 at UTC noon
			const timestamp = new Date(Date.UTC(2025, 8, 1, 12, 0, 0)).getTime();
			
			// Even if the user is in a timezone where this would be 
			// 2025-09-01 19:00 (UTC+7) or 2025-09-01 08:00 (UTC-4),
			// the display should still show 2025-09-01
			const result = timestampToLocalDateString(timestamp);
			expect(result).toBe("2025-09-01");
		});
	});
});