import { t } from "@/translations/helper";
import { OnboardingConfig } from "@/managers/onboarding-manager";

/**
 * Settings List Component - Display key settings summary
 */
export class SettingsList {
	/**
	 * Render settings list
	 */
	static render(container: HTMLElement, config: OnboardingConfig) {
		const section = container.createDiv("config-settings");
		section.createEl("h3", { text: t("Key settings") });

		const list = section.createEl("ul", {
			cls: "settings-summary-list",
		});

		// Progress bars
		if (config.settings.progressBarDisplayMode) {
			this.addSetting(
				list,
				t("Progress bars"),
				this.formatProgressBarMode(
					config.settings.progressBarDisplayMode
				)
			);
		}

		// Task status switching
		if (config.settings.enableTaskStatusSwitcher !== undefined) {
			this.addSetting(
				list,
				t("Task status switching"),
				config.settings.enableTaskStatusSwitcher
					? t("Enabled")
					: t("Disabled")
			);
		}

		// Quick capture
		if (config.settings.quickCapture?.enableQuickCapture !== undefined) {
			this.addSetting(
				list,
				t("Quick capture"),
				config.settings.quickCapture.enableQuickCapture
					? t("Enabled")
					: t("Disabled")
			);
		}

		// Workflow
		if (config.settings.workflow?.enableWorkflow !== undefined) {
			this.addSetting(
				list,
				t("Workflow management"),
				config.settings.workflow.enableWorkflow
					? t("Enabled")
					: t("Disabled")
			);
		}

		// Rewards
		if (config.settings.rewards?.enableRewards !== undefined) {
			this.addSetting(
				list,
				t("Reward system"),
				config.settings.rewards.enableRewards
					? t("Enabled")
					: t("Disabled")
			);
		}

		// Habits
		if (config.settings.habit?.enableHabits !== undefined) {
			this.addSetting(
				list,
				t("Habit tracking"),
				config.settings.habit.enableHabits
					? t("Enabled")
					: t("Disabled")
			);
		}

		// Performance
		if (
			config.settings.fileParsingConfig?.enableWorkerProcessing !==
			undefined
		) {
			this.addSetting(
				list,
				t("Performance optimization"),
				config.settings.fileParsingConfig.enableWorkerProcessing
					? t("Enabled")
					: t("Disabled")
			);
		}
	}

	/**
	 * Add a setting row
	 */
	private static addSetting(
		list: HTMLElement,
		label: string,
		value: string
	) {
		const item = list.createEl("li");
		item.createSpan("setting-label").setText(label + ":");
		item.createSpan("setting-value").setText(value);
	}

	/**
	 * Format progress bar mode
	 */
	private static formatProgressBarMode(mode: string): string {
		switch (mode) {
			case "both":
				return t("Enabled (both graphical and text)");
			default:
				return mode;
		}
	}
}
