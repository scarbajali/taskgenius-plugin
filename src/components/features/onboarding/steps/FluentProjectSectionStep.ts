import { t } from "@/translations/helper";
import { OnboardingController } from "../OnboardingController";
import { ComponentPreviewFactory } from "../previews/ComponentPreviewFactory";
import "@/styles/onboarding-components.scss";

export class FluentProjectSectionStep {
	static render(
		headerEl: HTMLElement,
		contentEl: HTMLElement,
		controller: OnboardingController
	) {
		headerEl.empty();
		contentEl.empty();

		headerEl.createEl("h1", { text: t("Projects Section") });
		headerEl.createEl("p", {
			text: t("Organize your work with projects and hierarchies"),
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

		const projects = preview.querySelector<HTMLElement>(
			".fluent-sidebar-section-projects"
		);
		projects?.classList.add("is-focused");

		const dimTargets = preview.querySelectorAll<HTMLElement>(
			".fluent-sidebar-section-primary, .fluent-sidebar-section-other"
		);
		dimTargets.forEach((el) => el.classList.add("is-dimmed"));

		desc.createEl("h3", { text: t("Project organization") });
		desc.createEl("p", {
			text: t(
				"Group related tasks under projects. Build nested hierarchies and get quick stats."
			),
		});
		const ul = desc.createEl("ul", { cls: "component-feature-list" });
		[
			t(
				"Color-coded projects with counts (You can change the color in the settings)"
			),
			t("Supports nested structures for complex work"),
			t("Right click for more options"),
			t("Sort projects by name or tasks count, etc."),
		].forEach((txt) => ul.createEl("li", { text: txt }));
	}
}
