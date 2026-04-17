import {
	debounce,
	type App,
	type TFile,
	type Vault,
	type MetadataCache,
	type EventRef,
	Component,
} from "obsidian";
import { Events, emit, on } from "../events/Events";

/**
 * ObsidianSource - Independent event source management
 *
 * This component manages all Obsidian vault events and transforms them into
 * standardized internal events. It provides:
 * - Unified debouncing and batch merging
 * - Event transformation and filtering
 * - Independent lifecycle management
 */
export class ObsidianSource extends Component {
	private app: App;
	private vault: Vault;
	private metadataCache: MetadataCache;

	// Event references for cleanup
	private eventRefs: EventRef[] = [];

	// Debouncing configuration
	private readonly DEBOUNCE_DELAY = 300; // ms
	private readonly BATCH_DELAY = 150; // ms for batch operations

	// Debouncing maps (use Obsidian's debounce per path)
	private pendingFileChanges = new Map<string, () => void>();
	private pendingMetadataChanges = new Map<string, () => void>();
	private pendingBatch = new Set<string>();
	private debouncedBatch: (() => void) | null = null;

	// Event filtering
	private readonly IGNORED_EXTENSIONS = new Set([".tmp", ".swp", ".log"]);
	private readonly RELEVANT_EXTENSIONS = new Set(["md", "canvas"]);

	// Skip modification tracking for WriteAPI operations
	private skipNextModify = new Set<string>();

	constructor(app: App, vault: Vault, metadataCache: MetadataCache) {
		super();
		this.app = app;
		this.vault = vault;
		this.metadataCache = metadataCache;
	}

	onload(): void {
		this.initialize();
	}

	/**
	 * Initialize event subscriptions
	 */
	initialize(): void {
		console.log("ObsidianSource: Initializing event subscriptions");

		this.registerEvent(
			on(this.app, Events.WRITE_OPERATION_START, ({ path }) => {
				this.skipNextModify.add(path);
				// Auto cleanup after 5 seconds to prevent memory leaks
				setTimeout(() => this.skipNextModify.delete(path), 5000);
			})
		);

		this.registerEvent(
			on(this.app, Events.WRITE_OPERATION_COMPLETE, ({ path }) => {
				// Delay cleanup slightly to ensure metadata changes are also skipped
				setTimeout(() => {
					this.skipNextModify.delete(path);
				}, 100);
			})
		);

		this.registerEvent(this.vault.on("create", this.onFileCreate.bind(this)))
		this.registerEvent(this.vault.on("modify", this.onFileModify.bind(this)))
		this.registerEvent(this.vault.on("delete", this.onFileDelete.bind(this)))
		this.registerEvent(this.vault.on("rename", this.onFileRename.bind(this)))

		this.registerEvent(this.metadataCache.on("changed", this.onMetadataChange.bind(this)))
		this.registerEvent(this.metadataCache.on("resolve", this.onMetadataResolve.bind(this)))

		console.log(
			`ObsidianSource: Subscribed to ${this.eventRefs.length} event types`
		);
	}

	/**
	 * Handle file creation
	 */
	private onFileCreate(file: TFile): void {
		if (!this.app.workspace.layoutReady) {
			return;
		}

		if (!this.isRelevantFile(file)) {
			return;
		}

		console.log(`ObsidianSource: File created - ${file.path}`);

		// Emit immediate event for file creation
		emit(this.app, Events.FILE_UPDATED, {
			path: file.path,
			reason: "create",
			timestamp: Date.now(),
		});
	}

	/**
	 * Handle file modification with debouncing
	 */
	private onFileModify(file: TFile): void {
		if (!this.isRelevantFile(file)) {
			return;
		}

		// Skip if this modification is from WriteAPI
		// The WriteAPI will emit WRITE_OPERATION_COMPLETE event which is handled by Orchestrator
		if (this.skipNextModify.has(file.path)) {
			this.skipNextModify.delete(file.path);
			console.log(
				`ObsidianSource: Skipping modify event for ${file.path} (handled by WriteAPI)`
			);
			return;
		}

		// Debounced emit per path using Obsidian's debounce
		let debounced = this.pendingFileChanges.get(file.path);
		if (!debounced) {
			debounced = debounce(
				() => {
					this.emitFileUpdated(file.path, "modify");
				},
				this.DEBOUNCE_DELAY,
				false
			);
			this.pendingFileChanges.set(file.path, debounced);
		}
		debounced();
	}

	/**
	 * Handle file deletion
	 */
	private onFileDelete(file: TFile): void {
		if (!this.isRelevantFile(file)) {
			return;
		}

		console.log(`ObsidianSource: File deleted - ${file.path}`);

		// Clear any pending debounced action for this file (drop reference)
		if (this.pendingFileChanges.has(file.path)) {
			this.pendingFileChanges.delete(file.path);
		}

		// Emit immediate event for file deletion
		emit(this.app, Events.FILE_UPDATED, {
			path: file.path,
			reason: "delete",
			timestamp: Date.now(),
		});
	}

	/**
	 * Handle file rename/move
	 */
	private onFileRename(file: TFile, oldPath: string): void {
		if (!this.isRelevantFile(file)) {
			return;
		}

		console.log(
			`ObsidianSource: File renamed - ${oldPath} -> ${file.path}`
		);

		// Clear any pending debounced action for the old path (drop reference)
		if (this.pendingFileChanges.has(oldPath)) {
			this.pendingFileChanges.delete(oldPath);
		}

		// Emit immediate events for both old and new paths
		emit(this.app, Events.FILE_UPDATED, {
			path: oldPath,
			reason: "delete",
			timestamp: Date.now(),
		});

		emit(this.app, Events.FILE_UPDATED, {
			path: file.path,
			reason: "rename",
			timestamp: Date.now(),
		});
	}

