import { t } from "@/translations/helper";
import { setIcon } from "obsidian";
import {
	OnboardingConfig,
	OnboardingConfigManager,
} from "@/managers/onboarding-manager";
import { Alert } from "../../ui/Alert";

/**
 * Changes Preview Component - Show what will change
 */
export class ChangesPreview {
	/**
	 * Render configuration changes preview
	 */
	static render(
		container: HTMLElement,
		config: OnboardingConfig,
		configManager: OnboardingConfigManager
	) {
		try {
			const preview = configManager.getConfigurationPreview(config.mode);

			const section = container.createDiv("config-changes-summary");
			section.createEl("h3", { text: t("Configuration Changes") });

			// User custom views preserved
			if (preview.userCustomViewsPreserved.length > 0) {
				this.renderPreservedViews(section, preview.userCustomViewsPreserved);
			}

			// Views to be added
			if (preview.viewsToAdd.length > 0) {
				this.renderChangeItem(
					section,
					"plus-circle",
					t("New views to be added") +
						` (${preview.viewsToAdd.length})`
				);
			}

			// Views to be updated
			if (preview.viewsToUpdate.length > 0) {
				this.renderChangeItem(
					section,
					"refresh-cw",
					t("Existing views to be updated") +
						` (${preview.viewsToUpdate.length})`
				);
			}

			// Settings changes
			if (preview.settingsChanges.length > 0) {
				this.renderSettingsChanges(section, preview.settingsChanges);
			}

			// Safety note
			Alert.create(
				section,
				t(
					"Only template settings will be applied. Your existing custom configurations will be preserved."
				),
				{
					variant: "info",
					icon: "info",
					className: "safety-note",
				}
			);
		} catch (error) {
			console.warn("Could not generate configuration preview:", error);
		}
	}

	/**
	 * Render preserved views
	 */
	private static renderPreservedViews(
		container: HTMLElement,
		views: any[]
	) {
		const section = container.createDiv("preserved-views");
		const header = section.createDiv("preserved-header");

		const icon = header.createSpan("preserved-icon");
		setIcon(icon, "shield-check");

		header
			.createSpan("preserved-text")
			.setText(
				t("Your custom views will be preserved") + ` (${views.length})`
			);

		const list = section.createEl("ul", {
			cls: "preserved-views-list",
		});

		views.forEach((view) => {
			const item = list.createEl("li");
			const viewIcon = item.createSpan();
			setIcon(viewIcon, view.icon || "list");
			item.createSpan().setText(" " + view.name);
		});
	}

	/**
	 * Render a change item
	 */
	private static renderChangeItem(
		container: HTMLElement,
		iconName: string,
		text: string
	) {
		const section = container.createDiv("change-item");
		const icon = section.createSpan("change-icon");
		setIcon(icon, iconName);
		section.createSpan("change-text").setText(text);
	}

	/**
	 * Render settings changes
	 */
	private static renderSettingsChanges(
		container: HTMLElement,
		changes: string[]
	) {
		const section = container.createDiv("settings-changes");
		const icon = section.createSpan("change-icon");
		setIcon(icon, "settings");
		section.createSpan("change-text").setText(t("Feature changes"));

		const list = section.createEl("ul", {
			cls: "settings-changes-list",
		});

		changes.forEach((change) => {
			const item = list.createEl("li");
			item.setText(change);
		});
	}
}
