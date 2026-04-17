import { t } from "@/translations/helper";
import { OnboardingController } from "../OnboardingController";
import { ComponentPreviewFactory } from "../previews/ComponentPreviewFactory";
import "@/styles/onboarding-components.scss";

export class FluentMainNavigationStep {
	static render(
		headerEl: HTMLElement,
		contentEl: HTMLElement,
		controller: OnboardingController
	) {
		headerEl.empty();
		contentEl.empty();

		headerEl.createEl("h1", { text: t("Main Navigation") });
		headerEl.createEl("p", {
			text: t(
				"Access Inbox, Today, Upcoming and more from the primary section"
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

		ComponentPreviewFactory.createSidebarPreview(preview);

		const primary = preview.querySelector<HTMLElement>(
			".fluent-sidebar-section-primary"
		);
		primary?.classList.add("is-focused");

		const dimTargets = preview.querySelectorAll<HTMLElement>(
			".fluent-sidebar-section-projects, .fluent-sidebar-section-other"
		);
		dimTargets.forEach((el) => el.classList.add("is-dimmed"));

		desc.createEl("h3", { text: t("Navigate core views") });
		desc.createEl("p", {
			text: t(
				"Quickly jump to core views like Inbox, Today, Upcoming and Flagged."
			),
		});
		const ul = desc.createEl("ul", { cls: "component-feature-list" });
		[
			t("Unread counts and indicators keep you informed"),
			t("Keyboard-ready with clear selection states"),
		].forEach((txt) => ul.createEl("li", { text: txt }));
	}
}
