/**
 * Group By feature type definitions
 */

import { Task } from "./task";
import { TaskListRendererComponent } from "@/components/features/task/view/TaskList";

/**
 * Available grouping dimensions for tasks
 */
export type GroupByDimension =
	| "none"           // No grouping
	| "filePath"       // Group by file path
	| "dueDate"        // Group by due date buckets
	| "priority"       // Group by priority level
	| "project"        // Group by project
	| "tags"           // Group by tags
	| "status";        // Group by task status

/**
 * A group of tasks with shared characteristics
 * Similar to DateSection from forecast view
 * Supports nested grouping structure (e.g., folder -> file)
 */
export interface TaskGroup {
	/** Display title for the group */
	title: string;

	/** Unique key for this group */
	key: string;

	/** Sort order for group arrangement */
	sortOrder: number;

	/** Tasks in this group */
	tasks: Task[];

	/** Whether the group is expanded or collapsed */
	isExpanded: boolean;

	/** Renderer component for this group's tasks */
	renderer?: TaskListRendererComponent;

	/** Child groups for nested grouping (e.g., files under a folder) */
	children?: TaskGroup[];

	/** Nesting level (0 = top level, 1 = first nested level, etc.) */
	level?: number;

	/** Parent group key for tracking hierarchy */
	parentKey?: string;
}

/**
 * Group By configuration for a view
 */
export interface GroupByConfig {
	viewId: string;
	dimension: GroupByDimension;
}

/**
 * Options for group display
 */
export interface GroupByOption {
	value: GroupByDimension;
	label: string;
	icon?: string;
	description?: string;
}
