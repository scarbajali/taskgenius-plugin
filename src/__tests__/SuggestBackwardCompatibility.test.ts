import { App, Editor, EditorPosition, EditorSuggestContext } from "obsidian";
import { MinimalQuickCaptureSuggest } from "../components/features/quick-capture/suggest/MinimalQuickCaptureSuggest";
import TaskProgressBarPlugin from "../index";

// Mock Obsidian modules
jest.mock("obsidian", () => ({
	App: jest.fn(),
	Editor: jest.fn(),
	EditorPosition: jest.fn(),
	EditorSuggest: class {
		constructor() {}
		getSuggestions() { return []; }
		renderSuggestion() {}
		selectSuggestion() {}
		onTrigger() { return null; }
		close() {}
	},
	setIcon: jest.fn(),
}));

// Mock moment module
jest.mock("moment", () => {
	const moment = function(input?: any) {
		return {
			format: () => "2024-01-01",
			diff: () => 0,
			startOf: () => moment(input),
			endOf: () => moment(input),
			isSame: () => true,
			isSameOrBefore: () => true,
			isSameOrAfter: () => true,
			isBefore: () => false,
			isAfter: () => false,
			isBetween: () => true,
			clone: () => moment(input),
			add: () => moment(input),
			subtract: () => moment(input),
			valueOf: () => Date.now(),
			toDate: () => new Date(),
			weekday: () => 0,
			day: () => 1,
			date: () => 1,
		};
	};
	moment.locale = jest.fn(() => "en");
	moment.utc = () => ({ format: () => "00:00:00" });
	moment.duration = () => ({ asMilliseconds: () => 0 });
	moment.weekdaysShort = () => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	moment.weekdaysMin = () => ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
	return moment;
});

// Mock plugin
const mockPlugin = {
	app: {
		workspace: {
			getLastOpenFiles: () => ["test1.md", "test2.md"],
		},
		metadataCache: {
			getTags: () => ({
				"#work": 5,
				"#personal": 3,
			}),
		},
	},
	settings: {
		quickCapture: {
			minimalModeSettings: {
				suggestTrigger: "/",
			},
		},
		preferMetadataFormat: "tasks",
	},
} as any as TaskProgressBarPlugin;

