// @ts-ignore
import { describe, it, expect } from "@jest/globals";
import {
	findMetadataInsertPosition,
} from "../editor-extensions/date-time/date-manager";
import TaskProgressBarPlugin from "../index";

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
			startDateMarker: "🛫",
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

describe("autoDateManager - Debug Specific Issue", () => {
	it("should insert cancelled date BEFORE block reference, not after", () => {
		// This is the exact line from the user's example
		const lineText = "- [-] 交流交底 🚀 2025-07-30 [stage::disclosure_communication] 🛫 2025-04-20 ^timer-161940-4775";
		
		console.log("Original line:", lineText);
		console.log("Line length:", lineText.length);
		console.log("Index of 🛫:", lineText.indexOf("🛫"));
		console.log("Index of ^timer:", lineText.indexOf("^timer"));
		
		const position = findMetadataInsertPosition(
			lineText,
			mockPlugin as TaskProgressBarPlugin,
			"cancelled"
		);
		
		console.log("Insert position:", position);
		console.log("Text before position:", lineText.substring(0, position));
		console.log("Text after position:", lineText.substring(position));
		
		// The cancelled date should be inserted BEFORE the block reference
		expect(lineText.substring(position)).toBe(" ^timer-161940-4775");
		
		// Simulate inserting the cancelled date
		const cancelledDate = " ❌ 2025-07-31";
		const newLine = lineText.substring(0, position) + cancelledDate + lineText.substring(position);
		
		console.log("New line after insertion:", newLine);
		
		// Verify the block reference is still at the end
		expect(newLine.endsWith("^timer-161940-4775")).toBe(true);
		
		// Verify the cancelled date is before the block reference
		expect(newLine).toBe("- [-] 交流交底 🚀 2025-07-30 [stage::disclosure_communication] 🛫 2025-04-20 ❌ 2025-07-31 ^timer-161940-4775");
	});
	
	it("should find correct position with 🛫 emoji", () => {
		const lineText = "- [-] Task with 🛫 2025-04-20 ^block-id";
		
		const position = findMetadataInsertPosition(
			lineText,
			mockPlugin as TaskProgressBarPlugin,
			"cancelled"
		);
		
		console.log("Position for cancelled date:", position);
		console.log("Text after position:", lineText.substring(position));
		
		// Should insert after the 🛫 date but before block reference
		expect(lineText.substring(0, position)).toContain("🛫 2025-04-20");
		expect(lineText.substring(position)).toBe(" ^block-id");
	});
	
	it("should handle MISMATCHED start date emoji (🚀 in settings but 🛫 in text)", () => {
		// Create a plugin with 🚀 as start marker
		const mismatchedPlugin: Partial<TaskProgressBarPlugin> = {
			settings: {
				...mockPlugin.settings!,
				autoDateManager: {
					...mockPlugin.settings!.autoDateManager!,
					startDateMarker: "🚀", // Different from what's in the text!
				},
			},
		} as unknown as TaskProgressBarPlugin;
		
		// But the text has 🛫 
		const lineText = "- [-] 交流交底 🚀 2025-07-30 [stage::disclosure_communication] 🛫 2025-04-20 ^timer-161940-4775";
		
		const position = findMetadataInsertPosition(
			lineText,
			mismatchedPlugin as TaskProgressBarPlugin,
			"cancelled"
		);
		
		console.log("Position with mismatched emoji:", position);
		console.log("Text after position:", lineText.substring(position));
		
		// Even with mismatched emoji, it should still find the date pattern
		// because 🛫 is followed by a date pattern
		expect(lineText.substring(position)).not.toContain("❌ 2025-07-31");
	});
});