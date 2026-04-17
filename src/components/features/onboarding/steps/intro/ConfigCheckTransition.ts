import { t } from "@/translations/helper";
import { TypingAnimation, TypingMessage } from "./TypingAnimation";

/**
 * Config Check Transition - Shows checking animation with typing effect
 */
export class ConfigCheckTransition {
	private container: HTMLElement;
	private typingAnimation?: TypingAnimation;

	constructor(
		container: HTMLElement,
		onComplete: (hasChanges: boolean) => void,
		hasChanges: boolean
	) {
		this.container = container;
		this.show(hasChanges, onComplete);
	}

	/**
	 * Show checking animation with typing effect
	 */
	private show(
		hasChanges: boolean,
		onComplete: (hasChanges: boolean) => void
	) {
		this.container.empty();

		// Create typing container with same style as intro
		const wrapper = this.container.createDiv({
			cls: "intro-typing-wrapper",
		});

		const typingContainer = wrapper.createDiv({
			cls: "intro-typing config-check-typing",
		});

		// Define checking messages
		const messages: TypingMessage[] = [
			{
				text: t("Just a moment..."),
				className: "check-line check-line-1",
				speed: 40,
			},
			{
				text: t("Checking your current configuration"),
				className: "check-line check-line-2",
				speed: 30,
			},
			{
				text: t("Analyzing your settings"),
				className: "check-line check-line-3",
				speed: 25,
				pauseAfter: 800
			},
		];

		// Add result message based on findings
		if (hasChanges) {
			messages.push({
				text: t("Great! I found your existing customizations."),
				className: "check-line check-line-3",
				speed: 25,
				pauseAfter: 400,
			});
		} else {
			messages.push({
				text: t("No previous configuration found. Let's get started!"),
				className: "check-line check-line-3",
				speed: 25,
				pauseAfter: 400,
			});
		}

		// Start typing animation
		this.typingAnimation = new TypingAnimation(
			typingContainer,
			messages,
			() => {
				// Animation complete, proceed to next step
				window.setTimeout(() => {
					onComplete(hasChanges);
				}, 1000);
			}
		);
	}

	/**
	 * Cleanup
	 */
	cleanup() {
		this.typingAnimation?.cleanup();
	}
}
