import {
	MarkdownPostProcessorContext,
	MarkdownRenderChild,
	parseYaml,
	App,
} from "obsidian";
import TaskProgressBarPlugin from "@/index";
import {
	TasksWidgetRenderer,
	type TasksWidgetState,
	type TasksGroupByMode,
	type TasksFilterConfig,
} from "../renderers/TasksWidgetRenderer";
import {
	KanbanWidgetRenderer,
	type KanbanWidgetState,
	type KanbanColumnConfig,
} from "../renderers/KanbanWidgetRenderer";
import {
	HabitWidgetRenderer,
	type HabitWidgetState,
	type HabitFilterConfig,
} from "../renderers/HabitWidgetRenderer";
import type { WidgetRendererConfig } from "../renderers/BaseWidgetRenderer";

/**
 * Supported widget types for codeblock
 */
type WidgetType =
	| "tasks"
	| "kanban"
	| "habit"
	| "projects"
	| "calendar"
	| "forecast";

/**
 * Base codeblock configuration
 */
interface BaseCodeBlockConfig {
	type: WidgetType;
	title?: string;
	height?: number;
	maxHeight?: number;
}

/**
 * Tasks widget codeblock configuration
 */
interface TasksCodeBlockConfig extends BaseCodeBlockConfig {
	type: "tasks";
	groupBy?: TasksGroupByMode;
	filter?: TasksFilterConfig;
	showToolbar?: boolean;
}

/**
 * Kanban widget codeblock configuration
 */
interface KanbanCodeBlockConfig extends BaseCodeBlockConfig {
	type: "kanban";
	columns?: KanbanColumnConfig[];
	filter?: {
		tags?: string[];
		projects?: string[];
		query?: string;
	};
	enableDragDrop?: boolean;
}

/**
 * Habit widget codeblock configuration
 */
interface HabitCodeBlockConfig extends BaseCodeBlockConfig {
	type: "habit";
	filter?: HabitFilterConfig;
	showCreateButton?: boolean;
}

/**
 * Union of all codeblock configurations
 */
type CodeBlockConfig =
	| TasksCodeBlockConfig
	| KanbanCodeBlockConfig
	| HabitCodeBlockConfig
	| BaseCodeBlockConfig;

/**
 * Wrapper to manage renderer lifecycle within markdown context
 */
class RendererWrapper extends MarkdownRenderChild {
	private renderer:
		| TasksWidgetRenderer
		| KanbanWidgetRenderer
		| HabitWidgetRenderer
		| null = null;

	constructor(
		containerEl: HTMLElement,
		private createRenderer: () =>
			| TasksWidgetRenderer
			| KanbanWidgetRenderer
			| HabitWidgetRenderer,
	) {
		super(containerEl);
	}

	override onload(): void {
		this.renderer = this.createRenderer();
		this.renderer.load();
	}

	override onunload(): void {
		this.renderer?.unload();
		this.renderer = null;
	}
}

/**
 * WidgetCodeBlockProcessor
 *
 * Processes `task-genius` codeblocks and renders widgets inline in notes.
 *
 * Usage:
 * ```task-genius
 * type: tasks
 * groupBy: project
 * filter:
 *   tags: ["#work"]
 * ```
 */
export class WidgetCodeBlockProcessor {
	constructor(
		private app: App,
		private plugin: TaskProgressBarPlugin,
	) {}

