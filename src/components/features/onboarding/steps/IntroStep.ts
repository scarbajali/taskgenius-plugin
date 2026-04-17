import { t } from "@/translations/helper";
import { OnboardingController, OnboardingStep } from "../OnboardingController";
import { TypingAnimation } from "./intro/TypingAnimation";
import { TransitionMessage } from "./intro/TransitionMessage";

/**
 * Intro Step - Welcome message with typing animation + mode selection
 */
export class IntroStep {
	private typingAnimation?: TypingAnimation;
	private transitionMessage?: TransitionMessage;

	/**
	 * Render the intro step
	 */
	static render(
		headerEl: HTMLElement,
		contentEl: HTMLElement,
		footerEl: HTMLElement,
		controller: OnboardingController
	) {
		// Clear
		headerEl.empty();
		contentEl.empty();

		// Hide footer during intro animation
		footerEl.hide();

		// Create wrapper for typing animation
		const introWrapper = contentEl.createDiv({
			cls: "intro-typing-wrapper",
		});

		// Create typing container
		const typingContainer = introWrapper.createDiv({
			cls: "intro-typing",
		});

		// Define welcome messages with timing from original implementation
		const messages = [
			{
				text: t("Hi,"),
				className: "intro-line-1",
				speed: 35,
			},
			{
				text: t("Thank you for using Task Genius"),
				className: "intro-line-2",
				speed: 25,
			},
			{
				text: t(
					"In the following steps, you will gradually set up Task Genius to get a more suitable environment for you"
				),
				className: "intro-line-3",
				speed: 20,
				fadeOut: true,
				pauseAfter: 2000, // Wait 3s for user to read
				fadeOutDelay: 0, // Start fading out immediately after pause
				fadeOutDuration: 1000, // 2s fade out animation
				delayNext: 0, // No extra delay before next message
			},
			{
				text: t(
					"In the current version, Task Genius provides a brand new visual and interactive experience: Fluent; while also providing the option to return to the previous interface. Which one do you prefer?"
				),
				className: "intro-line-4",
				speed: 20,
				pauseAfter: 300, // Brief pause before showing mode selection
			},
		];

		// Start typing animation
		new TypingAnimation(typingContainer, messages, () => {
			// Typing completed: show footer and move to Mode Selection step
			footerEl.show();
			controller.setStep(OnboardingStep.MODE_SELECT);
		});
	}

	/**
	 * Cleanup
	 */
	cleanup() {
		this.typingAnimation?.cleanup();
		this.transitionMessage?.cleanup();
	}
}
