import { setIcon } from "obsidian";

export interface SelectableCardConfig<T> {
	id: T;
	title: string;
	subtitle?: string;
	description: string;
	icon?: string;
	badge?: string;
	preview?: HTMLElement | (() => HTMLElement);
	features?: string[];
}

export interface SelectableCardOptions {
	containerClass?: string | string[];
	cardClass?: string;
	showIcon?: boolean;
	showPreview?: boolean;
	showFeatures?: boolean;
}

/**
 * Reusable selectable card component with shadcn design principles
 * - Clean borders with subtle shadows
 * - Smooth transitions (200ms cubic-bezier)
 * - Clear selected state
 */
export class SelectableCard<T = string> {
	private container: HTMLElement;
	private selectedId: T | null = null;
	private onSelect: (id: T) => void;
	private cards: Map<T, HTMLElement> = new Map();

	constructor(
		container: HTMLElement,
		configs: SelectableCardConfig<T>[],
		options: SelectableCardOptions = {},
		onSelect: (id: T) => void,
	) {
		this.container = container;
		this.onSelect = onSelect;
		this.render(configs, options);
	}

	private render(
		configs: SelectableCardConfig<T>[],
		options: SelectableCardOptions,
	) {
		const {
			containerClass = "selectable-cards-container",
			cardClass = "selectable-card",
			showIcon = true,
			showPreview = true,
			showFeatures = false,
		} = options;

		// Create container
		const cardsContainer = this.container.createDiv({
			cls: containerClass,
		});

		// Create cards
		configs.forEach((config) => {
			const card = cardsContainer.createDiv({
				cls: `${cardClass} card-${String(config.id)}`,
			});

			// Header
			const header = card.createDiv({ cls: `${cardClass}-header` });

			// Icon
			if (showIcon && config.icon) {
				const iconEl = header.createDiv({ cls: `${cardClass}-icon` });
				setIcon(iconEl, config.icon);
			}

			// Title & subtitle
			const titleContainer = header.createDiv({
				cls: `${cardClass}-title-container`,
			});

			const titleEl = titleContainer.createEl("h3", {
				text: config.title,
				cls: `${cardClass}-title`,
			});

			if (config.subtitle) {
				titleContainer.createEl("span", {
					text: config.subtitle,
					cls: `${cardClass}-subtitle`,
				});
			}

			// Badge (optional)
			if (config.badge) {
				const badge = header.createDiv({
					cls: `${cardClass}-badge`,
					text: config.badge,
				});
			}

			// Body
			const body = card.createDiv({ cls: `${cardClass}-body` });

			// Preview (optional)
			if (showPreview && config.preview) {
				const previewEl = body.createDiv({
					cls: `${cardClass}-preview`,
				});
				if (typeof config.preview === "function") {
					const previewContent = config.preview();
					previewEl.appendChild(previewContent);
				} else {
					previewEl.appendChild(config.preview);
				}
			}

			// Description
			body.createEl("p", {
				text: config.description,
				cls: `${cardClass}-description`,
			});

			// Features (optional)
			if (showFeatures && config.features && config.features.length > 0) {
				const featuresContainer = body.createDiv({
					cls: `${cardClass}-features`,
				});
				const featuresList = featuresContainer.createEl("ul");
				config.features.forEach((feature) => {
					featuresList.createEl("li", { text: feature });
				});
			}

			// Click handler
			card.addEventListener("click", () => {
				this.select(config.id);
			});

			// Keyboard support
			card.setAttribute("tabindex", "0");
			card.addEventListener("keydown", (e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					this.select(config.id);
				}
			});

			// Store card reference
			this.cards.set(config.id, card);
		});
	}

	/**
	 * Select a card by id
	 */
	select(id: T) {
		// Deselect previous
		if (this.selectedId !== null) {
			const prevCard = this.cards.get(this.selectedId);
			prevCard?.removeClass("is-selected");
		}

		// Select new
		this.selectedId = id;
		const newCard = this.cards.get(id);
		newCard?.addClass("is-selected");

		// Trigger callback
		this.onSelect(id);
	}

	/**
	 * Get selected id
	 */
	getSelected(): T | null {
		return this.selectedId;
	}

	/**
	 * Set selected programmatically
	 */
	setSelected(id: T) {
		if (this.cards.has(id)) {
			this.select(id);
		}
	}
}
