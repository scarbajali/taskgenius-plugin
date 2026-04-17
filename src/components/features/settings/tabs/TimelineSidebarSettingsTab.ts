import { Setting, Notice } from "obsidian";
import { TaskProgressBarSettingTab } from "@/setting";
import { t } from "@/translations/helper";

export function renderTimelineSidebarSettingsTab(
	settingTab: TaskProgressBarSettingTab,
	containerEl: HTMLElement
) {
	new Setting(containerEl).setName(t("Timeline Sidebar")).setHeading();

	new Setting(containerEl)
		.setName(t("Enable Timeline Sidebar"))
		.setDesc(
			t(
				"Toggle this to enable the timeline sidebar view for quick access to your daily events and tasks."
			)
		)
		.addToggle((toggle) =>
			toggle
				.setValue(
					settingTab.plugin.settings.timelineSidebar
						.enableTimelineSidebar
				)
				.onChange(async (value) => {
					settingTab.plugin.settings.timelineSidebar.enableTimelineSidebar =
						value;
					settingTab.applySettingsUpdate();

					setTimeout(() => {
						settingTab.display();
						if (value) {
							settingTab.plugin.activateTimelineSidebarView();
						}
					}, 200);
				})
		);

	if (!settingTab.plugin.settings.timelineSidebar.enableTimelineSidebar)
		return;

	new Setting(containerEl)
		.setName(t("Auto-open on startup"))
		.setDesc(
			t("Automatically open the timeline sidebar when Obsidian starts.")
		)
		.addToggle((toggle) =>
			toggle
				.setValue(
					settingTab.plugin.settings.timelineSidebar.autoOpenOnStartup
				)
				.onChange(async (value) => {
					settingTab.plugin.settings.timelineSidebar.autoOpenOnStartup =
						value;
					settingTab.applySettingsUpdate();
				})
		);

	new Setting(containerEl)
		.setName(t("Show completed tasks"))
		.setDesc(
			t(
				"Include completed tasks in the timeline view. When disabled, only incomplete tasks will be shown."
			)
		)
		.addToggle((toggle) =>
			toggle
				.setValue(
					settingTab.plugin.settings.timelineSidebar
						.showCompletedTasks
				)
				.onChange(async (value) => {
					settingTab.plugin.settings.timelineSidebar.showCompletedTasks =
						value;
					settingTab.applySettingsUpdate();
				})
		);

	new Setting(containerEl)
		.setName(t("Focus mode by default"))
		.setDesc(
			t(
				"Enable focus mode by default, which highlights today's events and dims past/future events."
			)
		)
		.addToggle((toggle) =>
			toggle
				.setValue(
					settingTab.plugin.settings.timelineSidebar
						.focusModeByDefault
				)
				.onChange(async (value) => {
					settingTab.plugin.settings.timelineSidebar.focusModeByDefault =
						value;
					settingTab.applySettingsUpdate();
				})
		);

	new Setting(containerEl)
		.setName(t("Maximum events to show"))
		.setDesc(
			t(
				"Maximum number of events to display in the timeline. Higher numbers may affect performance."
			)
		)
		.addSlider((slider) =>
			slider
				.setLimits(50, 500, 25)
				.setValue(
					settingTab.plugin.settings.timelineSidebar.maxEventsToShow
				)
				.setDynamicTooltip()
				.onChange(async (value) => {
					settingTab.plugin.settings.timelineSidebar.maxEventsToShow =
						value;
					settingTab.applySettingsUpdate();
				})
		);

	// Add a button to open the timeline sidebar
	new Setting(containerEl)
		.setName(t("Open Timeline Sidebar"))
		.setDesc(t("Click to open the timeline sidebar view."))
		.addButton((button) =>
			button
				.setButtonText(t("Open Timeline"))
				.setCta()
				.onClick(async () => {
					await settingTab.plugin.activateTimelineSidebarView();
					new Notice(t("Timeline sidebar opened"));
				})
		);
}