describe("Backward Compatibility Tests", () => {
	let suggest: MinimalQuickCaptureSuggest;
	let app: App;

	beforeEach(() => {
		app = new App();
		suggest = new MinimalQuickCaptureSuggest(app, mockPlugin);
	});

	test("should maintain original MinimalQuickCaptureSuggest interface", () => {
		// Test that all original methods exist
		expect(typeof suggest.setMinimalMode).toBe("function");
		expect(typeof suggest.onTrigger).toBe("function");
		expect(typeof suggest.getSuggestions).toBe("function");
		expect(typeof suggest.renderSuggestion).toBe("function");
		expect(typeof suggest.selectSuggestion).toBe("function");
	});

	test("should handle legacy @ trigger mapping to * for target", () => {
		suggest.setMinimalMode(true);
		
		const mockContext: EditorSuggestContext = {
			query: "@",
			start: { line: 0, ch: 0 },
			end: { line: 0, ch: 1 },
			editor: {} as Editor,
			file: {} as any,
		};
		
		const suggestions = suggest.getSuggestions(mockContext);
		
		// Should return target suggestions when @ is used
		expect(suggestions.length).toBeGreaterThan(0);
		expect(suggestions.some(s => s.id.includes("target") || s.replacement === "*")).toBe(true);
	});

	test("should provide fallback suggestions when new system returns empty", () => {
		suggest.setMinimalMode(true);
		
		// Test with an unknown trigger that would return empty from new system
		const mockContext: EditorSuggestContext = {
			query: "unknown",
			start: { line: 0, ch: 0 },
			end: { line: 0, ch: 1 },
			editor: {} as Editor,
			file: {} as any,
		};
		
		const suggestions = suggest.getSuggestions(mockContext);
		
		// Should return fallback suggestions
		expect(suggestions.length).toBe(4); // date, priority, target, tag
		expect(suggestions.map(s => s.id)).toEqual(["date", "priority", "target", "tag"]);
	});

	test("should handle selectSuggestion with both new and legacy actions", () => {
		const mockEditor = {
			replaceRange: jest.fn(),
			setCursor: jest.fn(),
		} as any as Editor;
		
		const mockCursor = { line: 0, ch: 1 };
		
		// Mock the context
		(suggest as any).context = {
			editor: mockEditor,
			end: mockCursor,
		};
		
		// Test with new system suggestion (has action)
		const newSuggestion = {
			id: "priority-high",
			label: "High Priority",
			icon: "arrow-up",
			description: "High priority task",
			replacement: "! ⏫",
			trigger: "!",
			action: jest.fn(),
		};
		
		suggest.selectSuggestion(newSuggestion, {} as MouseEvent);
		
		expect(mockEditor.replaceRange).toHaveBeenCalledWith("! ⏫", { line: 0, ch: 0 }, { line: 0, ch: 1 });
		expect(mockEditor.setCursor).toHaveBeenCalledWith({ line: 0, ch: 4 });
		expect(newSuggestion.action).toHaveBeenCalledWith(mockEditor, { line: 0, ch: 4 });
	});

	test("should handle legacy modal-based actions", () => {
		const mockEditor = {
			replaceRange: jest.fn(),
			setCursor: jest.fn(),
		} as any as Editor;
		
		const mockCursor = { line: 0, ch: 1 };
		
		// Mock the context
		(suggest as any).context = {
			editor: mockEditor,
			end: mockCursor,
		};
		
		// Mock the modal element and modal instance
		const mockModal = {
			showDatePickerAtCursor: jest.fn(),
			showPriorityMenuAtCursor: jest.fn(),
			showLocationMenuAtCursor: jest.fn(),
			showTagSelectorAtCursor: jest.fn(),
		};
		
		const mockModalEl = {
			closest: jest.fn().mockReturnValue({
				__minimalQuickCaptureModal: mockModal,
			}),
		};
		
		const mockEditorEl = {
			cm: {
				dom: mockModalEl,
			},
			coordsAtPos: jest.fn().mockReturnValue({ left: 100, top: 200 }),
		};
		
		(mockEditor as any).cm = { dom: mockModalEl };
		(mockEditor as any).coordsAtPos = mockEditorEl.coordsAtPos;
		
		// Test legacy date suggestion
		const dateSuggestion = {
			id: "date",
			label: "Date",
			icon: "calendar",
			description: "Add date",
			replacement: "~",
		};
		
		suggest.selectSuggestion(dateSuggestion, {} as MouseEvent);
		
		expect(mockEditor.replaceRange).toHaveBeenCalledWith("~", { line: 0, ch: 0 }, { line: 0, ch: 1 });
		expect(mockModal.showDatePickerAtCursor).toHaveBeenCalled();
	});

	test("should maintain original trigger character behavior", () => {
		const mockEditor = {
			getLine: jest.fn().mockReturnValue("test /"),
		} as any as Editor;
		
		const mockFile = {} as any;
		const mockCursor = { line: 0, ch: 6 };
		
		// Mock minimal mode context
		(mockEditor as any).cm = {
			dom: {
				closest: jest.fn().mockReturnValue({}),
			},
		};
		
		suggest.setMinimalMode(true);
		
		const triggerInfo = suggest.onTrigger(mockCursor, mockEditor, mockFile);
		
		expect(triggerInfo).toEqual({
			start: { line: 0, ch: 5 },
			end: { line: 0, ch: 6 },
			query: "/",
		});
	});

	test("should handle disabled state correctly", () => {
		const mockEditor = {} as Editor;
		const mockFile = {} as any;
		const mockCursor = { line: 0, ch: 1 };
		
		// When not in minimal mode, should return null
		suggest.setMinimalMode(false);
		const triggerInfo = suggest.onTrigger(mockCursor, mockEditor, mockFile);
		
		expect(triggerInfo).toBeNull();
	});

	test("should render suggestions with correct DOM structure", () => {
		const mockEl = {
			addClass: jest.fn(),
			createDiv: jest.fn().mockReturnValue({
				createDiv: jest.fn(),
			}),
		} as any as HTMLElement;
		
		const suggestion = {
			id: "test",
			label: "Test Label",
			icon: "star",
			description: "Test Description",
			replacement: "test",
		};
		
		suggest.renderSuggestion(suggestion, mockEl);
		
		expect(mockEl.addClass).toHaveBeenCalledWith("menu-item");
		expect(mockEl.addClass).toHaveBeenCalledWith("tappable");
		expect(mockEl.createDiv).toHaveBeenCalledWith("menu-item-icon");
	});

	test("should integrate with new suggest system while maintaining compatibility", () => {
		suggest.setMinimalMode(true);
		
		// Test all original trigger characters
		const triggerChars = ["!", "~", "#"];
		
		for (const trigger of triggerChars) {
			const mockContext: EditorSuggestContext = {
				query: trigger,
				start: { line: 0, ch: 0 },
				end: { line: 0, ch: 1 },
				editor: {} as Editor,
				file: {} as any,
			};
			
			const suggestions = suggest.getSuggestions(mockContext);
			expect(suggestions.length).toBeGreaterThan(0);
			
			// Should have suggestions that match the trigger
			const hasMatchingSuggestion = suggestions.some(s => 
				s.replacement.includes(trigger) || s.trigger === trigger
			);
			expect(hasMatchingSuggestion).toBe(true);
		}
	});
});
