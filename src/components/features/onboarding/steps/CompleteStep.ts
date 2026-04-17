import { t } from "@/translations/helper";
import { setIcon } from "obsidian";
import { OnboardingController } from "../OnboardingController";
import { OnboardingConfig } from "@/managers/onboarding-manager";

/**
 * Complete Step - Setup complete, show summary and next steps
 */
export class CompleteStep {
	private static readonly ICON_MAP: Record<string, string> = {
		beginner: "edit-3",
		advanced: "settings",
		power: "zap",
	};

	/**
	 * Render the complete step
	 */
	static render(
		headerEl: HTMLElement,
		contentEl: HTMLElement,
		controller: OnboardingController
	) {
		// Clear
		headerEl.empty();
		contentEl.empty();

		const config = controller.getState().selectedConfig;
		if (!config) return;

		// Header
		headerEl.createEl("h1", { text: t("Task Genius is ready!") });
		headerEl.createEl("p", {
			text: t("You're all set to start managing your tasks"),
			cls: "onboarding-subtitle",
		});

		// Success section
		const successSection = contentEl.createDiv("completion-success");
		const successIcon = successSection.createDiv("success-icon");
		successIcon.setText("🎉");

		successSection.createEl("h2", { text: t("Congratulations!") });
		successSection.createEl("p", {
			text: t(
				"Task Genius has been configured with your selected preferences"
			),
			cls: "success-message",
		});

		// Config summary
		this.renderConfigSummary(contentEl, config);

		// Quick start guide
		this.renderQuickStart(contentEl, config);

		// Resources
		this.renderResources(contentEl);
	}

	/**
	 * Render configuration summary
	 */
	private static renderConfigSummary(
		container: HTMLElement,
		config: OnboardingConfig
	) {
		const section = container.createDiv("completion-summary");
		section.createEl("h3", { text: t("Your Configuration") });

		const card = section.createDiv("config-summary-card");

		const header = card.createDiv("config-header");
		const icon = header.createDiv("config-icon");
		setIcon(icon, this.getConfigIcon(config.mode));
		header.createDiv("config-name").setText(config.name);

		const desc = card.createDiv("config-description");
		desc.setText(config.description);
	}

	/**
	 * Render quick start guide
	 */
	private static renderQuickStart(
		container: HTMLElement,
		config: OnboardingConfig
	) {
		const section = container.createDiv("quick-start-section");
		section.createEl("h3", { text: t("Quick Start Guide") });

		const steps = section.createDiv("quick-start-steps");

		const quickSteps = this.getQuickStartSteps(config.mode);
		quickSteps.forEach((step, index) => {
			const stepEl = steps.createDiv("quick-start-step");
			stepEl.createDiv("step-number").setText((index + 1).toString());
			stepEl.createDiv("step-content").setText(step);
		});
	}

	/**
	 * Render resources
	 */
	private static renderResources(container: HTMLElement) {
		const section = container.createDiv("resources-section");
		section.createEl("h3", { text: t("Helpful Resources") });

		const list = section.createDiv("resources-list");

		const resources = [
			{
				icon: "book-open",
				title: t("Documentation"),
				desc: t("Complete guide to all features"),
				url: "https://taskgenius.md",
			},
			{
				icon: "message-circle",
				title: t("Community"),
				desc: t("Get help and share tips"),
				url: "https://discord.gg/ARR2rHHX6b",
			},
			{
				icon: "settings",
				title: t("Settings"),
				desc: t("Customize Task Genius"),
				action: "open-settings",
			},
		];

		resources.forEach((r) => {
			const item = list.createDiv("resource-item");
			const icon = item.createDiv("resource-icon");
			setIcon(icon, r.icon);
			const content = item.createDiv("resource-content");
			content.createEl("h4", { text: r.title });
			content.createEl("p", { text: r.desc });

			if (r.url) {
				item.addEventListener("click", () => {
					window.open(r.url, "_blank");
				});
				item.addClass("resource-clickable");
			} else if (r.action === "open-settings") {
				item.addEventListener("click", () => {
					// Signal main plugin to open settings so we keep UI logic here.
					const event = new CustomEvent("task-genius-open-settings");
					document.dispatchEvent(event);
				});
				item.addClass("resource-clickable");
			}
		});
	}

	/**
	 * Get quick start steps based on mode
	 */
	private static getQuickStartSteps(mode: string): string[] {
		switch (mode) {
			case "beginner":
				return [
					t("Click the Task Genius icon in the left sidebar"),
					t("Start with the Inbox view to see all your tasks"),
					t("Use quick capture panel to quickly add your first task"),
					t("Try the Forecast view to see tasks by date"),
				];
			case "advanced":
				return [
					t("Open Task Genius and explore the available views"),
					t("Set up a project using the Projects view"),
					t("Try the Kanban board for visual task management"),
					t("Use workflow stages to track task progress"),
				];
			case "power":
				return [
					t("Explore all available views and their configurations"),
					t("Set up complex workflows for your projects"),
					t("Configure habits and rewards to stay motivated"),
					t("Integrate with external calendars and systems"),
				];
			default:
				return [
					t("Open Task Genius from the left sidebar"),
					t("Create your first task"),
					t("Explore the different views available"),
					t("Customize settings as needed"),
				];
		}
	}

	/**
	 * Get config icon
	 */
	private static getConfigIcon(mode: string): string {
		return this.ICON_MAP[mode] || "clipboard-list";
	}
}
