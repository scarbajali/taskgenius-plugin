import type { ItemView, WorkspaceLeaf } from "obsidian";
import type TaskProgressBarPlugin from "@/index";

export interface WidgetDefinition {
	viewType: string;
	displayName: string;
	icon?: string;
	commandId: string;
	openLocation?: "right" | "left" | "tab";
	create: (leaf: WorkspaceLeaf, plugin: TaskProgressBarPlugin) => ItemView;
}

export class WidgetFactory {
	private registry = new Map<string, WidgetDefinition>();

	register(definition: WidgetDefinition): void {
		if (this.registry.has(definition.viewType)) {
			throw new Error(`Widget already registered: ${definition.viewType}`);
		}
		this.registry.set(definition.viewType, definition);
	}

	list(): WidgetDefinition[] {
		return Array.from(this.registry.values());
	}
}
