// @ts-ignore
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
	findMetadataInsertPosition,
} from "../editor-extensions/date-time/date-manager";
import TaskProgressBarPlugin from "../index";
import { App } from "obsidian";

// Mock the plugin
const mockPlugin: Partial<TaskProgressBarPlugin> = {
	settings: {
		autoDateManager: {
			enabled: true,
			manageStartDate: true,
			manageCompletedDate: true,
			manageCancelledDate: true,
			startDateFormat: "YYYY-MM-DD",
			completedDateFormat: "YYYY-MM-DD",
			cancelledDateFormat: "YYYY-MM-DD",
			startDateMarker: "🚀",
			completedDateMarker: "✅",
			cancelledDateMarker: "❌",
		},
		preferMetadataFormat: "emoji",
		taskStatuses: {
			completed: "x|X",
			inProgress: "/|-",
			abandoned: "_",
			planned: "!",
			notStarted: " ",
		},
	},
} as unknown as TaskProgressBarPlugin;

describe("Improved Date Insertion Logic", () => {
	describe("Content with Special Characters", () => {
		it("should handle task with wiki links correctly", () => {
			const lineText = "- [ ] Check [[Project Notes]] for details";
			const position = findMetadataInsertPosition(
				lineText,
				mockPlugin as TaskProgressBarPlugin,
				"cancelled"
			);
			expect(lineText.substring(0, position)).toBe("- [ ] Check [[Project Notes]] for details");
		});

		it("should handle nested wiki links", () => {
			const lineText = "- [ ] Read [[Books/[[Nested]] Guide]]";
			const position = findMetadataInsertPosition(
				lineText,
				mockPlugin as TaskProgressBarPlugin,
				"cancelled"
			);
			expect(lineText.substring(0, position)).toBe("- [ ] Read [[Books/[[Nested]] Guide]]");
		});

		it("should handle hashtag in URL content", () => {
			const lineText = "- [ ] Visit https://example.com/#section";
			const position = findMetadataInsertPosition(
				lineText,
				mockPlugin as TaskProgressBarPlugin,
				"cancelled"
			);
			expect(lineText.substring(0, position)).toBe("- [ ] Visit https://example.com/#section");
		});

		it("should handle emoji in task content", () => {
			const lineText = "- [ ] Fix the 🚀 rocket launch code";
			const position = findMetadataInsertPosition(
				lineText,
				mockPlugin as TaskProgressBarPlugin,
				"cancelled"
			);
			expect(lineText.substring(0, position)).toBe("- [ ] Fix the 🚀 rocket launch code");
		});

		it("should handle multiple hashtags in URL", () => {
			const lineText = "- [ ] Check site.com/#anchor#section#part";
			const position = findMetadataInsertPosition(
				lineText,
				mockPlugin as TaskProgressBarPlugin,
				"cancelled"
			);
			expect(lineText.substring(0, position)).toBe("- [ ] Check site.com/#anchor#section#part");
		});
	});

	describe("Metadata Positioning", () => {
		it("should insert cancelled date before tags", () => {
			const lineText = "- [ ] Important task #urgent #priority";
			const position = findMetadataInsertPosition(
				lineText,
				mockPlugin as TaskProgressBarPlugin,
				"cancelled"
			);
			expect(lineText.substring(0, position)).toBe("- [ ] Important task");
			expect(lineText.substring(position)).toBe(" #urgent #priority");
		});

		it("should insert cancelled date before dataview fields", () => {
			const lineText = "- [ ] Task content [due:: 2025-10-01]";
			const position = findMetadataInsertPosition(
				lineText,
				mockPlugin as TaskProgressBarPlugin,
				"cancelled"
			);
			expect(lineText.substring(0, position)).toBe("- [ ] Task content");
			expect(lineText.substring(position)).toBe(" [due:: 2025-10-01]");
		});

		it("should insert cancelled date after start date", () => {
			const lineText = "- [ ] Task 🚀 2025-09-01";
			const position = findMetadataInsertPosition(
				lineText,
				mockPlugin as TaskProgressBarPlugin,
				"cancelled"
			);
			// For cancelled date, it should go after the start date
			expect(position).toBeGreaterThan(24); // After "🚀 2025-09-01"
		});

		it("should handle multiple metadata items correctly", () => {
			const lineText = "- [ ] Task content #tag1 [due:: 2025-10-01] #tag2";
			const position = findMetadataInsertPosition(
				lineText,
				mockPlugin as TaskProgressBarPlugin,
				"cancelled"
			);
			expect(lineText.substring(0, position)).toBe("- [ ] Task content");
		});
	});

	describe("Block References", () => {
		it("should insert date before block reference", () => {
			const lineText = "- [ ] Task with reference ^task-123";
			const position = findMetadataInsertPosition(
				lineText,
				mockPlugin as TaskProgressBarPlugin,
				"completed"
			);
			// For completed date, should be before block reference
			expect(lineText.substring(position)).toContain("^task-123");
		});

		it("should handle block reference with trailing spaces", () => {
			const lineText = "- [ ] Task with reference ^task-123  ";
			const position = findMetadataInsertPosition(
				lineText,
				mockPlugin as TaskProgressBarPlugin,
				"completed"
			);
			expect(lineText.substring(position)).toContain("^task-123");
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty task", () => {
			const lineText = "- [ ] ";
			const position = findMetadataInsertPosition(
				lineText,
				mockPlugin as TaskProgressBarPlugin,
				"cancelled"
			);
			expect(position).toBe(6); // Right after "- [ ] "
		});

		it("should handle task with only spaces", () => {
			const lineText = "- [ ]    ";
			const position = findMetadataInsertPosition(
				lineText,
				mockPlugin as TaskProgressBarPlugin,
				"cancelled"
			);
			expect(position).toBe(6); // After trimming trailing spaces
		});

		it("should handle task with brackets in content", () => {
			const lineText = "- [ ] Use array[0] or dict[key] in code";
			const position = findMetadataInsertPosition(
				lineText,
				mockPlugin as TaskProgressBarPlugin,
				"cancelled"
			);
			expect(lineText.substring(0, position)).toBe("- [ ] Use array[0] or dict[key] in code");
		});

		it("should not confuse markdown links with wiki links", () => {
			const lineText = "- [ ] Check [this link](https://example.com)";
			const position = findMetadataInsertPosition(
				lineText,
				mockPlugin as TaskProgressBarPlugin,
				"cancelled"
			);
			expect(lineText.substring(0, position)).toBe("- [ ] Check [this link](https://example.com)");
		});
	});

	describe("Original PR Issue", () => {
		it("should place cancelled date after task content, not before", () => {
			const lineText = "- [ ] test entry";
			const position = findMetadataInsertPosition(
				lineText,
				mockPlugin as TaskProgressBarPlugin,
				"cancelled"
			);
			// Position should be after "test entry", not after "- [ ] "
			expect(position).toBe(16); // After "test entry"

			// Simulate adding the cancelled date
			const result = lineText.slice(0, position) + " ❌2025-09-25" + lineText.slice(position);
			expect(result).toBe("- [ ] test entry ❌2025-09-25");
			expect(result).not.toBe("- [ ] ❌2025-09-25test entry"); // This was the bug
		});
	});
});