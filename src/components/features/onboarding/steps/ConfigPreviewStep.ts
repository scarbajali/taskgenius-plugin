import { t } from "@/translations/helper";
import { Setting } from "obsidian";
import { OnboardingController } from "../OnboardingController";
import { OnboardingConfigManager } from "@/managers/onboarding-manager";
import { ConfigSummary } from "./preview/ConfigSummary";
import { ViewsGrid } from "./preview/ViewsGrid";
import { SettingsList } from "./preview/SettingsList";
import { ChangesPreview } from "./preview/ChangesPreview";
import { Alert } from "../ui/Alert";

/**
 * Config Preview Step - Review configuration before applying
 */
export class ConfigPreviewStep {
	/**
	 * Render the config preview step
	 */
	static render(
		headerEl: HTMLElement,
		contentEl: HTMLElement,
		controller: OnboardingController,
		configManager: OnboardingConfigManager,
	) {
		// Clear
		headerEl.empty();
		contentEl.empty();

		const state = controller.getState();
		const config = state.selectedConfig;

		// Redirect if no config selected
		if (!config) {
			controller.setStep(controller.getCurrentStep() - 1);
			return;
		}

		// Header
		headerEl.createEl("h1", { text: t("Review Your Configuration") });
		headerEl.createEl("p", {
			text: t(
				"Review the settings that will be applied for your selected mode",
			),
			cls: "onboarding-subtitle",
		});

		// Config summary card
		ConfigSummary.render(contentEl, config);

		// Features section
		const featuresSection = contentEl.createDiv("config-features");
		featuresSection.createEl("h3", {
			text: t("Features to be enabled"),
		});

		const featuresList = featuresSection.createEl("ul", {
			cls: "enabled-features-list",
		});

		config.features.forEach((feature) => {
			const item = featuresList.createEl("li");
			const checkIcon = item.createSpan("feature-check");
			checkIcon.setText("✓");
			item.createSpan("feature-text").setText(feature);
		});

		// Views grid
		if (config.settings.viewConfiguration) {
			ViewsGrid.render(contentEl, config.settings.viewConfiguration);
		}

		// Settings summary
		SettingsList.render(contentEl, config);

		// Configuration changes preview
		ChangesPreview.render(contentEl, config, configManager);

		// Task guide option
		const optionsSection = contentEl.createDiv("config-options");

		new Setting(optionsSection)
			.setName(t("Include task creation guide"))
			.setDesc(t("Show a quick tutorial on creating your first task"))
			.addToggle((toggle) => {
				toggle.setValue(!state.skipTaskGuide).onChange((value) => {
					controller.setSkipTaskGuide(!value);
				});
			});

		// Note about customization
		Alert.create(
			contentEl,
			t(
				"You can customize any of these settings later in the plugin settings",
			),
			{
				variant: "info",
				className: "customization-note",
			},
		);
	}
}
