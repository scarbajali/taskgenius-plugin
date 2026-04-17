import { t } from "@/translations/helper";
import { setIcon } from "obsidian";
import { OnboardingController } from "../OnboardingController";
import { Badge } from "../ui/Badge";

/**
 * Settings Check Step - Show if user has existing configuration
 */
export class SettingsCheckStep {
	private static selectedAction: "wizard" | "keep" | null = null;

	/**
	 * Render the settings check step
	 */
	static render(
		headerEl: HTMLElement,
		contentEl: HTMLElement,
		controller: OnboardingController
	) {
		// Clear
		headerEl.empty();
		contentEl.empty();

		// Reset selection
		this.selectedAction = null;

		const state = controller.getState();

		// Header - friendly and direct
		headerEl.createEl("h1", { text: t("You've Customized Task Genius") });
		headerEl.createEl("p", {
			text: t(
				"Great! Let's decide how to proceed with your existing setup."
			),
			cls: "onboarding-subtitle",
		});

		// Main content - two-column layout
		const mainContent = contentEl.createDiv("settings-check-content");

		// Left: Current configuration summary card
		const currentConfigCard = mainContent.createDiv(
			"settings-check-current-card"
		);

		const currentHeader = currentConfigCard.createDiv(
			"settings-check-card-header"
		);
		const currentIcon = currentHeader.createDiv("check-header-icon");
		setIcon(currentIcon, "check-circle");

		const currentTitle = currentHeader.createDiv("check-header-title");
		currentTitle.createEl("h3", { text: t("Your Current Setup") });
		Badge.create(currentTitle, t("Active"), { variant: "success" });

		const currentBody = currentConfigCard.createDiv(
			"settings-check-card-body"
		);
		currentBody.createEl("p", {
			text: t("You've made the following customizations:"),
			cls: "check-card-desc",
		});

		// Render changes as elegant list
		const changesList = currentBody.createEl("ul", {
			cls: "settings-check-changes-list",
		});
		state.changesSummary.forEach((change) => {
			const item = changesList.createEl("li");
			const checkIcon = item.createSpan("change-check-icon");
			setIcon(checkIcon, "check");
			item.createSpan({ text: change });
		});

		// Right: Two action cards
		const actionsContainer = mainContent.createDiv(
			"settings-check-actions"
		);

		// Action 2: Keep current settings (secondary)
		const keepCard = actionsContainer.createDiv(
			"settings-check-action-card settings-check-action-keep"
		);

		// Action 1: Continue with wizard (prominent)
		const wizardCard = actionsContainer.createDiv(
			"settings-check-action-card settings-check-action-wizard"
		);

		// 先渲染卡片内容，再绑定事件，避免 keepCard/wizardCard 未定义
		const wizardHeader = wizardCard.createDiv("action-card-header");
		const wizardIcon = wizardHeader.createDiv("action-card-icon");
		setIcon(wizardIcon, "wand-2");

		const wizardContent = wizardCard.createDiv("action-card-content");
		wizardContent.createEl("h3", { text: t("Start Setup Wizard") });
		wizardContent.createEl("p", {
			text: t(
				"Get personalized recommendations and discover features you might have missed"
			),
		});

		const wizardFeatures = wizardContent.createEl("ul", {
			cls: "action-card-features",
		});
		[
			t("Personalized configuration"),
			t("Feature discovery"),
			t("Quick setup guide"),
		].forEach((feature) => {
			const item = wizardFeatures.createEl("li");
			const icon = item.createSpan("feature-icon");
			setIcon(icon, "arrow-right");
			item.createSpan({ text: feature });
		});

		const keepHeader = keepCard.createDiv("action-card-header");
		const keepIcon = keepHeader.createDiv("action-card-icon");
		setIcon(keepIcon, "shield-check");

		const keepContent = keepCard.createDiv("action-card-content");
		keepContent.createEl("h3", { text: t("Keep Current Settings") });
		keepContent.createEl("p", {
			text: t(
				"Continue with your existing configuration. You can always access the wizard later from settings."
			),
		});

		const keepNote = keepContent.createDiv("action-card-note");
		const noteIcon = keepNote.createSpan("note-icon");
		setIcon(noteIcon, "info");
		keepNote.createSpan({
			text: t("Your customizations will be preserved"),
		});

		// 事件绑定前，确保两个卡片都已渲染
		wizardCard.addEventListener("click", () => {
			if (this.selectedAction === "wizard") return;
			this.selectedAction = "wizard";
			this.updateCardSelection(wizardCard, keepCard);
			controller.updateState({ settingsCheckAction: "wizard" });
		});

		keepCard.addEventListener("click", () => {
			if (this.selectedAction === "keep") return;
			this.selectedAction = "keep";
			this.updateCardSelection(keepCard, wizardCard);
			controller.updateState({ settingsCheckAction: "keep" });
		});
	}

	/**
	 * Update card selection visual state
	 */
	private static updateCardSelection(
		selectedCard: HTMLElement,
		otherCard: HTMLElement
	) {
		// Add selected class to clicked card
		selectedCard.addClass("is-selected");

		// Remove selected class from other card
		otherCard.removeClass("is-selected");
	}
}
