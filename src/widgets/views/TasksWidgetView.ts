import { Notice, TFile, debounce, setIcon } from "obsidian";
import type { WorkspaceLeaf } from "obsidian";
import type { Task } from "@/types/task";
import type { GroupByDimension } from "@/types/groupBy";
import TaskProgressBarPlugin from "@/index";
import { BaseWidgetView } from "../core/BaseWidgetView";
import { Events, on } from "@/dataflow/events/Events";
import { isDataflowEnabled } from "@/dataflow/createDataflow";
import {
	globalFilterContext,
	type GlobalFilterState,
} from "../core/GlobalFilterContext";
import {
	groupTasksBy,
	getGroupByDimensionLabel,
} from "@/utils/grouping/taskGrouping";

export const TASKS_WIDGET_VIEW_TYPE = "task-genius-widget-tasks";

interface TasksWidgetState {
	linked: boolean;
	groupBy: GroupByDimension;
	collapsedGroups: string[];
	[key: string]: unknown;
}

const DEFAULT_STATE: TasksWidgetState = {
	linked: true,
	groupBy: "tags",
	collapsedGroups: [],
};

export class TasksWidgetView extends BaseWidgetView<TasksWidgetState> {
	private taskContainerEl?: HTMLElement;
	private tasks: Task[] = [];
	private filteredTasks: Task[] = [];

	private refreshScheduled = debounce(() => {
		void this.refreshTasks();
	}, 500);

	constructor(leaf: WorkspaceLeaf, plugin: TaskProgressBarPlugin) {
		super(leaf, plugin, { ...DEFAULT_STATE });
	}

