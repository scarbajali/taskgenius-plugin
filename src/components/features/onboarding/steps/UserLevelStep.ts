import { t } from "@/translations/helper";
import { SelectableCard, SelectableCardConfig } from "../ui/SelectableCard";
import { OnboardingController } from "../OnboardingController";
import {
	OnboardingConfigManager,
	OnboardingConfig,
	OnboardingConfigMode,
} from "@/managers/onboarding-manager";

/**
 * User Level Selection Step - Choose configuration based on experience level
 */
export class UserLevelStep {
	private static readonly ICON_MAP: Record<string, string> = {
		beginner: "seedling",
		advanced: "zap",
		power: "rocket",
	};

	/**
	 * Render the user level selection step
	 */
	static render(
		headerEl: HTMLElement,
		contentEl: HTMLElement,
		controller: OnboardingController,
		configManager: OnboardingConfigManager
	) {
		// Clear
		headerEl.empty();
		contentEl.empty();

		// Header
		headerEl.createEl("h1", { text: t("Select Your Experience Level") });
		headerEl.createEl("p", {
			text: t(
				"Choose the configuration that best matches your task management experience"
			),
			cls: "onboarding-subtitle",
		});

		// Get configurations
		const configs = configManager.getOnboardingConfigs();

		// Get current selection
		const currentConfig = controller.getState().selectedConfig;

		// Create cards configuration
		const cardConfigs: SelectableCardConfig<OnboardingConfigMode>[] =
			configs.map((config) => ({
				id: config.mode,
				title: config.name,
				description: config.description,
				icon: this.getConfigIcon(config.mode),
				badge:
					config.mode === "beginner" ? t("Recommended") : undefined,
				features: config.features,
			}));

		// Render selectable cards
		const card = new SelectableCard<OnboardingConfigMode>(
			contentEl,
			cardConfigs,
			{
				containerClass: [
					"selectable-cards-container",
					"user-level-cards",
				],
				cardClass: "selectable-card",
				showIcon: true,
				showFeatures: true,
				showPreview: false,
			},
			(mode) => {
				controller.setSelectedConfig(
					configs.find((c) => c.mode === mode)
				);
			}
		);
	}
	/**
	 * Get icon for configuration mode
	 */
	private static getConfigIcon(mode: string): string {
		return this.ICON_MAP[mode] || "clipboard-list";
	}
}
