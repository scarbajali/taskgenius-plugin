import type TaskProgressBarPlugin from "@/index";
import type { WorkspaceLeaf } from "obsidian";
import { WidgetFactory } from "./core/WidgetFactory";
import {
	FORECAST_WIDGET_VIEW_TYPE,
	ForecastWidgetView,
} from "./views/ForecastWidgetView";
import {
	CALENDAR_WIDGET_VIEW_TYPE,
	CalendarWidgetView,
} from "./views/CalendarWidgetView";
import {
	TASKS_WIDGET_VIEW_TYPE,
	TasksWidgetView,
} from "./views/TasksWidgetView";
import {
	PROJECTS_WIDGET_VIEW_TYPE,
	ProjectsWidgetView,
} from "./views/ProjectsWidgetView";
import {
	KANBAN_WIDGET_VIEW_TYPE,
	KanbanWidgetView,
} from "./views/KanbanWidgetView";

const factory = new WidgetFactory();

factory.register({
	viewType: FORECAST_WIDGET_VIEW_TYPE,
	displayName: "Forecast Widget",
	commandId: "open-task-genius-widget-forecast",
	openLocation: "right",
	create: (leaf: WorkspaceLeaf, plugin: TaskProgressBarPlugin) =>
		new ForecastWidgetView(leaf, plugin),
});

factory.register({
	viewType: CALENDAR_WIDGET_VIEW_TYPE,
	displayName: "Calendar Widget",
	commandId: "open-task-genius-widget-calendar",
	openLocation: "right",
	create: (leaf: WorkspaceLeaf, plugin: TaskProgressBarPlugin) =>
		new CalendarWidgetView(leaf, plugin),
});

factory.register({
	viewType: TASKS_WIDGET_VIEW_TYPE,
	displayName: "Tasks Widget",
	commandId: "open-task-genius-widget-tasks",
	openLocation: "right",
	create: (leaf: WorkspaceLeaf, plugin: TaskProgressBarPlugin) =>
		new TasksWidgetView(leaf, plugin),
});

factory.register({
	viewType: PROJECTS_WIDGET_VIEW_TYPE,
	displayName: "Projects Widget",
	commandId: "open-task-genius-widget-projects",
	openLocation: "right",
	create: (leaf: WorkspaceLeaf, plugin: TaskProgressBarPlugin) =>
		new ProjectsWidgetView(leaf, plugin),
});

factory.register({
	viewType: KANBAN_WIDGET_VIEW_TYPE,
	displayName: "Kanban Widget",
	commandId: "open-task-genius-widget-kanban",
	openLocation: "right",
	create: (leaf: WorkspaceLeaf, plugin: TaskProgressBarPlugin) =>
		new KanbanWidgetView(leaf, plugin),
});

export function registerWidgetViews(plugin: TaskProgressBarPlugin): void {
	for (const widget of factory.list()) {
		plugin.registerView(widget.viewType, (leaf) =>
			widget.create(leaf, plugin),
		);
	}
}

export function registerWidgetCommands(plugin: TaskProgressBarPlugin): void {
	for (const widget of factory.list()) {
		plugin.addCommand({
			id: widget.commandId,
			name: `Task Genius: Open ${widget.displayName}`,
			callback: async () => {
				const { workspace } = plugin.app;
				const leaf =
					(widget.openLocation === "left"
						? workspace.getLeftLeaf(true)
						: widget.openLocation === "tab"
							? workspace.getLeaf("tab")
							: workspace.getRightLeaf(true)) ??
					workspace.getLeaf("tab");

				await leaf.setViewState({ type: widget.viewType });
				workspace.revealLeaf(leaf);
			},
		});
	}
}
