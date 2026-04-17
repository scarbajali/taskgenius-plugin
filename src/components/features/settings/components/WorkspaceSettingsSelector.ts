import { Menu, setIcon } from "obsidian";
import type TaskProgressBarPlugin from "@/index";
import { WorkspaceData } from "@/types/workspace";
import { t } from "@/translations/helper";
import { TaskProgressBarSettingTab } from "@/setting";

export class WorkspaceSettingsSelector {
	private containerEl: HTMLElement;
	private plugin: TaskProgressBarPlugin;
	private settingTab: TaskProgressBarSettingTab;
	private currentWorkspaceId: string;
	private buttonEl: HTMLElement;

	constructor(
		containerEl: HTMLElement,
		plugin: TaskProgressBarPlugin,
		settingTab: TaskProgressBarSettingTab
	) {
		this.containerEl = containerEl;
		this.plugin = plugin;
		this.settingTab = settingTab;
		this.currentWorkspaceId =
			plugin.workspaceManager?.getActiveWorkspace().id || "";

		this.render();
	}

	private render() {
		// Create workspace selector container
		const selectorContainer = this.containerEl.createDiv({
			cls: "workspace-settings-selector",
		});

		if (!this.plugin.workspaceManager) return;

		const currentWorkspace =
			this.plugin.workspaceManager.getActiveWorkspace();

		this.buttonEl = selectorContainer.createDiv({
			cls: "workspace-settings-selector-button",
		});

		// Workspace icon
		const workspaceIcon = this.buttonEl.createDiv({
			cls: "workspace-icon",
		});
		setIcon(workspaceIcon, currentWorkspace.icon || "layers");

		// Workspace name
		const workspaceName = this.buttonEl.createSpan({
			cls: "workspace-name",
			text: currentWorkspace.name,
		});

		// Dropdown arrow
		const dropdownIcon = this.buttonEl.createDiv({
			cls: "workspace-dropdown-icon",
		});
		setIcon(dropdownIcon, "chevron-down");

		// Click handler
		this.buttonEl.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.showWorkspaceMenu(e);
		});
	}

	private showWorkspaceMenu(event: MouseEvent) {
		if (!this.plugin.workspaceManager) return;

		const menu = new Menu();
		const workspaces = this.plugin.workspaceManager.getAllWorkspaces();
		const currentWorkspace =
			this.plugin.workspaceManager.getActiveWorkspace();

		// Add workspace items for switching
		workspaces.forEach((workspace) => {
			menu.addItem((item) => {
				item.setTitle(workspace.name)
					.setIcon(workspace.icon || "layers")
					.onClick(async () => {
						await this.switchWorkspace(workspace.id);
					});

				// Mark current workspace with checkmark
				if (workspace.id === currentWorkspace.id) {
					item.setChecked(true);
				}
			});
		});

		// Add separator
		menu.addSeparator();

		// Add "Manage Workspaces..." option to navigate to settings
		menu.addItem((item) => {
			item.setTitle(t("Manage Workspaces..."))
				.setIcon("settings")
				.onClick(() => {
					// Navigate to workspace settings tab
					this.settingTab.switchToTab("workspaces");
				});
		});

		menu.showAtMouseEvent(event);
	}

	private async switchWorkspace(workspaceId: string) {
		if (!this.plugin.workspaceManager) return;

		// Switch workspace
		await this.plugin.workspaceManager.setActiveWorkspace(workspaceId);
		this.currentWorkspaceId = workspaceId;

		// Update button display
		this.updateDisplay();

		// Trigger settings reload to reflect workspace change
		await this.plugin.saveSettings();
		this.settingTab.applySettingsUpdate();
	}

	private updateDisplay() {
		if (!this.plugin.workspaceManager || !this.buttonEl) return;

		const currentWorkspace =
			this.plugin.workspaceManager.getActiveWorkspace();

		// Update icon
		const iconEl = this.buttonEl.querySelector(".workspace-icon");
		if (iconEl) {
			iconEl.empty();
			setIcon(iconEl as HTMLElement, currentWorkspace.icon || "layers");
		}

		// Update name
		const nameEl = this.buttonEl.querySelector(".workspace-name");
		if (nameEl) {
			nameEl.textContent = currentWorkspace.name;
		}
	}

	public setWorkspace(workspaceId: string) {
		this.currentWorkspaceId = workspaceId;
		this.updateDisplay();
	}
}
