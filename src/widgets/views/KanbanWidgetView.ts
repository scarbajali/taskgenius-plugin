import { Notice, TFile, debounce } from "obsidian";
import type { WorkspaceLeaf } from "obsidian";
import Sortable from "sortablejs";
import type { Task } from "@/types/task";
import TaskProgressBarPlugin from "@/index";
import { BaseWidgetView } from "../core/BaseWidgetView";
import { Events, on } from "@/dataflow/events/Events";
import { isDataflowEnabled } from "@/dataflow/createDataflow";
import {
	globalFilterContext,
	type GlobalFilterState,
} from "../core/GlobalFilterContext";

export const KANBAN_WIDGET_VIEW_TYPE = "task-genius-widget-kanban";

interface KanbanColumn {
	id: string;
	label: string;
	statusChars: string[];
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
	{ id: "todo", label: "To Do", statusChars: [" "] },
	{ id: "doing", label: "In Progress", statusChars: ["/"] },
	{ id: "done", label: "Done", statusChars: ["x", "X"] },
];

interface KanbanWidgetState {
	linked: boolean;
	[key: string]: unknown;
}

const DEFAULT_STATE: KanbanWidgetState = {
	linked: true,
};

export class KanbanWidgetView extends BaseWidgetView<KanbanWidgetState> {
	private boardContainerEl?: HTMLElement;
	private tasks: Task[] = [];
	private filteredTasks: Task[] = [];
	private sortableInstances: Sortable[] = [];

	private refreshScheduled = debounce(() => {
		void this.refreshTasks();
	}, 500);

	constructor(leaf: WorkspaceLeaf, plugin: TaskProgressBarPlugin) {
		super(leaf, plugin, { ...DEFAULT_STATE });
	}