	/**
	 * Process a codeblock and render the appropriate widget
	 */
	async process(
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext,
	): Promise<void> {
		try {
			const config = this.parseConfig(source);

			if (!config.type) {
				this.renderError(el, "Missing required 'type' field");
				return;
			}

			// Create container with embedded widget styling
			const container = el.createDiv({
				cls: "tg-embedded-widget",
			});

			// Common renderer config
			const rendererConfig: WidgetRendererConfig = {
				showHeader: Boolean(config.title),
				title: config.title,
				isEmbedded: true,
				height: config.height,
				maxHeight: config.maxHeight ?? 400,
			};

			switch (config.type) {
				case "tasks":
					this.renderTasksWidget(
						container,
						config as TasksCodeBlockConfig,
						rendererConfig,
						ctx,
					);
					break;

				case "kanban":
					this.renderKanbanWidget(
						container,
						config as KanbanCodeBlockConfig,
						rendererConfig,
						ctx,
					);
					break;

				case "habit":
					this.renderHabitWidget(
						container,
						config as HabitCodeBlockConfig,
						rendererConfig,
						ctx,
					);
					break;

				case "projects":
				case "calendar":
				case "forecast":
					this.renderPlaceholder(container, config.type);
					break;

				default:
					this.renderError(
						el,
						`Unknown widget type: ${(config as any).type}`,
					);
			}
		} catch (error) {
			this.renderError(
				el,
				`Failed to parse configuration: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Parse YAML configuration from codeblock source
	 */
	private parseConfig(source: string): CodeBlockConfig {
		if (!source.trim()) {
			return { type: "tasks" }; // Default to tasks widget
		}

		const parsed = parseYaml(source);
		if (!parsed || typeof parsed !== "object") {
			throw new Error("Invalid YAML configuration");
		}

		return parsed as CodeBlockConfig;
	}

	/**
	 * Render Tasks widget
	 */
	private renderTasksWidget(
		container: HTMLElement,
		config: TasksCodeBlockConfig,
		rendererConfig: WidgetRendererConfig,
		ctx: MarkdownPostProcessorContext,
	): void {
		const state: TasksWidgetState = {
			groupBy: config.groupBy ?? "tag",
			collapsedGroups: [],
			filter: config.filter,
			showToolbar: config.showToolbar ?? false,
		};

		const wrapper = new RendererWrapper(
			container,
			() =>
				new TasksWidgetRenderer(this.app, {
					containerEl: container,
					plugin: this.plugin,
					initialState: state,
					config: rendererConfig,
				}),
		);

		// Register for cleanup when the section is unloaded
		ctx.addChild(wrapper);
	}

	/**
	 * Render Kanban widget
	 */
	private renderKanbanWidget(
		container: HTMLElement,
		config: KanbanCodeBlockConfig,
		rendererConfig: WidgetRendererConfig,
		ctx: MarkdownPostProcessorContext,
	): void {
		const state: KanbanWidgetState = {
			columns: config.columns,
			filter: config.filter,
			// Disable drag-drop in embedded mode by default (can be overridden)
			enableDragDrop: config.enableDragDrop ?? false,
		};

		const wrapper = new RendererWrapper(
			container,
			() =>
				new KanbanWidgetRenderer(this.app, {
					containerEl: container,
					plugin: this.plugin,
					initialState: state,
					config: rendererConfig,
				}),
		);

		ctx.addChild(wrapper);
	}

	/**
	 * Render Habit widget
	 */
	private renderHabitWidget(
		container: HTMLElement,
		config: HabitCodeBlockConfig,
		rendererConfig: WidgetRendererConfig,
		ctx: MarkdownPostProcessorContext,
	): void {
		const state: HabitWidgetState = {
			filter: config.filter,
			showCreateButton: config.showCreateButton ?? false,
		};

		const wrapper = new RendererWrapper(
			container,
			() =>
				new HabitWidgetRenderer(this.app, {
					containerEl: container,
					plugin: this.plugin,
					initialState: state,
					config: rendererConfig,
				}),
		);

		ctx.addChild(wrapper);
	}

	/**
	 * Render placeholder for not-yet-implemented widget types
	 */
	private renderPlaceholder(container: HTMLElement, type: string): void {
		container.addClass("tg-embedded-widget-placeholder");
		container.createDiv({
			cls: "tg-embedded-widget-placeholder-text",
			text: `${type.charAt(0).toUpperCase() + type.slice(1)} widget coming soon`,
		});
	}

	/**
	 * Render error message
	 */
	private renderError(el: HTMLElement, message: string): void {
		const errorEl = el.createDiv({
			cls: "tg-embedded-widget-error",
		});
		errorEl.createSpan({
			cls: "tg-embedded-widget-error-icon",
			text: "⚠️",
		});
		errorEl.createSpan({
			cls: "tg-embedded-widget-error-message",
			text: message,
		});
	}
}

/**
 * Register the codeblock processor with the plugin
 */
export function registerWidgetCodeBlock(plugin: TaskProgressBarPlugin): void {
	const processor = new WidgetCodeBlockProcessor(plugin.app, plugin);

	plugin.registerMarkdownCodeBlockProcessor(
		"task-genius",
		(source, el, ctx) => {
			return processor.process(source, el, ctx);
		},
	);

	// Also register short alias
	plugin.registerMarkdownCodeBlockProcessor("tg", (source, el, ctx) => {
		return processor.process(source, el, ctx);
	});
}