	/**
	 * Handle metadata changes with debouncing
	 */
	private onMetadataChange(file: TFile): void {
		if (!this.isRelevantFile(file)) {
			return;
		}

		// Skip if this metadata change is from WriteAPI
		// WriteAPI operations can trigger metadata changes, but we handle them via TASK_UPDATED
		if (this.skipNextModify.has(file.path)) {
			console.log(
				`ObsidianSource: Skipping metadata change for ${file.path} (handled by WriteAPI)`
			);
			return;
		}

		// Debounced emit per path using Obsidian's debounce
		let debounced = this.pendingMetadataChanges.get(file.path);
		if (!debounced) {
			debounced = debounce(
				() => {
					this.emitFileUpdated(file.path, "frontmatter");
				},
				this.DEBOUNCE_DELAY,
				false
			);
			this.pendingMetadataChanges.set(file.path, debounced);
		}
		debounced();
	}

	/**
	 * Handle metadata resolution (usually after initial scan)
	 */
	private onMetadataResolve(file: TFile): void {
		if (!this.isRelevantFile(file)) {
			return;
		}

		// Add to batch for bulk processing
		this.addToBatch(file.path);
	}

	/**
	 * Add file to batch processing queue
	 */
	private addToBatch(filePath: string): void {
		this.pendingBatch.add(filePath);

		// Debounced batch processing using Obsidian's debounce
		if (!this.debouncedBatch) {
			this.debouncedBatch = debounce(
				() => this.processBatch(),
				this.BATCH_DELAY,
				false
			);
		}
		this.debouncedBatch();
	}

	/**
	 * Process accumulated batch of file changes
	 */
	private processBatch(): void {
		if (this.pendingBatch.size === 0) {
			return;
		}

		const files = Array.from(this.pendingBatch);
		this.pendingBatch.clear();

		console.log(
			`ObsidianSource: Processing batch of ${files.length} files`
		);

		// Emit batch update event
		emit(this.app, Events.TASK_CACHE_UPDATED, {
			changedFiles: files,
			stats: {
				total: files.length,
				changed: files.length,
			},
			timestamp: Date.now(),
			seq: Date.now(), // Events module will handle proper sequence numbering
		});
	}

	/**
	 * Emit a file updated event
	 */
	private emitFileUpdated(
		filePath: string,
		reason: "modify" | "frontmatter" | "create" | "delete" | "rename"
	): void {
		console.log(
			`ObsidianSource: Emitting file update - ${filePath} (${reason})`
		);

		emit(this.app, Events.FILE_UPDATED, {
			path: filePath,
			reason,
			timestamp: Date.now(),
		});
	}

	/**
	 * Check if a file is relevant for task processing
	 */
	private isRelevantFile(file: TFile): boolean {
		// Skip non-files
		if (!file || typeof file.path !== "string") {
			return false;
		}

		// Skip files with ignored extensions
		const extension = file.extension?.toLowerCase();
		if (!extension || this.IGNORED_EXTENSIONS.has(`.${extension}`)) {
			return false;
		}

		// Only process relevant file types
		if (!this.RELEVANT_EXTENSIONS.has(extension)) {
			return false;
		}

		// Skip system/hidden files
		if (file.path.startsWith(".") || file.path.includes("/.")) {
			return false;
		}

		return true;
	}

	/**
	 * Manually trigger processing of specific files (for testing or recovery)
	 */
	triggerFileUpdate(
		filePath: string,
		reason:
			| "modify"
			| "frontmatter"
			| "create"
			| "delete"
			| "rename" = "modify"
	): void {
		this.emitFileUpdated(filePath, reason);
	}

	/**
	 * Trigger batch processing of multiple files
	 */
	triggerBatchUpdate(filePaths: string[]): void {
		if (filePaths.length === 0) {
			return;
		}

		console.log(
			`ObsidianSource: Manual batch trigger for ${filePaths.length} files`
		);

		emit(this.app, Events.TASK_CACHE_UPDATED, {
			changedFiles: filePaths,
			stats: {
				total: filePaths.length,
				changed: filePaths.length,
			},
			timestamp: Date.now(),
			seq: Date.now(),
		});
	}

	/**
	 * Force flush all pending debounced changes
	 */
	flush(): void {
		console.log("ObsidianSource: Flushing all pending changes");

		// Process all pending file changes (invoke immediately and drop references)
		for (const filePath of Array.from(this.pendingFileChanges.keys())) {
			this.pendingFileChanges.delete(filePath);
			this.emitFileUpdated(filePath, "modify");
		}

		// Process all pending metadata changes (invoke immediately and drop references)
		for (const filePath of Array.from(this.pendingMetadataChanges.keys())) {
			this.pendingMetadataChanges.delete(filePath);
			this.emitFileUpdated(filePath, "frontmatter");
		}

		// Process pending batch immediately
		this.processBatch();
	}

	/**
	 * Get statistics about pending operations
	 */
	getStats() {
		return {
			pendingFileChanges: this.pendingFileChanges.size,
			pendingMetadataChanges: this.pendingMetadataChanges.size,
			pendingBatchSize: this.pendingBatch.size,
			hasBatchDebounce: this.debouncedBatch !== null,
		};
	}

	/**
	 * Cleanup resources and unsubscribe from events
	 */
	destroy(): void {
		console.log("ObsidianSource: Cleaning up event subscriptions");

		// Drop references to all pending debounced actions
		this.pendingFileChanges.clear();
		this.pendingMetadataChanges.clear();
		this.debouncedBatch = null;
		this.pendingBatch.clear();

		console.log("ObsidianSource: Cleanup complete");


		this.unload();
	}
}
