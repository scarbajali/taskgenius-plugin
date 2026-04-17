import { ButtonComponent, Component } from "obsidian";
import { t } from "@/translations/helper";
import { OnboardingController, OnboardingStep } from "./OnboardingController";

export interface OnboardingLayoutCallbacks {
	onNext: () => Promise<void>;
	onBack: () => Promise<void>;
	onSkip: () => Promise<void>;
}

/**
 * Layout component for onboarding view
 * Manages:
 * - Header section
 * - Content section (for steps to render into)
 * - Footer with navigation buttons
 */
export class OnboardingLayout extends Component {
	private container: HTMLElement;
	private controller: OnboardingController;
	private callbacks: OnboardingLayoutCallbacks;

	// Layout elements
	private headerEl: HTMLElement;
	private contentEl: HTMLElement;
	private footerEl: HTMLElement;

	// Navigation buttons
	private nextButton: ButtonComponent;
	private backButton: ButtonComponent;
	private skipButton: ButtonComponent;

	constructor(
		container: HTMLElement,
		controller: OnboardingController,
		callbacks: OnboardingLayoutCallbacks,
	) {
		super();
		this.container = container;
		this.controller = controller;
		this.callbacks = callbacks;

		this.createLayout();
		this.setupListeners();
		this.updateButtons();
	}

	/**
	 * Create the layout structure
	 */
	private createLayout() {
		this.container.empty();
		this.container.toggleClass(["onboarding-view"], true);

		// Header section
		this.headerEl = this.container.createDiv("onboarding-header");

		// Main content section
		this.contentEl = this.container.createDiv("onboarding-content");

		// Footer with navigation buttons
		this.footerEl = this.container.createDiv("onboarding-footer");
		this.createFooterButtons();

		// Shadow element
		this.container.createEl("div", {
			cls: "onboarding-shadow",
		});

		this.container.createEl("div", {
			cls: "tg-noise-layer",
		});
	}

	/**
	 * Create footer navigation buttons
	 */
	private createFooterButtons() {
		const buttonContainer = this.footerEl.createDiv("onboarding-buttons");

		// Left side - Back and Skip buttons
		const leftButtons = buttonContainer.createDiv("buttons-left");

		// Back button
		this.backButton = new ButtonComponent(leftButtons)
			.setButtonText(t("Back"))
			.onClick(() => this.callbacks.onBack());
		this.backButton.buttonEl.addClass("clickable-icon");

		// Skip button
		this.skipButton = new ButtonComponent(leftButtons)
			.setButtonText(t("Skip setup"))
			.onClick(() => this.callbacks.onSkip());
		this.skipButton.buttonEl.addClass("clickable-icon");

		// Right side - Next button
		const rightButtons = buttonContainer.createDiv("buttons-right");

		// Next button
		this.nextButton = new ButtonComponent(rightButtons)
			.setButtonText(t("Next"))
			.setCta()
			.onClick(() => this.callbacks.onNext());
	}

	/**
	 * Setup listeners for controller events
	 */
	private setupListeners() {
		this.controller.on("step-changed", () => {
			this.updateButtons();
		});

		this.controller.on("state-updated", () => {
			this.updateButtons();
		});
	}

	/**
	 * Update button states based on current step
	 */
	private updateButtons() {
		const step = this.controller.getCurrentStep();
		const state = this.controller.getState();

		// Skip button visibility
		this.skipButton.buttonEl.toggleVisibility(this.controller.canSkip());

		// Back button visibility
		this.backButton.buttonEl.toggleVisibility(this.controller.canGoBack());

		// Next button
		const isLastStep = step === OnboardingStep.COMPLETE;
		const isSettingsCheck = step === OnboardingStep.SETTINGS_CHECK;
		const isModeSelect = step === OnboardingStep.MODE_SELECT;
		this.nextButton.buttonEl.toggleVisibility(true);

		// Update button text based on step and selection
		if (isSettingsCheck) {
			if (state.settingsCheckAction === "wizard") {
				this.nextButton.setButtonText(t("Continue with Wizard"));
			} else if (state.settingsCheckAction === "keep") {
				this.nextButton.setButtonText(t("Keep Settings"));
			} else {
				this.nextButton.setButtonText(t("Continue"));
			}
		} else if (isModeSelect && state.uiMode === "fluent") {
			this.nextButton.setButtonText(t("Next to Introduction"));
		} else {
			this.nextButton.setButtonText(
				isLastStep ? t("Start Using Task Genius") : t("Next"),
			);
		}

		// Enable/disable next based on validation
		this.nextButton.setDisabled(
			!this.controller.canGoNext() || state.isCompleting,
		);
	}

	/**
	 * Get header element for step to render into
	 */
	getHeaderElement(): HTMLElement {
		return this.headerEl;
	}

	/**
	 * Get content element for step to render into
	 */
	getContentElement(): HTMLElement {
		return this.contentEl;
	}

	/**
	 * Get footer element
	 */
	getFooterElement(): HTMLElement {
		return this.footerEl;
	}

	/**
	 * Clear header content
	 */
	clearHeader() {
		this.headerEl?.empty();
	}

	/**
	 * Clear content
	 */
	clearContent() {
		this.contentEl?.empty();
	}

	/**
	 * Show/hide footer
	 */
	setFooterVisible(visible: boolean) {
		this.footerEl.toggleVisibility(visible);
	}

	/**
	 * Cleanup
	 */
	cleanup() {
		this.container.empty();
	}
}
