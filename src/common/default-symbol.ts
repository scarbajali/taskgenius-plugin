/**
 * Regular expressions for parsing task components
 */
export const TASK_REGEX = /^([\s>]*- \[(.)\])\s*(.*)$/m;
export const TAG_REGEX =
	/#[^\u2000-\u206F\u2E00-\u2E7F'!"#$%&()*+,.:;<=>?@^`{|}~\[\]\\\s]+/g;
export const CONTEXT_REGEX = /@[\w-]+/g;

/**
 * Task symbols and formatting
 */
export const DEFAULT_SYMBOLS = {
	prioritySymbols: {
		Highest: "🔺",
		High: "⏫",
		Medium: "🔼",
		Low: "🔽",
		Lowest: "⏬",
		None: "",
	},
	startDateSymbol: "🛫",
	createdDateSymbol: "➕",
	scheduledDateSymbol: "⏳",
	dueDateSymbol: "📅",
	doneDateSymbol: "✅",
	cancelledDateSymbol: "❌",
	recurrenceSymbol: "🔁",
	onCompletionSymbol: "🏁",
	dependsOnSymbol: "⛔",
	idSymbol: "🆔",
};

// --- Priority Mapping --- (Combine from TaskParser)
export const PRIORITY_MAP: Record<string, number> = {
	"🔺": 5,
	"⏫": 4,
	"🔼": 3,
	"🔽": 2,
	"⏬️": 1,
	"⏬": 1,
	"[#A]": 5,
	"[#B]": 4,
	"[#C]": 3, // Keep Taskpaper style? Maybe remove later
	"[#D]": 2,
	"[#E]": 1,
	highest: 5,
	high: 4,
	medium: 3,
	low: 2,
	lowest: 1,
};