	getViewType(): string {
		return TASKS_WIDGET_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Tasks Widget";
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

	protected onGlobalFilterChanged(state: GlobalFilterState): void {
		this.applyFilter(state);
		this.renderTaskList();
	}

	protected async render(): Promise<void> {
		const bodyEl = this.getBodyEl();

		if (!this.taskContainerEl) {
			bodyEl.empty();
			this.renderToolbar(bodyEl);
			this.taskContainerEl = bodyEl.createDiv({
				cls: "tg-tasks-container",
			});
		}

		await this.refreshTasks();
	}

	private renderToolbar(parentEl: HTMLElement): void {
		const toolbar = parentEl.createDiv({ cls: "tg-tasks-toolbar" });

		toolbar.createSpan({
			cls: "tg-tasks-toolbar-label",
			text: "Group by:",
		});

		const select = toolbar.createEl("select", {
			cls: "tg-tasks-group-select dropdown",
		});

		const dimensions: GroupByDimension[] = [
			"none",
			"dueDate",
			"priority",
			"project",
			"tags",
			"status",
			"filePath",
		];

		for (const dim of dimensions) {
			const optionEl = select.createEl("option", {
				value: dim,
				text: getGroupByDimensionLabel(dim),
			});
			if (dim === this.state.groupBy) {
				optionEl.selected = true;
			}
		}

		this.registerDomEvent(select, "change", () => {
			this.updateWidgetState({
				groupBy: select.value as GroupByDimension,
				collapsedGroups: [],
			});
		});
	}

	private async refreshTasks(): Promise<void> {
		const queryAPI = this.plugin.dataflowOrchestrator?.getQueryAPI();
		if (!queryAPI) {
			this.taskContainerEl?.empty();
			this.taskContainerEl?.createDiv({
				cls: "tg-widget-empty",
				text: "Dataflow is not available",
			});
			return;
		}

		this.tasks = await queryAPI.getAllTasks();
		this.tasks = this.tasks.filter((t) => !t.completed);

		if (this.state.linked) {
			this.applyFilter(globalFilterContext.getState());
		} else {
			this.filteredTasks = [...this.tasks];
		}

		this.renderTaskList();
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

	private renderTaskList(): void {
		if (!this.taskContainerEl) return;
		this.taskContainerEl.empty();

		if (this.filteredTasks.length === 0) {
			this.taskContainerEl.createDiv({
				cls: "tg-widget-empty",
				text: "No tasks",
			});
			return;
		}

		const groups = groupTasksBy(
			this.filteredTasks,
			this.state.groupBy,
			this.plugin.settings,
		);

		for (const group of groups) {
			this.renderGroup(
				this.taskContainerEl,
				group.title,
				group.tasks,
				group.key,
			);
		}
	}

	private renderGroup(
		container: HTMLElement,
		title: string,
		tasks: Task[],
		key: string,
	): void {
		const isCollapsed = this.state.collapsedGroups.includes(key);
		const groupEl = container.createDiv({ cls: "tg-tasks-group" });

		const headerEl = groupEl.createDiv({ cls: "tg-tasks-group-header" });

		const chevronEl = headerEl.createSpan({
			cls: "tg-tasks-group-chevron",
		});
		setIcon(chevronEl, isCollapsed ? "chevron-right" : "chevron-down");

		headerEl.createSpan({
			cls: "tg-tasks-group-title",
			text: title,
		});

		headerEl.createSpan({
			cls: "tg-tasks-group-count",
			text: `${tasks.length}`,
		});

		this.registerDomEvent(headerEl, "click", () => {
			this.toggleGroupCollapse(key);
		});

		if (!isCollapsed) {
			const listEl = groupEl.createDiv({ cls: "tg-tasks-group-list" });
			const sortedTasks = this.sortTasksInGroup(tasks);
			for (const task of sortedTasks) {
				this.renderTaskItem(listEl, task);
			}
		}
	}

	private sortTasksInGroup(tasks: Task[]): Task[] {
		return [...tasks].sort((a, b) => {
			// Primary: due date ascending (tasks with due dates first)
			const dueDateA = a.metadata.dueDate
				? new Date(a.metadata.dueDate).getTime()
				: Infinity;
			const dueDateB = b.metadata.dueDate
				? new Date(b.metadata.dueDate).getTime()
				: Infinity;
			if (dueDateA !== dueDateB) {
				return dueDateA - dueDateB;
			}

			// Secondary: priority descending (higher priority first)
			const priorityA = a.metadata.priority ?? 0;
			const priorityB = b.metadata.priority ?? 0;
			if (priorityA !== priorityB) {
				return priorityB - priorityA;
			}

			// Tertiary: content alphabetically
			return a.content.localeCompare(b.content);
		});
	}

	private toggleGroupCollapse(key: string): void {
		const collapsed = [...this.state.collapsedGroups];
		const index = collapsed.indexOf(key);

		if (index >= 0) {
			collapsed.splice(index, 1);
		} else {
			collapsed.push(key);
		}

		this.updateWidgetState({ collapsedGroups: collapsed });
	}

	private renderTaskItem(container: HTMLElement, task: Task): void {
		const itemEl = container.createDiv({ cls: "tg-tasks-item" });

		const checkbox = itemEl.createEl("input", { type: "checkbox" });
		checkbox.checked = Boolean(task.completed);
		checkbox.addClass("task-list-item-checkbox");

		this.registerDomEvent(checkbox, "change", async () => {
			await this.toggleTaskCompletion(task, checkbox.checked);
		});

		const contentEl = itemEl.createDiv({ cls: "tg-tasks-item-content" });

		const titleEl = contentEl.createDiv({
			cls: "tg-tasks-item-title",
			text: task.content,
		});

		this.registerDomEvent(titleEl, "click", async () => {
			await this.openTask(task);
		});

		const metaEl = contentEl.createDiv({ cls: "tg-tasks-item-meta" });

		if (task.metadata.dueDate) {
			const dueDate = new Date(task.metadata.dueDate);
			const isOverdue = dueDate < new Date();
			metaEl.createSpan({
				cls: `tg-tasks-item-due ${isOverdue ? "is-overdue" : ""}`,
				text: this.formatDate(dueDate),
			});
		}

		if (task.metadata.priority && task.metadata.priority > 0) {
			metaEl.createSpan({
				cls: `tg-tasks-item-priority priority-${task.metadata.priority}`,
				text: this.getPriorityLabel(task.metadata.priority),
			});
		}
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

	private getPriorityLabel(priority: number): string {
		switch (priority) {
			case 5:
				return "🔴";
			case 4:
				return "🟠";
			case 3:
				return "🟡";
			case 2:
				return "🔵";
			case 1:
				return "⚪";
			default:
				return "";
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
