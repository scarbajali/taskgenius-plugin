import { App, Editor, EditorPosition, TFile } from "obsidian";
import { UniversalEditorSuggest, SuggestManager } from "../components/ui/suggest";
import TaskProgressBarPlugin from "../index";
import { getSuggestOptionsByTrigger } from "../components/ui/suggest/SpecialCharacterSuggests";

// Mock Obsidian modules
jest.mock("obsidian", () => ({
	App: jest.fn(),
	Editor: jest.fn(),
	EditorPosition: jest.fn(),
	TFile: jest.fn(),
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
			getLastOpenFiles: () => ["file1.md", "file2.md", "file3.md"],
		},
		metadataCache: {
			getTags: () => ({
				"#tag1": 5,
				"#tag2": 3,
				"#重要": 2,
			}),
		},
	} as any,
	settings: {
		preferMetadataFormat: "tasks",
	},
} as TaskProgressBarPlugin;

describe("UniversalEditorSuggest", () => {
	let suggest: UniversalEditorSuggest;
	let app: App;

	beforeEach(() => {
		app = new App();
		suggest = new UniversalEditorSuggest(app, mockPlugin, {
			triggerChars: ["!", "~", "*", "#"],
		});
	});

	test("should initialize with correct trigger characters", () => {
		const config = suggest.getConfig();
		expect(config.triggerChars).toEqual(["!", "~", "*", "#"]);
	});

	test("should enable and disable correctly", () => {
		suggest.enable();
		expect(suggest["isEnabled"]).toBe(true);

		suggest.disable();
		expect(suggest["isEnabled"]).toBe(false);
	});

	test("should add and remove suggest options", () => {
		const customOption = {
			id: "custom",
			label: "Custom",
			icon: "star",
			description: "Custom option",
			replacement: "%",
			trigger: "%",
		};

		suggest.addSuggestOption(customOption);
		const config = suggest.getConfig();
		expect(config.triggerChars).toContain("%");

		suggest.removeSuggestOption("custom");
		// Note: This test would need access to internal suggestOptions to verify removal
	});
});

describe("SuggestManager", () => {
	let manager: SuggestManager;
	let app: App;

	beforeEach(() => {
		app = new App();
		// Mock the workspace.editorSuggest.suggests array
		(app as any).workspace = {
			editorSuggest: {
				suggests: [],
			},
		};
		manager = new SuggestManager(app, mockPlugin);
	});

	test("should start and stop managing correctly", () => {
		expect(manager.isCurrentlyManaging()).toBe(false);

		manager.startManaging();
		expect(manager.isCurrentlyManaging()).toBe(true);

		manager.stopManaging();
		expect(manager.isCurrentlyManaging()).toBe(false);
	});

	test("should add suggests with priority", () => {
		const mockSuggest = {} as any;
		manager.startManaging();
		
		manager.addSuggestWithPriority(mockSuggest, "test");
		
		const activeSuggests = manager.getActiveSuggests();
		expect(activeSuggests.has("test")).toBe(true);
		expect(activeSuggests.get("test")).toBe(mockSuggest);
	});

	test("should remove managed suggests", () => {
		const mockSuggest = {} as any;
		manager.startManaging();
		
		manager.addSuggestWithPriority(mockSuggest, "test");
		expect(manager.getActiveSuggests().has("test")).toBe(true);
		
		manager.removeManagedSuggest("test");
		expect(manager.getActiveSuggests().has("test")).toBe(false);
	});

	test("should cleanup properly", () => {
		manager.startManaging();
		manager.addSuggestWithPriority({} as any, "test1");
		manager.addSuggestWithPriority({} as any, "test2");
		
		expect(manager.getActiveSuggests().size).toBe(2);
		
		manager.cleanup();
		expect(manager.isCurrentlyManaging()).toBe(false);
		expect(manager.getActiveSuggests().size).toBe(0);
	});
});

describe("SpecialCharacterSuggests", () => {
	test("should return priority suggestions for ! trigger", () => {
		const suggestions = getSuggestOptionsByTrigger("!", mockPlugin);
		expect(suggestions.length).toBeGreaterThan(0);
		expect(suggestions[0].trigger).toBe("!");
		expect(suggestions.some(s => s.id.includes("priority"))).toBe(true);
	});

	test("should return date suggestions for ~ trigger", () => {
		const suggestions = getSuggestOptionsByTrigger("~", mockPlugin);
		expect(suggestions.length).toBeGreaterThan(0);
		expect(suggestions[0].trigger).toBe("~");
		expect(suggestions.some(s => s.id.includes("date"))).toBe(true);
	});

	test("should return target suggestions for * trigger", () => {
		const suggestions = getSuggestOptionsByTrigger("*", mockPlugin);
		expect(suggestions.length).toBeGreaterThan(0);
		expect(suggestions[0].trigger).toBe("*");
		expect(suggestions.some(s => s.id.includes("target"))).toBe(true);
	});

	test("should return tag suggestions for # trigger", () => {
		const suggestions = getSuggestOptionsByTrigger("#", mockPlugin);
		expect(suggestions.length).toBeGreaterThan(0);
		expect(suggestions[0].trigger).toBe("#");
		expect(suggestions.some(s => s.id.includes("tag"))).toBe(true);
	});

	test("should return empty array for unknown trigger", () => {
		const suggestions = getSuggestOptionsByTrigger("?", mockPlugin);
		expect(suggestions).toEqual([]);
	});
});

describe("Integration Tests", () => {
	test("should create universal suggest for minimal modal context", () => {
		const app = new App();
		(app as any).workspace = {
			editorSuggest: {
				suggests: [],
			},
		};
		
		const manager = new SuggestManager(app, mockPlugin);
		manager.startManaging();
		
		const mockEditor = {} as Editor;
		const suggest = manager.enableForMinimalModal(mockEditor);
		
		expect(suggest).toBeInstanceOf(UniversalEditorSuggest);
		expect(manager.getActiveSuggests().has("universal-minimal-modal")).toBe(true);
		
		manager.cleanup();
	});

	test("should handle context filters correctly", () => {
		const app = new App();
		(app as any).workspace = {
			editorSuggest: {
				suggests: [],
			},
		};
		
		const manager = new SuggestManager(app, mockPlugin);
		
		// Add custom context filter
		const testFilter = (editor: Editor, file: TFile) => true;
		manager.addContextFilter("test", testFilter);
		
		const config = manager.getConfig();
		expect(config.contextFilters["test"]).toBe(testFilter);
		
		// Remove context filter
		manager.removeContextFilter("test");
		const updatedConfig = manager.getConfig();
		expect(updatedConfig.contextFilters["test"]).toBeUndefined();
	});
});
