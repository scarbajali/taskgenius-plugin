import { t } from "@/translations/helper";
import { OnboardingController } from "../OnboardingController";
import { ComponentPreviewFactory } from "../previews/ComponentPreviewFactory";
import "@/styles/onboarding-components.scss";

export class FluentOverviewStep {
  static render(
    headerEl: HTMLElement,
    contentEl: HTMLElement,
    controller: OnboardingController
  ) {
    headerEl.empty();
    contentEl.empty();

    headerEl.createEl("h1", { text: t("Discover Fluent Interface") });
    headerEl.createEl("p", {
      text: t("A quick overview of the Fluent layout and its key areas"),
      cls: "onboarding-subtitle",
    });

    const showcase = contentEl.createDiv({ cls: "component-showcase" });
    const preview = showcase.createDiv({ cls: "component-showcase-preview" });
    const desc = showcase.createDiv({ cls: "component-showcase-description" });

    // Build a compact overview: Sidebar + Top Navigation
    const sidebarWrap = preview.createDiv();
    ComponentPreviewFactory.createSidebarPreview(sidebarWrap);

    const topNavWrap = preview.createDiv();
    ComponentPreviewFactory.createTopNavigationPreview(topNavWrap);

    desc.createEl("h3", { text: t("Fluent Layout Overview") });
    desc.createEl("p", {
      text: t(
        "Fluent groups navigation on the left and global tools at the top, keeping your content area clean and focused."
      ),
    });
    const ul = desc.createEl("ul", { cls: "component-feature-list" });
    [
      t("Sidebar for switching views and managing projects"),
      t("Top navigation for search, view modes and quick settings"),
      t("Consistent styling with clear hierarchy and feedback"),
    ].forEach((txt) => ul.createEl("li", { text: txt }));
  }
}

