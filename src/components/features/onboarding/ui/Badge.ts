export type BadgeVariant = "default" | "success" | "warning" | "info" | "accent";

export interface BadgeOptions {
	variant?: BadgeVariant;
	className?: string;
}

/**
 * Badge component for labels and tags
 * Follows shadcn design principles with subtle colors
 */
export class Badge {
	/**
	 * Create a badge element
	 */
	static create(
		container: HTMLElement,
		text: string,
		options: BadgeOptions = {}
	): HTMLElement {
		const { variant = "default", className = "" } = options;

		const badge = container.createEl("span", {
			text,
			cls: `onboarding-badge onboarding-badge-${variant} ${className}`,
		});

		return badge;
	}
}
