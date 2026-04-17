import { Setting } from "obsidian";
import { t } from "@/translations/helper";
import { TaskProgressBarSettingTab } from "@/setting";

export function renderDatePrioritySettingsTab(
	settingTab: TaskProgressBarSettingTab,
	containerEl: HTMLElement
) {
	new Setting(containerEl)
		.setName(t("Priority Picker Settings"))
		.setDesc(
			t(
				"Toggle to enable priority picker dropdown for emoji and letter format priorities."
			)
		)
		.setHeading();

	new Setting(containerEl)
		.setName(t("Enable priority picker"))
		.setDesc(
			t(
				"Toggle to enable priority picker dropdown for emoji and letter format priorities."
			)
		)
		.addToggle((toggle) =>
			toggle
				.setValue(settingTab.plugin.settings.enablePriorityPicker)
				.onChange(async (value) => {
					settingTab.plugin.settings.enablePriorityPicker = value;
					settingTab.applySettingsUpdate();
				})
		);

	new Setting(containerEl)
		.setName(t("Enable priority keyboard shortcuts"))
		.setDesc(
			t(
				"Toggle to enable keyboard shortcuts for setting task priorities."
			)
		)
		.addToggle((toggle) =>
			toggle
				.setValue(
					settingTab.plugin.settings.enablePriorityKeyboardShortcuts
				)
				.onChange(async (value) => {
					settingTab.plugin.settings.enablePriorityKeyboardShortcuts =
						value;
					settingTab.applySettingsUpdate();
				})
		);

	// Date picker settings
	new Setting(containerEl).setName(t("Date picker")).setHeading();

	new Setting(containerEl)
		.setName(t("Enable date picker"))
		.setDesc(
			t(
				"Toggle this to enable date picker for tasks. This will add a calendar icon near your tasks which you can click to select a date."
			)
		)
		.addToggle((toggle) =>
			toggle
				.setValue(settingTab.plugin.settings.enableDatePicker)
				.onChange(async (value) => {
					settingTab.plugin.settings.enableDatePicker = value;
					settingTab.applySettingsUpdate();
				})
		);

	// Recurrence date base setting
	new Setting(containerEl)
		.setName(t("Recurrence date calculation"))
		.setDesc(t("Choose how to calculate the next date for recurring tasks"))
		.addDropdown((dropdown) =>
			dropdown
				.addOption("due", t("Based on due date"))
				.addOption("scheduled", t("Based on scheduled date"))
				.addOption("current", t("Based on current date"))
				.setValue(
					settingTab.plugin.settings.recurrenceDateBase || "due"
				)
				.onChange(async (value: "due" | "scheduled" | "current") => {
					settingTab.plugin.settings.recurrenceDateBase = value;
					settingTab.applySettingsUpdate();
				})
		);
}
