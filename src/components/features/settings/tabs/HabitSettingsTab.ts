import { Setting } from "obsidian";
import { TaskProgressBarSettingTab } from "@/setting";
import { t } from "@/translations/helper";
import { HabitList } from "@/components/features/habit/components/HabitSettingList";

export function renderHabitSettingsTab(
	settingTab: TaskProgressBarSettingTab,
	containerEl: HTMLElement
) {
	new Setting(containerEl)
		.setName(t("Habit"))
		.setDesc(
			t(
				"Configure habit settings, including adding new habits, editing existing habits, and managing habit completion."
			)
		)
		.setHeading();

	new Setting(containerEl).setName(t("Enable habits")).addToggle((toggle) => {
		toggle
			.setValue(settingTab.plugin.settings.habit.enableHabits)
			.onChange(async (value) => {
				settingTab.plugin.settings.habit.enableHabits = value;
				settingTab.applySettingsUpdate();
			});
	});

	const habitContainer = containerEl.createDiv({
		cls: "habit-settings-container",
	});

	// Habit List
	displayHabitList(settingTab, habitContainer);
}

function displayHabitList(
	settingTab: TaskProgressBarSettingTab,
	containerEl: HTMLElement
): void {
	// 创建习惯列表组件
	new HabitList(settingTab.plugin, containerEl);
}
