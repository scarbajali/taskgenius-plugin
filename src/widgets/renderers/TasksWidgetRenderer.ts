import { Notice, TFile, setIcon, App } from "obsidian";
import type { Task } from "@/types/task";
import {
	BaseWidgetRenderer,
	type WidgetRendererOptions,
} from "./BaseWidgetRenderer";

export type TasksGroupByMode =
	| "none"
	| "tag"
	| "project"
	| "priority"
	| "due"
	| "status"
	| "date";

export interface TasksFilterConfig {
	/** Filter by tags */
	tags?: string[];
	/** Filter by projects */
	projects?: string[];
	/** Filter by status (completed, todo, etc.) */
	status?: ("completed" | "todo" | "in-progress")[];
	/** Text query filter */
	query?: string;
	/** Only show overdue tasks */
	overdue?: boolean;
	/** Only show tasks due within N days */
	dueWithinDays?: number;
}

export interface TasksWidgetState {
	groupBy: TasksGroupByMode;
	collapsedGroups: string[];
	filter?: TasksFilterConfig;
	showToolbar?: boolean;
	[key: string]: unknown;
}

const DEFAULT_STATE: TasksWidgetState = {
	groupBy: "tag",
	collapsedGroups: [],
	showToolbar: true,
};

/**
 * TasksWidgetRenderer - Renders a tasks list widget
 * Can be used in both sidebar (via TasksWidgetView) and embedded codeblock
 */
export class TasksWidgetRenderer extends BaseWidgetRenderer<TasksWidgetState> {
	private app: App;
	private taskContainerEl?: HTMLElement;
	private tasks: Task[] = [];
	private filteredTasks: Task[] = [];

	constructor(app: App, options: WidgetRendererOptions<TasksWidgetState>) {
		super({
			...options,
			initialState: { ...DEFAULT_STATE, ...options.initialState },
		});
		this.app = app;
	}

	protected async render(): Promise<void> {
		const bodyEl = this.getBodyEl();

		if (!this.taskContainerEl) {
			bodyEl.empty();

			// Only show toolbar if not embedded or explicitly enabled
			if (this.state.showToolbar && !this.isEmbedded()) {
				this.renderToolbar(bodyEl);
			}

			this.taskContainerEl = bodyEl.createDiv({
				cls: "tg-tasks-container",
			});
		}

		await this.refreshTasks();
	}

	/**
	 * Set tasks externally (used by View wrapper)
	 */
	setTasks(tasks: Task[]): void {
		this.tasks = tasks;
		this.applyFilter();
		this.renderTaskList();
	}

