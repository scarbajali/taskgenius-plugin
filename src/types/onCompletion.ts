/**
 * OnCompletion action types and configuration interfaces
 */
import { Task } from "@/types/task";
import TaskProgressBarPlugin from "@/index";
import { App } from "obsidian";

export enum OnCompletionActionType {
	DELETE = 'delete',
	KEEP = 'keep',
	COMPLETE = 'complete',
	MOVE = 'move',
	ARCHIVE = 'archive',
	DUPLICATE = 'duplicate'
}

export interface OnCompletionDeleteConfig {
	type: OnCompletionActionType.DELETE;
}

export interface OnCompletionKeepConfig {
	type: OnCompletionActionType.KEEP;
}

export interface OnCompletionCompleteConfig {
	type: OnCompletionActionType.COMPLETE;
	taskIds: string[];
}

export interface OnCompletionMoveConfig {
	type: OnCompletionActionType.MOVE;
	targetFile: string;
	targetSection?: string;
}

export interface OnCompletionArchiveConfig {
	type: OnCompletionActionType.ARCHIVE;
	archiveFile?: string;
	archiveSection?: string;
}

export interface OnCompletionDuplicateConfig {
	type: OnCompletionActionType.DUPLICATE;
	targetFile?: string;
	targetSection?: string;
	preserveMetadata?: boolean;
}

export type OnCompletionConfig =
	| OnCompletionDeleteConfig
	| OnCompletionKeepConfig
	| OnCompletionCompleteConfig
	| OnCompletionMoveConfig
	| OnCompletionArchiveConfig
	| OnCompletionDuplicateConfig;

export interface OnCompletionExecutionContext {
	task: Task;
	plugin: TaskProgressBarPlugin;
	app: App;
}

export interface OnCompletionExecutionResult {
	success: boolean;
	error?: string;
	message?: string;
}

export interface OnCompletionParseResult {
	config: OnCompletionConfig | null;
	rawValue: string;
	isValid: boolean;
	error?: string;
}
