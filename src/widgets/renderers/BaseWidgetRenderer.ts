import { Component } from "obsidian";
import TaskProgressBarPlugin from "@/index";

export type WidgetLayoutMode = "compact" | "narrow" | "medium" | "wide";

export interface WidgetRendererConfig {
	/** Show title header */
	showHeader?: boolean;
	/** Title text */
	title?: string;
	/** Is embedded in codeblock (affects interactions) */
	isEmbedded?: boolean;
	/** Fixed height in pixels (0 = auto) */
	height?: number;
	/** Max height in pixels (0 = unlimited) */
	maxHeight?: number;
}

export interface WidgetRendererOptions<TState> {
	containerEl: HTMLElement;
	plugin: TaskProgressBarPlugin;
	initialState: TState;
	config?: WidgetRendererConfig;
}

/**
 * Base class for widget renderers.
 * Unlike BaseWidgetView (which extends ItemView for sidebar),
 * this class can render into any container element.
 */
export abstract class BaseWidgetRenderer<
	TState extends Record<string, unknown>,
> extends Component {
	protected containerEl: HTMLElement;
	protected plugin: TaskProgressBarPlugin;
	protected state: TState;
	protected config: WidgetRendererConfig;

	protected rootEl!: HTMLElement;
	protected headerEl?: HTMLElement;
	protected bodyEl!: HTMLElement;

	protected layoutMode: WidgetLayoutMode = "wide";
	private resizeObserver?: ResizeObserver;

	constructor(options: WidgetRendererOptions<TState>) {
		super();
		this.containerEl = options.containerEl;
		this.plugin = options.plugin;
		this.state = options.initialState;
		this.config = {
			showHeader: false,
			isEmbedded: false,
			height: 0,
			maxHeight: 400,
			...options.config,
		};
	}

	override onload(): void {
		this.buildDOM();
		this.setupResizeObserver();
		this.applyLayoutMode(this.rootEl.clientWidth);
		void this.render();
	}

	override onunload(): void {
		this.resizeObserver?.disconnect();
		this.resizeObserver = undefined;
		this.rootEl?.remove();
	}

	/**
	 * Get current state
	 */
	getState(): TState {
		return this.state;
	}

	/**
	 * Update state and re-render
	 */
	setState(patch: Partial<TState>): void {
		this.state = { ...this.state, ...patch };
		void this.render();
	}

	/**
	 * Get current layout mode
	 */
	getLayoutMode(): WidgetLayoutMode {
		return this.layoutMode;
	}

	/**
	 * Get the body element for rendering content
	 */
	protected getBodyEl(): HTMLElement {
		return this.bodyEl;
	}

	/**
	 * Check if running in embedded (codeblock) mode
	 */
	protected isEmbedded(): boolean {
		return this.config.isEmbedded ?? false;
	}

	/**
	 * Abstract render method - implement in subclasses
	 */
	protected abstract render(): Promise<void> | void;

	/**
	 * Build the basic DOM structure
	 */
	private buildDOM(): void {
		this.rootEl = this.containerEl.createDiv({
			cls: "tg-widget-renderer",
		});

		// Apply height constraints
		if (this.config.height && this.config.height > 0) {
			this.rootEl.style.height = `${this.config.height}px`;
		}
		if (this.config.maxHeight && this.config.maxHeight > 0) {
			this.rootEl.style.maxHeight = `${this.config.maxHeight}px`;
		}

		// Optional header
		if (this.config.showHeader && this.config.title) {
			this.headerEl = this.rootEl.createDiv({
				cls: "tg-widget-renderer-header",
			});
			this.headerEl.createSpan({
				cls: "tg-widget-renderer-title",
				text: this.config.title,
			});
		}

		// Body container
		this.bodyEl = this.rootEl.createDiv({
			cls: "tg-widget-renderer-body",
		});
	}

	/**
	 * Setup resize observer for responsive layout
	 */
	private setupResizeObserver(): void {
		this.resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (entry) {
				const width = entry.contentRect.width;
				this.applyLayoutMode(width);
			}
		});
		this.resizeObserver.observe(this.rootEl);
	}

	/**
	 * Apply layout mode based on container width
	 */
	private applyLayoutMode(width: number): void {
		const nextMode: WidgetLayoutMode =
			width < 300
				? "compact"
				: width < 400
					? "narrow"
					: width < 600
						? "medium"
						: "wide";

		if (this.layoutMode === nextMode) {
			return;
		}

		this.layoutMode = nextMode;
		this.rootEl.removeClass(
			"tg-renderer-compact",
			"tg-renderer-narrow",
			"tg-renderer-medium",
			"tg-renderer-wide",
		);
		this.rootEl.addClass(`tg-renderer-${nextMode}`);

		// Re-render on layout change
		void this.render();
	}
}
