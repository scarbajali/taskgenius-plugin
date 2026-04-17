import { t } from "@/translations/helper";
import { OnboardingController } from "../OnboardingController";
import { ComponentPreviewFactory } from "../previews/ComponentPreviewFactory";
import "@/styles/onboarding-components.scss";

export class FluentWorkspaceSelectorStep {
	static render(
		headerEl: HTMLElement,
		contentEl: HTMLElement,
		controller: OnboardingController
	) {
		headerEl.empty();
		contentEl.empty();

		headerEl.createEl("h1", { text: t("Workspace Selector") });
		headerEl.createEl("p", {
			text: t("Switch and manage workspaces from the top of the sidebar"),
			cls: "onboarding-subtitle",
		});

		const showcase = contentEl.createDiv({ cls: "component-showcase" });
		const preview = showcase.createDiv({
			cls: "component-showcase-preview focus-mode",
		});
		const desc = showcase.createDiv({
			cls: "component-showcase-description",
		});

		ComponentPreviewFactory.createSidebarPreview(preview);

		// Focus workspace selector, dim other parts
		const wsBtn = preview.querySelector<HTMLElement>(
			".workspace-selector-button"
		);
		wsBtn?.classList.add("is-focused");

		const contentSections = preview.querySelectorAll<HTMLElement>(
			".fluent-sidebar-content, .fluent-navigation-list, .fluent-project-list, .fluent-section-header, .fluent-top-navigation"
		);
		contentSections.forEach((el) => {
			if (!wsBtn || !el.contains(wsBtn)) el.classList.add("is-dimmed");
		});

		desc.createEl("h3", { text: t("Manage your spaces") });
		desc.createEl("p", {
			text: t(
				"Use the workspace selector to switch between personal, work, or any custom workspace."
			),
		});
		const ul = desc.createEl("ul", { cls: "component-feature-list" });
		[
			t("Quickly toggle between multiple workspaces"),
			t("Create and organize workspaces for different contexts"),
			t("Consistent placement at the top of the sidebar"),
		].forEach((txt) => ul.createEl("li", { text: txt }));
	}
}
