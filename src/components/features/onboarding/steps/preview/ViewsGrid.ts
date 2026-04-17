import { t } from "@/translations/helper";
import { setIcon } from "obsidian";

/**
 * Views Grid Component - Display available views
 */
export class ViewsGrid {
	/**
	 * Render views grid
	 */
	static render(container: HTMLElement, views: any[]) {
		const section = container.createDiv("config-views");
		section.createEl("h3", { text: t("Available views") });

		const grid = section.createDiv("views-grid");

		views.forEach((view) => {
			const viewItem = grid.createDiv("view-item");

			const viewIcon = viewItem.createDiv("view-icon");
			setIcon(viewIcon, view.icon || "list");

			const viewName = viewItem.createDiv("view-name");
			viewName.setText(view.name);
		});
	}
}
