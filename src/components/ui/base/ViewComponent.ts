import { App, Component } from "obsidian";
import TaskProgressBarPlugin from "@/index";
import { Task } from "@/types/task";
import { ViewMode } from "@/common/setting-definition";

/**
 * Base class for view components to unify common behaviors across special views
 * (kanban, calendar, gantt, forecast, quadrant, table, twocolumn, ...)
 *
 * Note: Intentionally minimal and non-invasive so existing components can
 * progressively migrate to extend this class without large refactors.
 */
export abstract class ViewComponent<TOverride = any> extends Component {
  protected app: App;
  protected plugin: TaskProgressBarPlugin;
  protected currentViewId: string;
  protected configOverride: Partial<TOverride> | null = null;

  constructor(app: App, plugin: TaskProgressBarPlugin, viewId: string) {
    super();
    this.app = app;
    this.plugin = plugin;
    this.currentViewId = viewId;
  }

  /**
   * Inject per-view override configuration (e.g., from Bases view config)
   * Subclasses should merge this with their own config and refresh UI if needed.
   */
  public setConfigOverride(override: Partial<TOverride> | null): void {
    this.configOverride = override ?? null;
  }

  /** Optional hooks for specific view components to implement */
  // Provide tasks to the component (filteredTasks, allTasks, forceRefresh?)
  public setTasks(_tasks: Task[], _allTasks?: Task[], _forceRefresh?: boolean): void {}

  // Update tasks incrementally (some components expose this instead of setTasks)
  public updateTasks(_tasks: Task[]): void {}

  // Switch internal mode (some views support different modes within the same component)
  public setViewMode(_viewMode: ViewMode, _project?: string | null): void {}
}

