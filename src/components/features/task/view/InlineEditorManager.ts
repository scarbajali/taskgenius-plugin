import { App, Component } from "obsidian";
import { Task } from "@/types/task";
import TaskProgressBarPlugin from "@/index";
import { InlineEditor, InlineEditorOptions } from "./InlineEditor";

/**
 * Manages InlineEditor instances with lazy initialization and pooling
 * to improve performance when rendering many tasks
 *
 * Performance optimizations:
 * - Object pooling to reduce GC pressure
 * - Lazy initialization
 * - Memory-efficient editor reuse
 * - Automatic cleanup of unused editors
 */
export class InlineEditorManager extends Component {
	private editorPool: InlineEditor[] = [];
	private activeEditors = new Map<string, InlineEditor>();
	private maxPoolSize = 3; // Reduced pool size for better memory usage
	private lastCleanupTime = 0;
	private cleanupInterval = 30000; // 30 seconds

	// Performance tracking
	private stats = {
		editorsCreated: 0,
		editorsReused: 0,
		editorsDestroyed: 0,
	};

	constructor(private app: App, private plugin: TaskProgressBarPlugin) {
		super();
	}

	/**
	 * Get or create an InlineEditor for a task
	 * Uses pooling to reuse editor instances
	 */
	public getEditor(task: Task, options: InlineEditorOptions): InlineEditor {
		// Check if we already have an active editor for this task
		const existingEditor = this.activeEditors.get(task.id);
		if (existingEditor) {
			// Update the existing editor with new options if needed
			if (this.shouldUpdateEditor(existingEditor, options)) {
				existingEditor.updateTask(task, options);
			}
			return existingEditor;
		}

		// Periodic cleanup of unused editors
		this.performPeriodicCleanup();

		// Try to get an editor from the pool
		let editor = this.editorPool.pop();

		if (!editor) {
			// Create new editor if pool is empty
			editor = this.createNewEditor(task, options);
			this.stats.editorsCreated++;
		} else {
			// Reuse pooled editor with new task and options
			editor.updateTask(task, options);
			this.stats.editorsReused++;
		}

		// Track active editor
		this.activeEditors.set(task.id, editor);

		return editor;
	}

	/**
	 * Return an editor to the pool when no longer needed
	 */
	public releaseEditor(taskId: string): void {
		const editor = this.activeEditors.get(taskId);
		if (!editor) return;

		// Remove from active editors
		this.activeEditors.delete(taskId);

		// Don't pool editors that are currently editing
		if (editor.isCurrentlyEditing()) {
			// Destroy the editor if it's still editing (safety measure)
			this.destroyEditor(editor);
			return;
		}

		// Reset editor state
		editor.reset();

		// Return to pool if not full
		if (this.editorPool.length < this.maxPoolSize) {
			this.editorPool.push(editor);
		} else {
			// Pool is full, destroy the editor
			this.destroyEditor(editor);
		}
	}

	/**
	 * Force release an editor (useful for cleanup)
	 */
	public forceReleaseEditor(taskId: string): void {
		const editor = this.activeEditors.get(taskId);
		if (!editor) return;

		// Remove from active editors
		this.activeEditors.delete(taskId);

		// Always destroy when force releasing
		this.destroyEditor(editor);
	}

	/**
	 * Check if a task has an active editor
	 */
	public hasActiveEditor(taskId: string): boolean {
		return this.activeEditors.has(taskId);
	}

	/**
	 * Get the active editor for a task if it exists
	 */
	public getActiveEditor(taskId: string): InlineEditor | undefined {
		return this.activeEditors.get(taskId);
	}

	/**
	 * Release all active editors (useful for cleanup)
	 */
	public releaseAllEditors(): void {
		const taskIds = Array.from(this.activeEditors.keys());
		for (const taskId of taskIds) {
			this.releaseEditor(taskId);
		}
	}

	/**
	 * Force release all editors and clear pools
	 */
	public forceReleaseAllEditors(): void {
		// Force release all active editors
		const taskIds = Array.from(this.activeEditors.keys());
		for (const taskId of taskIds) {
			this.forceReleaseEditor(taskId);
		}

		// Clear and destroy pooled editors
		for (const editor of this.editorPool) {
			this.destroyEditor(editor);
		}
		this.editorPool = [];
	}

	/**
	 * Get performance statistics
	 */
	public getStats() {
		return {
			...this.stats,
			activeEditors: this.activeEditors.size,
			pooledEditors: this.editorPool.length,
			totalMemoryUsage: this.activeEditors.size + this.editorPool.length,
		};
	}

	/**
	 * Reset performance statistics
	 */
	public resetStats(): void {
		this.stats = {
			editorsCreated: 0,
			editorsReused: 0,
			editorsDestroyed: 0,
		};
	}

	private createNewEditor(
		task: Task,
		options: InlineEditorOptions
	): InlineEditor {
		const editor = new InlineEditor(this.app, this.plugin, task, options);
		this.addChild(editor);
		return editor;
	}

	private destroyEditor(editor: InlineEditor): void {
		this.removeChild(editor);
		editor.unload();
		this.stats.editorsDestroyed++;
	}

	private shouldUpdateEditor(
		editor: InlineEditor,
		newOptions: InlineEditorOptions
	): boolean {
		// Simple heuristic: always update if the editor is not currently editing
		// In a more sophisticated implementation, we could compare options
		return !editor.isCurrentlyEditing();
	}

	private performPeriodicCleanup(): void {
		const now = Date.now();
		if (now - this.lastCleanupTime < this.cleanupInterval) {
			return;
		}

		this.lastCleanupTime = now;

		// Clean up any editors that might be stuck in editing state
		const stuckEditors: string[] = [];
		for (const [taskId, editor] of this.activeEditors) {
			// If an editor has been editing for too long, consider it stuck
			if (editor.isCurrentlyEditing()) {
				// In a real implementation, you might want to track edit start time
				// For now, we'll just log it
				console.warn(
					`Editor for task ${taskId} appears to be stuck in editing state`
				);
			}
		}

		// Optionally reduce pool size if we have too many unused editors
		if (this.editorPool.length > this.maxPoolSize) {
			const excessEditors = this.editorPool.splice(this.maxPoolSize);
			for (const editor of excessEditors) {
				this.destroyEditor(editor);
			}
		}
	}

	onload() {
		// Initialize any necessary resources
		this.lastCleanupTime = Date.now();
	}

	onunload() {
		// Clean up all active editors
		this.forceReleaseAllEditors();
	}
}
