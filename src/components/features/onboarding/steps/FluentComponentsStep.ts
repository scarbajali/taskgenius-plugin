import { t } from "@/translations/helper";
import { OnboardingController } from "../OnboardingController";
import { ComponentPreviewFactory } from "../previews/ComponentPreviewFactory";
import "@/styles/onboarding-components.scss";

type ComponentType = "sidebar" | "topnav" | "content" | "project";

/**
 * Fluent Components Step - Introduce main Fluent UI components
 */
export class FluentComponentsStep {
	private static currentComponent: ComponentType = "sidebar";

	/**
	 * Render the Fluent components introduction step
	 */
	static render(
		headerEl: HTMLElement,
		contentEl: HTMLElement,
		controller: OnboardingController
	) {
		// Clear
		headerEl.empty();
		contentEl.empty();

		// Header
		headerEl.createEl("h1", { text: t("Discover Fluent Interface") });
		headerEl.createEl("p", {
			text: t(
				"Get familiar with the main components that make up the Fluent experience"
			),
			cls: "onboarding-subtitle",
		});

		// Component tabs for switching
		const tabsContainer = contentEl.createDiv({ cls: "component-tabs" });

		const components: Array<{
			id: ComponentType;
			label: string;
		}> = [
			{ id: "sidebar", label: t("Sidebar") },
			{ id: "topnav", label: t("Top Navigation") },
			// { id: "content", label: t("Content Area") },
			{ id: "project", label: t("Project Management") },
		];

		// Create tabs
		components.forEach((comp) => {
			const tab = tabsContainer.createDiv({ cls: "component-tab" });
			if (comp.id === this.currentComponent) {
				tab.addClass("is-active");
			}
			tab.textContent = comp.label;
			tab.addEventListener("click", () => {
				this.currentComponent = comp.id;
				this.render(headerEl, contentEl, controller);
			});
		});

		// Components grid
		const grid = contentEl.createDiv({ cls: "components-grid" });

		// Render current component
		this.renderComponent(grid, this.currentComponent);
	}

	/**
	 * Render specific component showcase
	 */
	private static renderComponent(
		container: HTMLElement,
		component: ComponentType
	) {
		const showcase = container.createDiv({ cls: "component-showcase" });

		// Preview section
		const previewSection = showcase.createDiv({
			cls: "component-showcase-preview",
		});

		// Description section
		const descSection = showcase.createDiv({
			cls: "component-showcase-description",
		});

		// Render based on component type
		switch (component) {
			case "sidebar":
				this.renderSidebarShowcase(previewSection, descSection);
				break;
			case "topnav":
				this.renderTopNavShowcase(previewSection, descSection);
				break;
				// case "content":
				// 	this.renderContentShowcase(previewSection, descSection);
				// 	break;
			case "project":
				this.renderProjectShowcase(previewSection, descSection);
				break;
		}
	}

	/**
	 * Render sidebar component showcase
	 */
	private static renderSidebarShowcase(
		preview: HTMLElement,
		description: HTMLElement
	) {
		// Create preview
		ComponentPreviewFactory.createSidebarPreview(preview);

		// Create description
		description.createEl("h3", { text: t("Sidebar Navigation") });
		description.createEl("p", {
			text: t(
				"The sidebar is your command center for navigating through different views, managing workspaces, and organizing projects."
			),
		});

		const features = description.createEl("ul", {
			cls: "component-feature-list",
		});

		const featureItems = [
			t("Switch between multiple workspaces instantly"),
			t("Quick access to Inbox, Today, Upcoming, and Flagged tasks"),
			t("Organize tasks with project hierarchies"),
			t("Access specialized views like Calendar, Gantt, and Tags"),
			t("Collapsible design to maximize content space"),
		];

		featureItems.forEach((feature) => {
			features.createEl("li", { text: feature });
		});
	}

	/**
	 * Render top navigation showcase
	 */
	private static renderTopNavShowcase(
		preview: HTMLElement,
		description: HTMLElement
	) {
		// Create preview
		ComponentPreviewFactory.createTopNavigationPreview(preview);

		// Create description
		description.createEl("h3", { text: t("Top Navigation Bar") });
		description.createEl("p", {
			text: t(
				"The top navigation bar provides powerful tools for searching, filtering, and switching between different view modes."
			),
		});

		const features = description.createEl("ul", {
			cls: "component-feature-list",
		});

		const featureItems = [
			t("Global search across all tasks and projects"),
			t("Switch between List, Kanban, Tree, and Calendar views"),
			t("Apply advanced filters to focus on specific tasks"),
			t("Sort tasks by various criteria"),
			t("Quick access to view-specific settings"),
		];

		featureItems.forEach((feature) => {
			features.createEl("li", { text: feature });
		});
	}

	/**
	 * Render content area showcase
	 */
	private static renderContentShowcase(
		preview: HTMLElement,
		description: HTMLElement
	) {
		// Create preview
		ComponentPreviewFactory.createContentAreaPreview(preview);

		// Create description
		description.createEl("h3", { text: t("Content Display Area") });
		description.createEl("p", {
			text: t(
				"The main content area displays your tasks in various formats, adapting to your preferred view mode and current context."
			),
		});

		const features = description.createEl("ul", {
			cls: "component-feature-list",
		});

		const featureItems = [
			t("List view for detailed task management"),
			t("Kanban board for visual workflow tracking"),
			t("Tree view for hierarchical task organization"),
			t("Calendar view for time-based planning"),
			t("Inline task editing and quick actions"),
		];

		featureItems.forEach((feature) => {
			features.createEl("li", { text: feature });
		});
	}

	/**
	 * Render project management showcase
	 */
	private static renderProjectShowcase(
		preview: HTMLElement,
		description: HTMLElement
	) {
		// Create preview
		ComponentPreviewFactory.createProjectPopoverPreview(preview);

		// Create description
		description.createEl("h3", { text: t("Project Management") });
		description.createEl("p", {
			text: t(
				"Projects help you organize related tasks together. Access detailed project information, statistics, and quick actions through the project popover."
			),
		});

		const features = description.createEl("ul", {
			cls: "component-feature-list",
		});

		const featureItems = [
			t("View project task counts and completion statistics"),
			t("Quick access to all tasks within a project"),
			t("Color-coded project organization"),
			t("Create nested project hierarchies"),
			t("Manage project settings and properties"),
		];

		featureItems.forEach((feature) => {
			features.createEl("li", { text: feature });
		});
	}
}
