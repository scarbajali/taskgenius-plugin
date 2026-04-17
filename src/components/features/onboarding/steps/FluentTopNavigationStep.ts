import { t } from "@/translations/helper";
import { OnboardingController } from "../OnboardingController";
import { ComponentPreviewFactory } from "../previews/ComponentPreviewFactory";
import "@/styles/onboarding-components.scss";

export class FluentTopNavigationStep {
	static render(
		headerEl: HTMLElement,
		contentEl: HTMLElement,
		controller: OnboardingController
	) {
		headerEl.empty();
		contentEl.empty();

		headerEl.createEl("h1", { text: t("Top Navigation") });
		headerEl.createEl("p", {
			text: t(
				"Search, switch views, and access quick settings from the top bar"
			),
			cls: "onboarding-subtitle",
		});

		const showcase = contentEl.createDiv({ cls: "component-showcase" });
		const preview = showcase.createDiv({
			cls: "component-showcase-preview focus-mode",
		});
		const desc = showcase.createDiv({
			cls: "component-showcase-description",
		});

		ComponentPreviewFactory.createTopNavigationPreview(preview);

		const topNav = preview.querySelector<HTMLElement>(
			".fluent-top-navigation"
		);
		topNav?.classList.add("is-focused");

		desc.createEl("h3", { text: t("Global controls") });
		desc.createEl("p", {
			text: t(
				"Use the top bar to search across everything, switch view modes, and open notifications or settings."
			),
		});
		const ul = desc.createEl("ul", { cls: "component-feature-list" });
		[
			t("Quick view mode switching"),
			t("Accessible controls with clear icons"),
		].forEach((txt) => ul.createEl("li", { text: txt }));
	}
}
