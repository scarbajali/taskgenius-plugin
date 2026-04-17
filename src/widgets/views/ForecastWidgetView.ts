import { Notice, TFile, WorkspaceLeaf, debounce } from "obsidian";
import type { Task } from "@/types/task";
import TaskProgressBarPlugin from "@/index";
import { BaseWidgetView } from "../core/BaseWidgetView";
import { Events, on } from "@/dataflow/events/Events";
import { isDataflowEnabled } from "@/dataflow/createDataflow";

export const FORECAST_WIDGET_VIEW_TYPE = "task-genius-widget-forecast";

type ForecastWidgetState = {
	linked: boolean;
};

export class ForecastWidgetView extends BaseWidgetView<ForecastWidgetState> {
	private taskContainerEl?: HTMLElement;
	private refreshScheduled = debounce(() => {
		void this.refresh();
	}, 500);

	constructor(leaf: WorkspaceLeaf, plugin: TaskProgressBarPlugin) {
		super(leaf, plugin, { linked: true });
	}

	getViewType(): string {
		return FORECAST_WIDGET_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Forecast Widget";
	}

	protected isLinkable(): boolean {
		return true;
	}

	override async onOpen(): Promise<void> {
		await super.onOpen();

		if (isDataflowEnabled(this.plugin) && this.plugin.dataflowOrchestrator) {
			this.registerEvent(
				on(this.app, Events.TASK_CACHE_UPDATED, () => {
					this.refreshScheduled();
				}),
			);
		}
	}

	protected async render(): Promise<void> {
		const bodyEl = this.getBodyEl();
		if (!this.taskContainerEl) {
			bodyEl.empty();
			this.taskContainerEl = bodyEl.createDiv({
				cls: "tg-widget-forecast",
			});
		}
		await this.refresh();
	}

	private async refresh(): Promise<void> {
		if (!this.taskContainerEl) {
			return;
		}

		const queryAPI = this.plugin.dataflowOrchestrator?.getQueryAPI();
		if (!queryAPI) {
			this.taskContainerEl.empty();
			this.taskContainerEl.createDiv({
				cls: "tg-widget-empty",
				text: "Dataflow is not available",
			});
			return;
		}

		const [overdue, today, tomorrow] = await Promise.all([
			queryAPI.getOverdueTasks(),
			queryAPI.getTasksDueToday(),
			this.getTasksDueTomorrow(queryAPI),
		]);

		this.taskContainerEl.empty();
		this.renderSection(this.taskContainerEl, "Overdue", overdue);
		this.renderSection(
			this.taskContainerEl,
			"Today",
			today.filter((task) => !task.completed),
		);
		this.renderSection(this.taskContainerEl, "Tomorrow", tomorrow);
	}

	private async getTasksDueTomorrow(queryAPI: {
		getTasksByDateRange: (opts: {
			from?: number;
			to?: number;
			field?: "due" | "start" | "scheduled";
		}) => Promise<Task[]>;
	}): Promise<Task[]> {
		const start = new Date();
		start.setHours(0, 0, 0, 0);
		start.setDate(start.getDate() + 1);

		const end = new Date(start);
		end.setDate(end.getDate() + 1);

		const tasks = await queryAPI.getTasksByDateRange({
			from: start.getTime(),
			to: end.getTime(),
			field: "due",
		});

		return tasks.filter((task) => !task.completed);
	}

	private renderSection(
		parentEl: HTMLElement,
		title: string,
		tasks: Task[],
	): void {
		const sectionEl = parentEl.createDiv({ cls: "tg-widget-section" });
		sectionEl.createDiv({
			cls: "tg-widget-section-title",
			text: `${title} (${tasks.length})`,
		});

		if (tasks.length === 0) {
			sectionEl.createDiv({
				cls: "tg-widget-section-empty",
				text: "No tasks",
			});
			return;
		}

		const listEl = sectionEl.createDiv({ cls: "tg-widget-task-list" });
		for (const task of tasks) {
			const rowEl = listEl.createDiv({ cls: "tg-widget-task-row" });
			const checkbox = rowEl.createEl("input", {
				type: "checkbox",
			});
			checkbox.checked = Boolean(task.completed);

			this.registerDomEvent(checkbox, "change", async () => {
				await this.toggleTaskCompletion(task, checkbox.checked);
			});

			const titleEl = rowEl.createDiv({
				cls: "tg-widget-task-title",
				text: task.content,
			});
			this.registerDomEvent(titleEl, "click", async () => {
				await this.openTask(task);
			});
		}
	}

	private async toggleTaskCompletion(
		task: Task,
		completed: boolean,
	): Promise<void> {
		if (!this.plugin.writeAPI) {
			new Notice("Write API not available");
			return;
		}

		const result = await this.plugin.writeAPI.updateTaskStatus({
			taskId: task.id,
			completed,
		});
		if (!result.success) {
			new Notice(result.error ?? "Failed to update task");
		}
		await this.refresh();
	}

	private async openTask(task: Task): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(task.filePath);
		if (!(file instanceof TFile)) {
			return;
		}
		await this.app.workspace.getLeaf("tab").openFile(file);
	}
}
