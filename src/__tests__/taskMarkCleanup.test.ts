import { clearAllMarks } from "../components/ui/renderers/MarkdownRenderer";

describe("Task Mark Cleanup", () => {
	describe("clearAllMarks function", () => {
		test("should remove priority marks", () => {
			const input = "Complete this task ! ⏫";
			const expected = "Complete this task";
			expect(clearAllMarks(input)).toBe(expected);
		});

		test("should remove emoji priority marks", () => {
			const input = "Important task 🔺";
			const expected = "Important task";
			expect(clearAllMarks(input)).toBe(expected);
		});

		test("should remove letter priority marks", () => {
			const input = "High priority task [#A]";
			const expected = "High priority task";
			expect(clearAllMarks(input)).toBe(expected);
		});

		test("should remove date marks", () => {
			const input = "Task with date 📅 2024-01-15";
			const expected = "Task with date";
			expect(clearAllMarks(input)).toBe(expected);
		});

		test("should remove multiple marks", () => {
			const input = "Complex task ! 📅 2024-01-15 ⏫ #tag";
			const expected = "Complex task";
			expect(clearAllMarks(input)).toBe(expected);
		});

		test("should preserve meaningful content", () => {
			const input = "Write documentation for the API";
			const expected = "Write documentation for the API";
			expect(clearAllMarks(input)).toBe(expected);
		});

		test("should handle empty content", () => {
			const input = "";
			const expected = "";
			expect(clearAllMarks(input)).toBe(expected);
		});

		test("should handle content with only marks", () => {
			const input = "! ⏫ 📅 2024-01-15";
			const expected = "";
			expect(clearAllMarks(input)).toBe(expected);
		});

		test("should preserve links and code", () => {
			const input = "Check [[Important Note]] and `code snippet` ! ⏫";
			const expected = "Check [[Important Note]] and `code snippet`";
			expect(clearAllMarks(input)).toBe(expected);
		});

		test("should handle mixed content", () => {
			const input =
				"Review [documentation](https://example.com) ! 📅 2024-01-15";
			const expected = "Review [documentation](https://example.com)";
			expect(clearAllMarks(input)).toBe(expected);
		});

		test("should remove tilde date prefix marks", () => {
			const input = "Complete task ~ 2024-01-15";
			const expected = "Complete task 2024-01-15";
			expect(clearAllMarks(input)).toBe(expected);
		});

		test("should remove target location marks", () => {
			const input = "Meeting target: office 📁";
			const expected = "Meeting office";
			expect(clearAllMarks(input)).toBe(expected);
		});

		test("should handle complex example from user", () => {
			const input = "今天要过去吃饭 #123-123-123 ~ 📅 2025-07-18";
			const expected = "今天要过去吃饭 2025-07-18"; // #123-123-123 is a normal tag and should be removed
			expect(clearAllMarks(input)).toBe(expected);
		});
	});

	describe("Task line scenarios", () => {
		test("should handle task with priority mark in middle", () => {
			const input = "Complete this ! important task";
			const expected = "Complete this important task";
			expect(clearAllMarks(input)).toBe(expected);
		});

		test("should handle task with multiple priority marks", () => {
			const input = "Very ! important ⏫ task";
			const expected = "Very important task";
			expect(clearAllMarks(input)).toBe(expected);
		});

		test("should handle task with trailing marks", () => {
			const input = "Simple task !";
			const expected = "Simple task";
			expect(clearAllMarks(input)).toBe(expected);
		});

		test("should handle task with leading marks", () => {
			const input = "! Important task";
			const expected = "Important task";
			expect(clearAllMarks(input)).toBe(expected);
		});
	});
});
