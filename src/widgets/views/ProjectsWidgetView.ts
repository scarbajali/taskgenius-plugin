import { Notice, TFile, debounce } from "obsidian";
import type { WorkspaceLeaf } from "obsidian";
import type { Task } from "@/types/task";
import TaskProgressBarPlugin from "@/index";
import { BaseWidgetView } from "../core/BaseWidgetView";
import { Events, on } from "@/dataflow/events/Events";
import { isDataflowEnabled } from "@/dataflow/createDataflow";
import {
	globalFilterContext,
	type GlobalFilterState,
} from "../core/GlobalFilterContext";

export const PROJECTS_WIDGET_VIEW_TYPE = "task-genius-widget-projects";

interface ProjectStats {
	name: string;
	total: number;
	completed: number;
	overdue: number;
	tasks: Task[];
}

interface ProjectsWidgetState {
	linked: boolean;
	selectedProject: string | null;
	[key: string]: unknown;
}

const DEFAULT_STATE: ProjectsWidgetState = {
	linked: true,
	selectedProject: null,
};

export class ProjectsWidgetView extends BaseWidgetView<ProjectsWidgetState> {
	private projectContainerEl?: HTMLElement;
	private tasks: Task[] = [];
	private projectStats: ProjectStats[] = [];

	private refreshScheduled = debounce(() => {
		void this.refreshTasks();
	}, 500);

	constructor(leaf: WorkspaceLeaf, plugin: TaskProgressBarPlugin) {
		super(leaf, plugin, { ...DEFAULT_STATE });
	}

	getViewType(): string {
		return PROJECTS_WIDGET_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Projects Widget";
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

	protected onGlobalFilterChanged(_state: GlobalFilterState): void {
		this.renderProjects();
	}

	protected async render(): Promise<void> {
		const bodyEl = this.getBodyEl();

		if (!this.projectContainerEl) {
			bodyEl.empty();
			this.projectContainerEl = bodyEl.createDiv({
				cls: "tg-projects-container",
			});
		}

		await this.refreshTasks();
	}

	private async refreshTasks(): Promise<void> {
		const queryAPI = this.plugin.dataflowOrchestrator?.getQueryAPI();
		if (!queryAPI) {
			this.projectContainerEl?.empty();
			this.projectContainerEl?.createDiv({
				cls: "tg-widget-empty",
				text: "Dataflow is not available",
			});
			return;
		}

		this.tasks = await queryAPI.getAllTasks();
		this.projectStats = this.aggregateProjects(this.tasks);
		this.renderProjects();
	}

	private aggregateProjects(tasks: Task[]): ProjectStats[] {
		const projectMap = new Map<string, ProjectStats>();
		const now = new Date();
		now.setHours(0, 0, 0, 0);

		for (const task of tasks) {
			const projectName = task.metadata.project ?? "No Project";

			if (!projectMap.has(projectName)) {
				projectMap.set(projectName, {
					name: projectName,
					total: 0,
					completed: 0,
					overdue: 0,
					tasks: [],
				});
			}

			const stats = projectMap.get(projectName)!;
			stats.total++;
			stats.tasks.push(task);

			if (task.completed) {
				stats.completed++;
			} else if (task.metadata.dueDate) {
				const dueDate = new Date(task.metadata.dueDate);
				dueDate.setHours(0, 0, 0, 0);
				if (dueDate < now) {
					stats.overdue++;
				}
			}
		}

		return Array.from(projectMap.values()).sort((a, b) => {
			if (a.name === "No Project") return 1;
			if (b.name === "No Project") return -1;
			const aProgress = a.total > 0 ? a.completed / a.total : 0;
			const bProgress = b.total > 0 ? b.completed / b.total : 0;
			if (aProgress !== bProgress) {
				return aProgress - bProgress;
			}
			return b.total - a.total;
		});
	}

	private renderProjects(): void {
		if (!this.projectContainerEl) return;
		this.projectContainerEl.empty();

		const layoutMode = this.getLayoutMode();

		if (this.projectStats.length === 0) {
			this.projectContainerEl.createDiv({
				cls: "tg-widget-empty",
				text: "No projects",
			});
			return;
		}

		const gridEl = this.projectContainerEl.createDiv({
			cls: `tg-projects-grid tg-projects-grid-${layoutMode}`,
		});

		for (const project of this.projectStats) {
			this.renderProjectCard(gridEl, project);
		}
	}

	private renderProjectCard(
		container: HTMLElement,
		project: ProjectStats,
	): void {
		const isSelected = this.state.selectedProject === project.name;
		const progress =
			project.total > 0
				? Math.round((project.completed / project.total) * 100)
				: 0;

		const cardEl = container.createDiv({
			cls: `tg-projects-card ${isSelected ? "is-selected" : ""}`,
		});

		const headerEl = cardEl.createDiv({ cls: "tg-projects-card-header" });

		headerEl.createDiv({
			cls: "tg-projects-card-name",
			text: project.name,
		});

		if (project.overdue > 0) {
			headerEl.createSpan({
				cls: "tg-projects-card-overdue",
				text: `${project.overdue} overdue`,
			});
		}

		const progressContainerEl = cardEl.createDiv({
			cls: "tg-projects-card-progress",
		});

		const progressTrackEl = progressContainerEl.createDiv({
			cls: "tg-projects-progress-track",
		});

		const progressFillEl = progressTrackEl.createDiv({
			cls: "tg-projects-progress-fill",
		});
		progressFillEl.style.width = `${progress}%`;

		if (progress === 100) {
			progressFillEl.addClass("is-complete");
		} else if (project.overdue > 0) {
			progressFillEl.addClass("has-overdue");
		}

		const statsEl = cardEl.createDiv({ cls: "tg-projects-card-stats" });

		statsEl.createSpan({
			cls: "tg-projects-card-stat",
			text: `${project.completed}/${project.total} tasks`,
		});

		statsEl.createSpan({
			cls: "tg-projects-card-percent",
			text: `${progress}%`,
		});

		this.registerDomEvent(cardEl, "click", () => {
			this.selectProject(project.name);
		});
	}

	private selectProject(projectName: string): void {
		const newSelection =
			this.state.selectedProject === projectName ? null : projectName;

		this.updateWidgetState({ selectedProject: newSelection });

		if (this.state.linked && newSelection) {
			globalFilterContext.setState({ projects: [newSelection] });
		} else if (this.state.linked) {
			globalFilterContext.setState({ projects: [] });
		}
	}
}
