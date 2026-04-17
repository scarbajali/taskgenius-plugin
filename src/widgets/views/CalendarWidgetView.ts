import { Notice, TFile, debounce } from "obsidian";
import type { WorkspaceLeaf } from "obsidian";
import type { Task } from "@/types/task";
import TaskProgressBarPlugin from "@/index";
import { BaseWidgetView } from "../core/BaseWidgetView";
import { Events, on } from "@/dataflow/events/Events";
import { isDataflowEnabled } from "@/dataflow/createDataflow";
import {
	CalendarComponent as FullCalendarComponent,
	type CalendarEvent,
} from "@/components/features/calendar";
import { CalendarComponent as MiniCalendarComponent } from "@/components/features/task/view/calendar";

export const CALENDAR_WIDGET_VIEW_TYPE = "task-genius-widget-calendar";

type CalendarWidgetState = {
	linked: boolean;
	viewMode: string;
	selectedDate?: number;
};

export class CalendarWidgetView extends BaseWidgetView<CalendarWidgetState> {
	private fullHostEl?: HTMLElement;
	private miniHostEl?: HTMLElement;
	private miniTasksEl?: HTMLElement;

	private fullCalendar?: FullCalendarComponent;
	private miniCalendar?: MiniCalendarComponent;

	private tasks: Task[] = [];
	private isRestoringMiniSelection = false;
	private refreshScheduled = debounce(() => {
		void this.refreshTasks();
	}, 500);

	constructor(leaf: WorkspaceLeaf, plugin: TaskProgressBarPlugin) {
		super(leaf, plugin, { linked: true, viewMode: "month" });
	}

	getViewType(): string {
		return CALENDAR_WIDGET_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Calendar Widget";
	}

	protected isLinkable(): boolean {
		return true;
	}

	override async onOpen(): Promise<void> {
		await super.onOpen();

		if (
			isDataflowEnabled(this.plugin) &&
			this.plugin.dataflowOrchestrator
		) {
			this.registerEvent(
				on(this.app, Events.TASK_CACHE_UPDATED, () => {
					this.refreshScheduled();
				}),
			);
		}
	}

	protected async render(): Promise<void> {
		const bodyEl = this.getBodyEl();
		const mode = this.getLayoutMode();

		if (!this.fullHostEl) {
			bodyEl.empty();
			const container = bodyEl.createDiv({ cls: "tg-widget-calendar" });

			this.fullHostEl = container.createDiv({
				cls: "tg-widget-calendar-full",
			});
			this.miniHostEl = container.createDiv({
				cls: "tg-widget-calendar-mini",
			});
			this.miniTasksEl = container.createDiv({
				cls: "tg-widget-calendar-mini-tasks",
			});

			this.fullCalendar = new FullCalendarComponent(
				this.app,
				this.plugin,
				this.fullHostEl,
				[],
				{
					onTaskSelected: (task: Task | null) => {
						if (task) {
							void this.openTask(task);
						}
					},
					onTaskCompleted: (task: Task) => {
						void this.toggleTaskCompletion(task, !task.completed);
					},
					onEventContextMenu: (
						ev: MouseEvent,
						event: CalendarEvent,
					) => {
						ev.preventDefault();
						const realTask = (event as any)?.metadata
							?.originalTask as Task;
						if (realTask) {
							void this.openTask(realTask);
						} else {
							void this.openTask(event as unknown as Task);
						}
					},
					persistViewMode: false,
					onViewModeChange: (viewMode) => {
						this.updateWidgetState({ viewMode });
					},
				},
				"calendar",
			);
			this.addChild(this.fullCalendar);
			this.fullCalendar.load();

			this.miniCalendar = new MiniCalendarComponent(this.miniHostEl, {
				showTaskCounts: true,
			});
			this.addChild(this.miniCalendar);
			this.miniCalendar.onDateSelected = (date: Date, tasks: Task[]) => {
				if (!this.isRestoringMiniSelection) {
					this.updateWidgetState({ selectedDate: date.getTime() });
				}
				this.renderMiniTasks(date, tasks);
			};
			this.miniCalendar.load();
		}

		// Visibility is controlled by CSS based on layout mode class
		// (.tg-widget-compact, .tg-widget-narrow, .tg-widget-medium, .tg-widget-wide)

		await this.refreshTasks();

		if (mode !== "compact" && mode !== "narrow") {
			this.fullCalendar?.setView(this.state.viewMode as any);
		}

		if (this.state.selectedDate && this.miniCalendar) {
			const date = new Date(this.state.selectedDate);
			this.isRestoringMiniSelection = true;
			try {
				this.miniCalendar.selectDate(date);
				const tasksForDate = this.getMiniTasksForDate(date);
				this.renderMiniTasks(date, tasksForDate);
			} finally {
				this.isRestoringMiniSelection = false;
			}
		}
	}

	private async refreshTasks(): Promise<void> {
		const queryAPI = this.plugin.dataflowOrchestrator?.getQueryAPI();
		if (!queryAPI) {
			this.fullHostEl?.empty();
			this.fullHostEl?.createDiv({
				cls: "tg-widget-empty",
				text: "Dataflow is not available",
			});
			return;
		}

		this.tasks = await queryAPI.getAllTasks();
		this.fullCalendar?.updateTasks(this.tasks);
		this.miniCalendar?.setTasks(this.tasks);
	}

	private getMiniTasksForDate(date: Date): Task[] {
		const start = new Date(date);
		start.setHours(0, 0, 0, 0);
		const startTs = start.getTime();

		return this.tasks.filter((task) => {
			if (!task.metadata?.dueDate) {
				return false;
			}
			const due = new Date(task.metadata.dueDate);
			due.setHours(0, 0, 0, 0);
			return due.getTime() === startTs && !task.completed;
		});
	}

	private renderMiniTasks(date: Date, tasks: Task[]): void {
		if (!this.miniTasksEl) {
			return;
		}

		this.miniTasksEl.empty();
		this.miniTasksEl.createDiv({
			cls: "tg-widget-section-title",
			text: date.toDateString(),
		});

		if (tasks.length === 0) {
			this.miniTasksEl.createDiv({
				cls: "tg-widget-section-empty",
				text: "No tasks",
			});
			return;
		}

		const listEl = this.miniTasksEl.createDiv({
			cls: "tg-widget-task-list",
		});

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
	}

	private async openTask(task: Task): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(task.filePath);
		if (!(file instanceof TFile)) {
			return;
		}
		await this.app.workspace.getLeaf("tab").openFile(file);
	}
}
