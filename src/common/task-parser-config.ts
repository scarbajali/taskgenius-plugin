import {
	MetadataParseMode,
	TaskParserConfig,
	createDefaultParserConfig,
} from "../types/TaskParserConfig";
import { MetadataFormat } from "../utils/task/task-operations";
import type TaskProgressBarPlugin from "../index";

export const getConfig = (
	format: MetadataFormat,
	plugin?: TaskProgressBarPlugin | { settings: any }
): TaskParserConfig => {
	// Get configurable prefixes from plugin settings, with fallback defaults
	const projectPrefix =
		plugin?.settings?.projectTagPrefix?.[format] || "project";
	const contextPrefix =
		plugin?.settings?.contextTagPrefix?.[format] ||
		(format === "dataview" ? "context" : "@");
	const areaPrefix = plugin?.settings?.areaTagPrefix?.[format] || "area";

	const config: TaskParserConfig = {
		// Basic parsing controls
		parseTags: true,
		parseMetadata: true,
		parseHeadings: true, // taskUtil functions are for single-line parsing
		parseComments: false, // Not needed for single-line parsing

		// Metadata format preference
		metadataParseMode:
			format === "dataview"
				? MetadataParseMode.DataviewOnly
				: MetadataParseMode.Both,

		// Status mapping (standard task states)
		statusMapping: {
			todo: " ",
			done: "x",
			cancelled: "-",
			forwarded: ">",
			scheduled: "<",
			important: "!",
			question: "?",
			incomplete: "/",
			paused: "p",
			pro: "P",
			con: "C",
			quote: "Q",
			note: "N",
			bookmark: "b",
			information: "i",
			savings: "S",
			idea: "I",
			location: "l",
			phone: "k",
			win: "w",
			key: "K",
		},

		// Emoji to metadata mapping
		emojiMapping: {
			"📅": "dueDate",
			"🛫": "startDate",
			"⏳": "scheduledDate",
			"✅": "completedDate",
			"❌": "cancelledDate",
			"➕": "createdDate",
			"🔁": "recurrence",
			"🏁": "onCompletion",
			"⛔": "dependsOn",
			"🆔": "id",
			"🔺": "priority",
			"⏫": "priority",
			"🔼": "priority",
			"🔽": "priority",
			"⏬": "priority",
		},

		// Special tag prefixes for project/context/area (now configurable)
		// Only include the configured prefixes, avoid default fallbacks to prevent conflicts
		specialTagPrefixes: (() => {
			const prefixes: Record<string, string> = {};
			
			// Only add configured prefixes, with case-insensitive support
			if (projectPrefix) {
				prefixes[projectPrefix] = "project";
				prefixes[String(projectPrefix).toLowerCase()] = "project";
			}
			if (areaPrefix) {
				prefixes[areaPrefix] = "area";
				prefixes[String(areaPrefix).toLowerCase()] = "area";
			}
			if (contextPrefix) {
				prefixes[contextPrefix] = "context";
				prefixes[String(contextPrefix).toLowerCase()] = "context";
			}
			
			return prefixes;
		})(),

		// Performance and parsing limits
		maxParseIterations: 4000,
		maxMetadataIterations: 400,
		maxTagLength: 100,
		maxEmojiValueLength: 200,
		maxStackOperations: 4000,
		maxStackSize: 1000,
		maxIndentSize: 8,

		// Enhanced project configuration
		projectConfig: plugin?.settings?.projectConfig?.enableEnhancedProject
			? plugin?.settings?.projectConfig
			: undefined,

		// File Metadata Inheritance
		fileMetadataInheritance: plugin?.settings?.fileMetadataInheritance,

		// Custom date formats for parsing
		customDateFormats: plugin?.settings?.enableCustomDateFormats
			? plugin?.settings?.customDateFormats
			: undefined,
	};

	return config;
};