	getViewType(): string {
		return KANBAN_WIDGET_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Kanban Widget";
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

	override async onClose(): Promise<void> {
		this.destroySortables();
		await super.onClose();
	}

	protected onGlobalFilterChanged(state: GlobalFilterState): void {
		this.applyFilter(state);
		this.renderBoard();
	}

	protected async render(): Promise<void> {
		const bodyEl = this.getBodyEl();

		if (!this.boardContainerEl) {
			bodyEl.empty();
			this.boardContainerEl = bodyEl.createDiv({
				cls: "tg-kanban-container",
			});
		}

		await this.refreshTasks();
	}

	private async refreshTasks(): Promise<void> {
		const queryAPI = this.plugin.dataflowOrchestrator?.getQueryAPI();
		if (!queryAPI) {
			this.boardContainerEl?.empty();
			this.boardContainerEl?.createDiv({
				cls: "tg-widget-empty",
				text: "Dataflow is not available",
			});
			return;
		}

		this.tasks = await queryAPI.getAllTasks();

		if (this.state.linked) {
			this.applyFilter(globalFilterContext.getState());
		} else {
			this.filteredTasks = [...this.tasks];
		}

		this.renderBoard();
	}

	private applyFilter(filter: GlobalFilterState): void {
		let filtered = [...this.tasks];

		if (filter.tags && filter.tags.length > 0) {
			filtered = filtered.filter((task) =>
				filter.tags!.some((tag) => task.metadata.tags?.includes(tag)),
			);
		}

		if (filter.projects && filter.projects.length > 0) {
			filtered = filtered.filter((task) =>
				filter.projects!.includes(task.metadata.project ?? ""),
			);
		}

		if (filter.contexts && filter.contexts.length > 0) {
			filtered = filtered.filter((task) =>
				filter.contexts!.includes(task.metadata.context ?? ""),
			);
		}

		if (filter.query && filter.query.trim()) {
			const q = filter.query.toLowerCase();
			filtered = filtered.filter((task) =>
				task.content.toLowerCase().includes(q),
			);
		}

		this.filteredTasks = filtered;
	}

	private renderBoard(): void {
		if (!this.boardContainerEl) return;

		this.destroySortables();
		this.boardContainerEl.empty();

		const layoutMode = this.getLayoutMode();
		const isVertical = layoutMode === "compact" || layoutMode === "narrow";

		const boardEl = this.boardContainerEl.createDiv({
			cls: `tg-kanban-board ${isVertical ? "is-vertical" : "is-horizontal"}`,
		});

		for (const column of DEFAULT_COLUMNS) {
			this.renderColumn(boardEl, column);
		}
	}

	private renderColumn(board: HTMLElement, column: KanbanColumn): void {
		const columnTasks = this.getTasksForColumn(column);

		const columnEl = board.createDiv({
			cls: "tg-kanban-column",
			attr: { "data-column-id": column.id },
		});

		const headerEl = columnEl.createDiv({ cls: "tg-kanban-column-header" });

		headerEl.createSpan({
			cls: "tg-kanban-column-title",
			text: column.label,
		});

		headerEl.createSpan({
			cls: "tg-kanban-column-count",
			text: `${columnTasks.length}`,
		});

		const listEl = columnEl.createDiv({
			cls: "tg-kanban-column-list",
			attr: { "data-column-id": column.id },
		});

		for (const task of columnTasks) {
			this.renderCard(listEl, task);
		}

		const sortable = new Sortable(listEl, {
			group: "kanban-tasks",
			animation: 150,
			ghostClass: "tg-kanban-card-ghost",
			chosenClass: "tg-kanban-card-chosen",
			dragClass: "tg-kanban-card-drag",
			onEnd: (evt) => {
				this.handleDragEnd(evt);
			},
		});

		this.sortableInstances.push(sortable);
	}

	private getTasksForColumn(column: KanbanColumn): Task[] {
		return this.filteredTasks.filter((task) => {
			if (column.id === "done") {
				return task.completed;
			}
			return column.statusChars.includes(task.status);
		});
	}

	private renderCard(container: HTMLElement, task: Task): void {
		const cardEl = container.createDiv({
			cls: "tg-kanban-card",
			attr: { "data-task-id": task.id },
		});

		const contentEl = cardEl.createDiv({ cls: "tg-kanban-card-content" });
		contentEl.createDiv({
			cls: "tg-kanban-card-title",
			text: task.content,
		});

		const metaEl = cardEl.createDiv({ cls: "tg-kanban-card-meta" });

		if (task.metadata.project) {
			metaEl.createSpan({
				cls: "tg-kanban-card-project",
				text: task.metadata.project,
			});
		}

		if (task.metadata.dueDate) {
			const dueDate = new Date(task.metadata.dueDate);
			const now = new Date();
			now.setHours(0, 0, 0, 0);
			const isOverdue = dueDate < now && !task.completed;

			metaEl.createSpan({
				cls: `tg-kanban-card-due ${isOverdue ? "is-overdue" : ""}`,
				text: this.formatDate(dueDate),
			});
		}

		if (task.metadata.tags && task.metadata.tags.length > 0) {
			const tagsEl = cardEl.createDiv({ cls: "tg-kanban-card-tags" });
			for (const tag of task.metadata.tags.slice(0, 3)) {
				tagsEl.createSpan({
					cls: "tg-kanban-card-tag",
					text: tag.replace(/^#/, ""),
				});
			}
			if (task.metadata.tags.length > 3) {
				tagsEl.createSpan({
					cls: "tg-kanban-card-tag tg-kanban-card-tag-more",
					text: `+${task.metadata.tags.length - 3}`,
				});
			}
		}

		this.registerDomEvent(contentEl, "click", async () => {
			await this.openTask(task);
		});
	}

	private formatDate(date: Date): string {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const target = new Date(date);
		target.setHours(0, 0, 0, 0);

		const diff = Math.floor(
			(target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
		);

		if (diff === 0) return "Today";
		if (diff === 1) return "Tomorrow";
		if (diff === -1) return "Yesterday";
		if (diff < -1) return `${Math.abs(diff)}d ago`;
		if (diff < 7) return `In ${diff}d`;

		return date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
		});
	}

	private async handleDragEnd(evt: Sortable.SortableEvent): Promise<void> {
		const taskId = evt.item.dataset.taskId;
		const targetColumnId = (evt.to as HTMLElement).dataset.columnId;

		if (!taskId || !targetColumnId) return;

		const task = this.tasks.find((t) => t.id === taskId);
		if (!task) return;

		const targetColumn = DEFAULT_COLUMNS.find(
			(c) => c.id === targetColumnId,
		);
		if (!targetColumn) return;

		const newCompleted = targetColumn.id === "done";
		const newStatus = targetColumn.statusChars[0];

		if (task.completed === newCompleted && task.status === newStatus) {
			return;
		}

		await this.updateTaskStatus(task, newStatus, newCompleted);
	}

	private async updateTaskStatus(
		task: Task,
		newStatus: string,
		completed: boolean,
	): Promise<void> {
		if (!this.plugin.writeAPI) {
			new Notice("Write API not available");
			return;
		}

		const result = await this.plugin.writeAPI.updateTaskStatus({
			taskId: task.id,
			completed,
			status: newStatus,
		});

		if (!result.success) {
			new Notice(result.error ?? "Failed to update task");
			void this.refreshTasks();
		}
	}

	private async openTask(task: Task): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(task.filePath);
		if (!(file instanceof TFile)) {
			return;
		}
		await this.app.workspace.getLeaf("tab").openFile(file);
	}

	private destroySortables(): void {
		for (const sortable of this.sortableInstances) {
			sortable.destroy();
		}
		this.sortableInstances = [];
	}
}
