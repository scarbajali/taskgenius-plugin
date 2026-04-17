/**
 * MCP (Model Context Protocol) Type Definitions
 */

import { Task } from "../../types/task";

export interface McpServerConfig {
	enabled: boolean;
	port: number;
	host: string;
	authToken: string;
	enableCors: boolean;
	logLevel: "debug" | "info" | "warn" | "error";
}

export interface McpToolRequest {
	tool: string;
	arguments: Record<string, any>;
}

export interface McpToolResponse {
	content: Array<{
		type: "text" | "resource";
		text?: string;
		resource?: any;
	}>;
	isError?: boolean;
}

/**
 * Common field selection for reducing response size
 * Supports dot notation for nested fields (e.g., "metadata.priority")
 */
export type FieldSelection = string[];

export interface QueryTasksArgs {
	filter?: {
		completed?: boolean;
		project?: string;
		context?: string;
		priority?: number;
		tags?: string[];
	};
	limit?: number;
	offset?: number;
	sort?: {
		field: keyof Task;
		order: "asc" | "desc";
	};
	/** Only return specified fields to reduce token usage */
	fields?: FieldSelection;
}

export interface UpdateTaskArgs {
	taskId: string;
	updates: Partial<Task>;
}

export interface DeleteTaskArgs {
	taskId: string;
}

export interface CreateTaskArgs {
	content: string;
	filePath?: string;
	project?: string;
	context?: string;
	priority?: number;
	dueDate?: string;
	startDate?: string;
	tags?: string[];
	parent?: string;
	completed?: boolean;
	completedDate?: string;
}

export interface BatchUpdateTextArgs {
	taskIds: string[];
	findText: string;
	replaceText: string;
}

export interface BatchCreateSubtasksArgs {
	parentTaskId: string;
	subtasks: Array<{
		content: string;
		priority?: number;
		dueDate?: string;
	}>;
}

export interface SearchTasksArgs {
	query: string;
	limit?: number;
	searchIn?: ("content" | "tags" | "project" | "context")[];
	fields?: FieldSelection;
}

export interface QueryByDateArgs {
	dateType: "due" | "start" | "scheduled" | "completed";
	from?: string;
	to?: string;
	limit?: number;
	fields?: FieldSelection;
}

// Meta tool types for dynamic tool discovery
export interface McpListToolsArgs {
	category?: "query" | "write" | "batch" | "meta" | "all";
}

export interface McpGetToolSchemaArgs {
	toolName: string;
}

export interface McpToolSummary {
	name: string;
	title: string;
	description: string;
	category: "query" | "write" | "batch" | "meta";
}

export interface BatchCreateTasksArgs {
	tasks: Array<{
		content: string;
		filePath?: string;
		project?: string;
		context?: string;
		priority?: number;
		dueDate?: string;
		startDate?: string;
		tags?: string[];
		parent?: string;
		completed?: boolean;
		completedDate?: string;
	}>;
	defaultFilePath?: string;
}

export interface McpServerStatus {
	running: boolean;
	port?: number;
	startTime?: Date;
	requestCount?: number;
	lastError?: string;
}
