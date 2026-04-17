import { t } from "@/translations/helper";
import { SelectableCard, SelectableCardConfig } from "../ui/SelectableCard";
import { OnboardingController } from "../OnboardingController";
import { Alert } from "../ui/Alert";
import "@/styles/layout-placement.scss";

export type Placement = "sideleaves" | "inline";

/**
 * Fluent Placement Step - Choose between Sideleaves and Inline
 */
export class PlacementStep {
	/**
	 * Render the placement selection step
	 */
	static render(
		headerEl: HTMLElement,
		contentEl: HTMLElement,
		controller: OnboardingController,
	) {
		// Clear
		headerEl.empty();
		contentEl.empty();

		// Header
		headerEl.createEl("h1", { text: t("Fluent Layout") });
		headerEl.createEl("p", {
			text: t("Choose how to display Fluent views in your workspace"),
			cls: "onboarding-subtitle",
		});

		// Get current state
		const currentPlacement: Placement = controller.getState().useSideLeaves
			? "sideleaves"
			: "inline";

		// Create cards configuration
		const cardConfigs: SelectableCardConfig<Placement>[] = [
			{
				id: "sideleaves",
				title: t("Sideleaves"),
				subtitle: t("Multi-Column Collaboration"),
				description: t(
					"Left navigation and right details as separate workspace sidebars, ideal for simultaneous browsing and editing",
				),
				preview: this.createSideleavesPreview(),
			},
			{
				id: "inline",
				title: t("Inline"),
				subtitle: t("Single-Page Immersion"),
				description: t(
					"All content in one page, focusing on the main view and reducing interface distractions",
				),
				preview: this.createInlinePreview(),
			},
		];

		// Render selectable cards
		const card = new SelectableCard<Placement>(
			contentEl,
			cardConfigs,
			{
				containerClass: "selectable-cards-container",
				cardClass: "selectable-card",
				showPreview: true,
			},
			(placement) => {
				controller.setUseSideLeaves(placement === "sideleaves");
			},
		);

		// Set initial selection
		card.setSelected("inline");

		// Add info alert
		Alert.create(
			contentEl,
			t("You can change this option later in settings"),
			{
				variant: "info",
				className: "placement-selection-tip",
			},
		);
	}

	/**
	 * Create Sideleaves preview
	 */
	private static createSideleavesPreview(): HTMLElement {
		const preview = createEl("div");
		preview.addClass("placement-preview", "placement-preview-sideleaves");

		// Left sidebar (active)
		const leftSidebar = preview.createDiv({
			cls: "placement-sidebar placement-sidebar-active",
		});
		// Add file list placeholders
		for (let i = 0; i < 6; i++) {
			leftSidebar.createDiv({
				cls: "placement-sidebar-item placement-sidebar-item-active",
			});
		}

		// Center area with tabs and content (active)
		const centerArea = preview.createDiv({
			cls: "placement-center placement-center-active",
		});

		// Tab bar
		const tabBar = centerArea.createDiv({ cls: "placement-tab-bar" });
		for (let i = 0; i < 3; i++) {
			const tab = tabBar.createDiv({ cls: "placement-tab" });
			// Only highlight the second tab
			if (i === 1) {
				tab.addClass("placement-tab-active");
			}
		}

		// Content area
		const content = centerArea.createDiv({ cls: "placement-content" });
		for (let i = 0; i < 5; i++) {
			const line = content.createDiv({
				cls: "placement-content-line",
			});
			line.style.width = `${90 - i * 12}%`;
		}

		// Right sidebar (active)
		const rightSidebar = preview.createDiv({
			cls: "placement-sidebar placement-sidebar-active",
		});
		// Add property list placeholders
		for (let i = 0; i < 8; i++) {
			rightSidebar.createDiv({
				cls: "placement-sidebar-item placement-sidebar-item-active placement-sidebar-item-small",
			});
		}

		return preview;
	}

	/**
	 * Create Inline preview
	 */
	private static createInlinePreview(): HTMLElement {
		const preview = createEl("div");
		preview.addClass("placement-preview", "placement-preview-inline");

		// Left sidebar (inactive/dimmed)
		const leftSidebar = preview.createDiv({
			cls: "placement-sidebar placement-sidebar-inactive",
		});
		// Add file list placeholders (dimmed)
		for (let i = 0; i < 6; i++) {
			leftSidebar.createDiv({
				cls: "placement-sidebar-item placement-sidebar-item-inactive",
			});
		}

		// Center area with tabs and content (active - only this one is highlighted)
		const centerArea = preview.createDiv({
			cls: "placement-center placement-center-active",
		});

		// Tab bar
		const tabBar = centerArea.createDiv({ cls: "placement-tab-bar" });
		for (let i = 0; i < 3; i++) {
			const tab = tabBar.createDiv({ cls: "placement-tab" });
			// Only highlight the second tab
			if (i === 1) {
				tab.addClass("placement-tab-active");
			}
		}

		// Content area
		const content = centerArea.createDiv({ cls: "placement-content" });
		for (let i = 0; i < 5; i++) {
			const line = content.createDiv({
				cls: "placement-content-line",
			});
			line.style.width = `${90 - i * 12}%`;
		}

		// Right sidebar (inactive/dimmed)
		const rightSidebar = preview.createDiv({
			cls: "placement-sidebar placement-sidebar-inactive",
		});
		// Add property list placeholders (dimmed)
		for (let i = 0; i < 8; i++) {
			rightSidebar.createDiv({
				cls: "placement-sidebar-item placement-sidebar-item-inactive placement-sidebar-item-small",
			});
		}

		return preview;
	}
}
