import { t } from "@/translations/helper";
import { setIcon } from "obsidian";
import { OnboardingConfig } from "@/managers/onboarding-manager";

/**
 * Config Summary Component - Display selected configuration overview
 */
export class ConfigSummary {
	private static readonly ICON_MAP: Record<string, string> = {
		beginner: "seedling",
		advanced: "zap",
		power: "rocket",
	};

	/**
	 * Render config summary card
	 */
	static render(container: HTMLElement, config: OnboardingConfig) {
		const section = container.createDiv("config-overview");

		section.createEl("h3", { text: t("Selected Mode") });

		const card = section.createDiv("mode-card");

		const icon = card.createDiv("mode-icon");
		setIcon(icon, this.getConfigIcon(config.mode));

		const content = card.createDiv("mode-content");
		content.createEl("h4", { text: config.name });
		content.createEl("p", { text: config.description });
	}

	/**
	 * Get icon for configuration mode
	 */
	private static getConfigIcon(mode: string): string {
		return this.ICON_MAP[mode] || "clipboard-list";
	}
}
