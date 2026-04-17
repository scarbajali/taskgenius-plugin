import {
	ItemView,
	WorkspaceLeaf,
	ViewStateResult,
	debounce,
} from "obsidian";
import TaskProgressBarPlugin from "@/index";
import { globalFilterContext, GlobalFilterState } from "./GlobalFilterContext";
import { WidgetShell } from "./WidgetShell";

export type WidgetLayoutMode = "compact" | "narrow" | "medium" | "wide";

export abstract class BaseWidgetView<
	TState extends Record<string, unknown> & { linked?: boolean },
> extends ItemView {
	protected shell?: WidgetShell;
	protected state: TState;

	private resizeObserver?: ResizeObserver;
	private layoutMode: WidgetLayoutMode = "wide";
	private isPersistingState = false;
	private globalFilterUnsubscribe?: () => void;

	private debouncedPersistState = debounce(() => {
		void this.persistLeafState();
	}, 300);

	constructor(
		leaf: WorkspaceLeaf,
		protected plugin: TaskProgressBarPlugin,
		defaultState: TState,
	) {
		super(leaf);
		this.state = defaultState;
	}

	override async onOpen(): Promise<void> {
		this.contentEl.empty();
		this.contentEl.addClass("tg-widget-view");

		this.shell = new WidgetShell(this.contentEl, {
			title: this.getDisplayText(),
			linkable: this.isLinkable(),
			linked: Boolean(this.state.linked),
			onToggleLinked: (linked) => {
				this.setWidgetState({ linked } as Partial<TState>);
			},
		});
		this.addChild(this.shell);

		this.shell.setLinked(Boolean(this.state.linked));
		this.setupResizeObserver(this.shell.containerEl);
		this.refreshGlobalFilterSubscription();

		await this.render();
	}

	override async onClose(): Promise<void> {
		this.teardownResizeObserver();
		this.globalFilterUnsubscribe?.();
		this.globalFilterUnsubscribe = undefined;
		this.contentEl.empty();
	}

	getState(): TState {
		return this.state;
	}

	override async setState(
		state: Partial<TState>,
		_result: ViewStateResult,
	): Promise<void> {
		this.state = { ...this.state, ...state } as TState;
		this.shell?.setLinked(Boolean(this.state.linked));
		this.refreshGlobalFilterSubscription();
		await this.render();
	}

	protected setWidgetState(patch: Partial<TState>): void {
		this.state = { ...this.state, ...patch } as TState;
		this.shell?.setLinked(Boolean(this.state.linked));
		this.refreshGlobalFilterSubscription();
		this.debouncedPersistState();
		void this.render();
	}

	updateWidgetState(patch: Partial<TState>): void {
		this.setWidgetState(patch);
	}

	protected getLayoutMode(): WidgetLayoutMode {
		return this.layoutMode;
	}

	protected isLinkable(): boolean {
		return false;
	}

	protected onGlobalFilterChanged(_state: GlobalFilterState): void {}

	protected abstract render(): Promise<void> | void;

	protected getBodyEl(): HTMLElement {
		if (!this.shell) {
			throw new Error("WidgetShell not initialized");
		}
		return this.shell.bodyEl;
	}

	private refreshGlobalFilterSubscription(): void {
		if (!this.isLinkable() || !this.state.linked) {
			this.globalFilterUnsubscribe?.();
			this.globalFilterUnsubscribe = undefined;
			return;
		}

		if (this.globalFilterUnsubscribe) {
			return;
		}

		this.globalFilterUnsubscribe = globalFilterContext.subscribe((state) => {
			this.onGlobalFilterChanged(state);
		});
	}

	private setupResizeObserver(target: HTMLElement): void {
		this.teardownResizeObserver();
		this.resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0];
			const width = entry?.contentRect?.width ?? target.clientWidth;
			this.applyLayoutMode(width);
		});
		this.resizeObserver.observe(target);
		this.applyLayoutMode(target.clientWidth);
	}

	private teardownResizeObserver(): void {
		this.resizeObserver?.disconnect();
		this.resizeObserver = undefined;
	}

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

		const el = this.shell?.containerEl;
		if (!el) {
			return;
		}
		el.removeClass("tg-widget-compact");
		el.removeClass("tg-widget-narrow");
		el.removeClass("tg-widget-medium");
		el.removeClass("tg-widget-wide");
		el.addClass(`tg-widget-${nextMode}`);
		void this.render();
	}

	private async persistLeafState(): Promise<void> {
		if (this.isPersistingState) {
			return;
		}
		if (!this.leaf) {
			return;
		}

		try {
			this.isPersistingState = true;
			const current = this.leaf.getViewState();
			await this.leaf.setViewState(
				{
					...current,
					type: this.getViewType(),
					state: this.getState(),
				},
				{ replace: true },
			);
		} finally {
			this.isPersistingState = false;
		}
	}
}