	/**
	 * Apply external filter state (from GlobalFilterContext)
	 */
	applyExternalFilter(filter: {
		tags?: string[];
		projects?: string[];
		contexts?: string[];
		query?: string;
	}): void {
		// Merge external filter with internal filter
		const merged: TasksFilterConfig = {
			...this.state.filter,
			tags:
				filter.tags && filter.tags.length > 0
					? filter.tags
					: this.state.filter?.tags,
			projects:
				filter.projects && filter.projects.length > 0
					? filter.projects
					: this.state.filter?.projects,
			query: filter.query || this.state.filter?.query,
		};
		this.setState({ filter: merged });
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

		const options: { value: TasksGroupByMode; label: string }[] = [
			{ value: "none", label: "None" },
			{ value: "tag", label: "Tag" },
			{ value: "project", label: "Project" },
			{ value: "priority", label: "Priority" },
			{ value: "due", label: "Due Date" },
			{ value: "status", label: "Status" },
			{ value: "date", label: "Date" },
		];

		for (const opt of options) {
			const optionEl = select.createEl("option", {
				value: opt.value,
				text: opt.label,
			});
			if (opt.value === this.state.groupBy) {
				optionEl.selected = true;
			}
		}

		this.registerDomEvent(select, "change", () => {
			this.setState({
				groupBy: select.value as TasksGroupByMode,
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
		this.applyFilter();
		this.renderTaskList();
	}

	private applyFilter(): void {
		let filtered = [...this.tasks];
		const filter = this.state.filter;

		// Default: hide completed unless explicitly requested
		if (!filter?.status || !filter.status.includes("completed")) {
			filtered = filtered.filter((t) => !t.completed);
		}

		if (filter?.tags && filter.tags.length > 0) {
			filtered = filtered.filter((task) =>
				filter.tags!.some((tag) => task.metadata.tags?.includes(tag)),
			);
		}

		if (filter?.projects && filter.projects.length > 0) {
			filtered = filtered.filter((task) =>
				filter.projects!.includes(task.metadata.project ?? ""),
			);
		}

		if (filter?.query && filter.query.trim()) {
			const q = filter.query.toLowerCase();
			filtered = filtered.filter((task) =>
				task.content.toLowerCase().includes(q),
			);
		}

		if (filter?.overdue) {
			const now = Date.now();
			filtered = filtered.filter(
				(task) => task.metadata.dueDate && task.metadata.dueDate < now,
			);
		}

		if (filter?.dueWithinDays !== undefined && filter.dueWithinDays > 0) {
			const now = new Date();
			now.setHours(0, 0, 0, 0);
			const endDate = new Date(now);
			endDate.setDate(endDate.getDate() + filter.dueWithinDays);

			filtered = filtered.filter((task) => {
				if (!task.metadata.dueDate) return false;
				const due = new Date(task.metadata.dueDate);
				return due >= now && due <= endDate;
			});
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

		const groups = this.groupTasks(this.filteredTasks);
		const sortedGroupNames = this.sortGroupNames(Object.keys(groups));

		for (const groupName of sortedGroupNames) {
			this.renderGroup(
				this.taskContainerEl,
				groupName,
				groups[groupName],
			);
		}
	}

	private groupTasks(tasks: Task[]): Record<string, Task[]> {
		const groups: Record<string, Task[]> = {};
		const mode = this.state.groupBy;

		if (mode === "none") {
			groups["All Tasks"] = tasks;
			return groups;
		}

		for (const task of tasks) {
			let keys: string[];

			switch (mode) {
				case "tag": {
					const tags = task.metadata.tags;
					keys = tags && tags.length > 0 ? tags : ["No Tag"];
					break;
				}
				case "project": {
					const project = task.metadata.project;
					keys = [project ?? "No Project"];
					break;
				}
				case "priority": {
					const p = task.metadata.priority ?? 0;
					keys = [this.getPriorityGroupName(p)];
					break;
				}
				case "due": {
					keys = [this.getDueGroupName(task.metadata.dueDate)];
					break;
				}
				case "status": {
					keys = [this.getStatusGroupName(task)];
					break;
				}
				case "date": {
					keys = [
						this.getAbsoluteDateGroupName(task.metadata.dueDate),
					];
					break;
				}
				default:
					keys = ["Other"];
			}

			for (const key of keys) {
				if (!groups[key]) {
					groups[key] = [];
				}
				if (!groups[key].some((t) => t.id === task.id)) {
					groups[key].push(task);
				}
			}
		}

		return groups;
	}

	private sortGroupNames(names: string[]): string[] {
		const mode = this.state.groupBy;

		if (mode === "priority") {
			const order = [
				"Highest",
				"High",
				"Medium",
				"Low",
				"Lowest",
				"No Priority",
			];
			return names.sort((a, b) => order.indexOf(a) - order.indexOf(b));
		}

		if (mode === "due") {
			const order = [
				"Overdue",
				"Today",
				"Tomorrow",
				"This Week",
				"Next Week",
				"Later",
				"No Due Date",
			];
			return names.sort((a, b) => order.indexOf(a) - order.indexOf(b));
		}

		if (mode === "status") {
			const order = [
				"In Progress",
				"Todo",
				"Planned",
				"Completed",
				"Cancelled",
				"Other",
			];
			return names.sort((a, b) => {
				const idxA = order.indexOf(a);
				const idxB = order.indexOf(b);
				if (idxA !== -1 && idxB !== -1) return idxA - idxB;
				if (idxA !== -1) return -1;
				if (idxB !== -1) return 1;
				return a.localeCompare(b);
			});
		}

		if (mode === "date") {
			// Sort by date descending (most recent first), with "No Due Date" at end
			return names.sort((a, b) => {
				if (a === "No Due Date") return 1;
				if (b === "No Due Date") return -1;
				// Dates are in YYYY-MM-DD format, so string comparison works
				return b.localeCompare(a);
			});
		}

		// Default: alphabetical with special groups at end
		return names.sort((a, b) => {
			const specialGroups = [
				"Uncategorized",
				"No Tag",
				"No Project",
				"No Priority",
				"No Due Date",
			];
			const aIsSpecial = specialGroups.includes(a);
			const bIsSpecial = specialGroups.includes(b);

			if (aIsSpecial && !bIsSpecial) return 1;
			if (!aIsSpecial && bIsSpecial) return -1;
			return a.localeCompare(b);
		});
	}

	private getPriorityGroupName(priority: number): string {
		switch (priority) {
			case 5:
				return "Highest";
			case 4:
				return "High";
			case 3:
				return "Medium";
			case 2:
				return "Low";
			case 1:
				return "Lowest";
			default:
				return "No Priority";
		}
	}

	private getDueGroupName(dueDate?: number): string {
		if (!dueDate) return "No Due Date";

		const now = new Date();
		now.setHours(0, 0, 0, 0);
		const due = new Date(dueDate);
		due.setHours(0, 0, 0, 0);

		const diffDays = Math.floor(
			(due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
		);

		if (diffDays < 0) return "Overdue";
		if (diffDays === 0) return "Today";
		if (diffDays === 1) return "Tomorrow";
		if (diffDays <= 7) return "This Week";
		if (diffDays <= 14) return "Next Week";
		return "Later";
	}

	private getStatusGroupName(task: Task): string {
		const statusChar = task.status || (task.completed ? "x" : " ");
		const statuses = this.plugin.settings.taskStatuses;

		const isInGroup = (group: string, char: string): boolean =>
			group.split("|").includes(char);

		if (isInGroup(statuses.inProgress, statusChar)) return "In Progress";
		if (isInGroup(statuses.notStarted, statusChar)) return "Todo";
		if (isInGroup(statuses.completed, statusChar)) return "Completed";
		if (isInGroup(statuses.abandoned, statusChar)) return "Cancelled";
		if (isInGroup(statuses.planned, statusChar)) return "Planned";

		// Fallback based on countOtherStatusesAs setting
		const otherMapping = this.plugin.settings.countOtherStatusesAs;
		if (otherMapping === "inProgress") return "In Progress";
		if (otherMapping === "completed") return "Completed";
		if (otherMapping === "abandoned") return "Cancelled";
		if (otherMapping === "planned") return "Planned";
		if (otherMapping === "notStarted") return "Todo";

		return "Other";
	}

	private getAbsoluteDateGroupName(dueDate?: number): string {
		if (!dueDate) return "No Due Date";

		const due = new Date(dueDate);
		const year = due.getFullYear();
		const month = String(due.getMonth() + 1).padStart(2, "0");
		const day = String(due.getDate()).padStart(2, "0");

		return `${year}-${month}-${day}`;
	}

	private renderGroup(
		container: HTMLElement,
		name: string,
		tasks: Task[],
	): void {
		const isCollapsed = this.state.collapsedGroups.includes(name);
		const groupEl = container.createDiv({ cls: "tg-tasks-group" });

		const headerEl = groupEl.createDiv({ cls: "tg-tasks-group-header" });

		const chevronEl = headerEl.createSpan({
			cls: "tg-tasks-group-chevron",
		});
		setIcon(chevronEl, isCollapsed ? "chevron-right" : "chevron-down");

		headerEl.createSpan({
			cls: "tg-tasks-group-title",
			text: name,
		});

		headerEl.createSpan({
			cls: "tg-tasks-group-count",
			text: `${tasks.length}`,
		});

		this.registerDomEvent(headerEl, "click", () => {
			this.toggleGroupCollapse(name);
		});

		if (!isCollapsed) {
			const listEl = groupEl.createDiv({ cls: "tg-tasks-group-list" });
			for (const task of tasks) {
				this.renderTaskItem(listEl, task);
			}
		}
	}

	private toggleGroupCollapse(groupName: string): void {
		const collapsed = [...this.state.collapsedGroups];
		const index = collapsed.indexOf(groupName);

		if (index >= 0) {
			collapsed.splice(index, 1);
		} else {
			collapsed.push(groupName);
		}

		this.setState({ collapsedGroups: collapsed });
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
