import { Setting, Notice } from "obsidian";
import { TaskProgressBarSettingTab } from "@/setting";
import { t } from "@/translations/helper";
import { FluentViewSettings } from "@/common/setting-definition";

export function renderInterfaceSettingsTab(
	settingTab: TaskProgressBarSettingTab,
	containerEl: HTMLElement,
) {
	// Header
	new Setting(containerEl)
		.setName(t("User Interface"))
		.setDesc(t("Configure how Task Genius displays in your workspace."))
		.setHeading();

	// Fluent Interface Settings
	new Setting(containerEl)
		.setName(t("Interface Settings"))
		.setDesc(t("Configure options for the Task Genius interface."))
		.setHeading();

	// Use workspace side leaves for Sidebar & Details
	new Setting(containerEl)
		.setName(t("Use workspace side leaves"))
		.setDesc(
			t(
				"Use left/right workspace side leaves for Sidebar and Details. When enabled, the main view won't render in-view sidebar or details.",
			),
		)
		.addToggle((toggle) => {
			const current =
				settingTab.plugin.settings.fluentView?.useWorkspaceSideLeaves ??
				false;
			toggle.setValue(current).onChange(async (value) => {
				if (!settingTab.plugin.settings.fluentView) {
					settingTab.plugin.settings.fluentView = {
						enableFluent: true,
					};
				}
				if (!settingTab.plugin.settings.fluentView.fluentConfig) {
					settingTab.plugin.settings.fluentView.fluentConfig = {
						enableWorkspaces: true,
						defaultWorkspace: "default",
					};
				}
				(
					settingTab.plugin.settings.fluentView as FluentViewSettings
				).useWorkspaceSideLeaves = value;
				await settingTab.plugin.saveSettings();
				new Notice(t("Saved. Reopen the view to apply."));
			});
		});

	// Max Other Views before overflow threshold
	new Setting(containerEl)
		.setName(t("Max other views before overflow"))
		.setDesc(
			t(
				"Number of 'Other Views' to show before grouping the rest into an overflow menu (ellipsis)",
			),
		)
		.addText((text) => {
			const current =
				settingTab.plugin.settings.fluentView?.fluentConfig
					?.maxOtherViewsBeforeOverflow ?? 5;
			text.setPlaceholder("5")
				.setValue(String(current))
				.onChange(async (value) => {
					const n = parseInt(value, 10);
					if (!isNaN(n) && n >= 1 && n <= 50) {
						if (!settingTab.plugin.settings.fluentView) {
							settingTab.plugin.settings.fluentView = {
								enableFluent: true,
							};
						}
						if (
							!settingTab.plugin.settings.fluentView.fluentConfig
						) {
							settingTab.plugin.settings.fluentView.fluentConfig =
								{
									enableWorkspaces: true,
									defaultWorkspace: "default",
								};
						}
						settingTab.plugin.settings.fluentView.fluentConfig.maxOtherViewsBeforeOverflow =
							n;
						await settingTab.plugin.saveSettings();
					}
				});
		});
}
