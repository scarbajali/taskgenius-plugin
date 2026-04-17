import { setIcon } from "obsidian";

export interface FeatureListItem {
	text: string;
	icon?: string;
}

export interface FeatureListOptions {
	containerClass?: string;
	itemClass?: string;
	showIcons?: boolean;
	iconName?: string;
}

/**
 * Reusable feature list component
 * Displays a list of features with optional icons
 */
export class FeatureList {
	/**
	 * Render a feature list
	 */
	static render(
		container: HTMLElement,
		items: (string | FeatureListItem)[],
		options: FeatureListOptions = {}
	): HTMLElement {
		const {
			containerClass = "feature-list",
			itemClass = "feature-item",
			showIcons = true,
			iconName = "check",
		} = options;

		const list = container.createEl("ul", { cls: containerClass });

		items.forEach((item) => {
			const itemText = typeof item === "string" ? item : item.text;
			const itemIcon =
				typeof item === "string"
					? iconName
					: item.icon || iconName;

			const listItem = list.createEl("li", { cls: itemClass });

			// Add icon if enabled
			if (showIcons) {
				const iconEl = listItem.createSpan({ cls: `${itemClass}-icon` });
				setIcon(iconEl, itemIcon);
			}

			// Add text
			listItem.createSpan({
				cls: `${itemClass}-text`,
				text: itemText,
			});
		});

		return list;
	}
}
