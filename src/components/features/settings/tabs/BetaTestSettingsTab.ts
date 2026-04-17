import { Setting, Notice } from "obsidian";
import { TaskProgressBarSettingTab } from "@/setting";
import { t } from "@/translations/helper";

export function renderBetaTestSettingsTab(
	settingTab: TaskProgressBarSettingTab,
	containerEl: HTMLElement
) {
	new Setting(containerEl)
		.setName(t("Beta Test Features"))
		.setDesc(
			t(
				"Experimental features that are currently in testing phase. These features may be unstable and could change or be removed in future updates."
			)
		)
		.setHeading();

	// Warning banner
	const warningBanner = containerEl.createDiv({
		cls: "beta-test-warning-banner",
	});

	warningBanner.createEl("div", {
		cls: "beta-warning-icon",
		text: "⚠️",
	});

	const warningContent = warningBanner.createDiv({
		cls: "beta-warning-content",
	});

	warningContent.createEl("div", {
		cls: "beta-warning-title",
		text: t("Beta Features Warning"),
	});

	const warningText = warningContent.createEl("div", {
		cls: "beta-warning-text",
		text: t(
			"These features are experimental and may be unstable. They could change significantly or be removed in future updates due to Obsidian API changes or other factors. Please use with caution and provide feedback to help improve these features."
		),
	});

	// Feedback section
	new Setting(containerEl)
		.setName(t("Beta Feedback"))
		.setDesc(
			t(
				"Help improve these features by providing feedback on your experience."
			)
		)
		.setHeading();

	new Setting(containerEl)
		.setName(t("Report Issues"))
		.setDesc(
			t(
				"If you encounter any issues with beta features, please report them to help improve the plugin."
			)
		)
		.addButton((button) => {
			button.setButtonText(t("Report Issue")).onClick(() => {
				window.open(
					"https://github.com/quorafind/obsidian-task-genius/issues"
				);
			});
		});
}
