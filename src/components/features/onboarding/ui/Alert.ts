import { setIcon } from "obsidian";

export type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertOptions {
	variant?: AlertVariant;
	icon?: string;
	title?: string;
	showIcon?: boolean;
	className?: string;
}

/**
 * Alert component for messages and notifications
 * Follows shadcn design with subtle backgrounds and borders
 */
export class Alert {
	private static readonly VARIANT_ICONS: Record<AlertVariant, string> = {
		info: "info",
		success: "check-circle",
		warning: "alert-triangle",
		error: "alert-circle",
	};

	/**
	 * Create an alert element
	 */
	static create(
		container: HTMLElement,
		message: string,
		options: AlertOptions = {}
	): HTMLElement {
		const {
			variant = "info",
			icon,
			title,
			showIcon = true,
			className = "",
		} = options;

		const alert = container.createDiv({
			cls: `onboarding-alert onboarding-alert-${variant} ${className}`,
		});

		// Icon
		if (showIcon) {
			const iconName = icon || this.VARIANT_ICONS[variant];
			const iconEl = alert.createDiv({ cls: "onboarding-alert-icon" });
			setIcon(iconEl, iconName);
		}

		// Content
		const content = alert.createDiv({ cls: "onboarding-alert-content" });

		// Title (optional)
		if (title) {
			content.createEl("div", {
				text: title,
				cls: "onboarding-alert-title",
			});
		}

		// Message
		content.createEl("div", {
			text: message,
			cls: "onboarding-alert-message",
		});

		return alert;
	}
}
