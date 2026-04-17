import { App } from "obsidian";
import {
	BaseWidgetRenderer,
	type WidgetRendererOptions,
} from "./BaseWidgetRenderer";
import { Habit } from "@/components/features/habit/habit";

export interface HabitFilterConfig {
	/** Filter by habit names */
	names?: string[];
	/** Filter by habit types */
	types?: ("daily" | "count" | "scheduled" | "mapping")[];
}

export interface HabitWidgetState {
	/** Filter configuration */
	filter?: HabitFilterConfig;
	/** Whether to show the create button */
	showCreateButton?: boolean;
	[key: string]: unknown;
}

const DEFAULT_STATE: HabitWidgetState = {
	showCreateButton: false,
};

/**
 * HabitWidgetRenderer - Renders habit tracking cards
 * Can be used in both sidebar and embedded codeblock
 */
export class HabitWidgetRenderer extends BaseWidgetRenderer<HabitWidgetState> {
	private app: App;
	private habitComponent?: Habit;

	constructor(app: App, options: WidgetRendererOptions<HabitWidgetState>) {
		super({
			...options,
			initialState: { ...DEFAULT_STATE, ...options.initialState },
		});
		this.app = app;
	}

	protected render(): void {
		const bodyEl = this.getBodyEl();
		bodyEl.empty();

		// Clean up previous habit component
		if (this.habitComponent) {
			this.removeChild(this.habitComponent);
			this.habitComponent = undefined;
		}

		// Apply embedded-specific styling
		if (this.isEmbedded()) {
			bodyEl.addClass("tg-habit-embedded");
		}

		// Instantiate the existing Habit component
		this.habitComponent = new Habit(this.plugin, bodyEl);

		// Register as child for lifecycle management
		this.addChild(this.habitComponent);
	}

	override onunload(): void {
		if (this.habitComponent) {
			this.removeChild(this.habitComponent);
			this.habitComponent = undefined;
		}
		super.onunload();
	}
}
