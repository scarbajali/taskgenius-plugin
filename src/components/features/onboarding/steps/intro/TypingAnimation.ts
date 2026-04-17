/**
 * AI-style typing animation for intro messages
 * Characters fade in smoothly with a moving cursor
 */
export interface TypingMessage {
	text: string;
	className?: string;
	speed?: number;
	fadeOut?: boolean;
	pauseAfter?: number; // Pause after typing this line (ms)
	fadeOutDelay?: number; // Wait before starting fade out (ms)
	fadeOutDuration?: number; // Duration of fade out animation (ms)
	delayNext?: number; // Delay before next message (ms)
}

export class TypingAnimation {
	private container: HTMLElement;
	private messages: TypingMessage[];
	private onComplete: () => void;
	private timers: number[] = [];

	constructor(
		container: HTMLElement,
		messages: TypingMessage[],
		onComplete: () => void
	) {
		this.container = container;
		this.messages = messages;
		this.onComplete = onComplete;
		this.start();
	}

	/**
	 * Start the typing animation sequence
	 */
	private start() {
		this.animateSequence(0);
	}

	/**
	 * Animate a sequence of messages
	 */
	private animateSequence(index: number) {
		if (index >= this.messages.length) {
			// All messages complete
			this.onComplete();
			return;
		}

		const message = this.messages[index];
		const {
			text,
			className = "intro-line",
			speed = 25,
			fadeOut = false,
			pauseAfter = 0,
			fadeOutDelay = 600,
			fadeOutDuration = 500,
			delayNext = 300,
		} = message;

		// Create line element
		const lineEl = this.container.createEl("p", {
			cls: `intro-line ${className}`,
		});

		// Create character spans
		const chars: HTMLElement[] = [];
		for (let i = 0; i < text.length; i++) {
			const char = text[i];
			const span = lineEl.createSpan({
				cls: "intro-char",
				text: char,
			});
			if (char === " ") {
				span.addClass("intro-char-space");
			}
			chars.push(span);
		}

		// Create cursor
		const cursor = lineEl.createSpan({
			cls: "intro-cursor",
			text: "▊",
		});

		// Animate characters
		let charIndex = 0;
		const animateChar = () => {
			if (charIndex < chars.length) {
				const char = chars[charIndex];
				const jitter = Math.random() * speed * 0.3;
				char.addClass("intro-char-visible");

				// Move cursor
				char.after(cursor);

				charIndex++;
				const id = window.setTimeout(animateChar, speed + jitter);
				this.timers.push(id);
			} else {
				// Line complete
				cursor.remove();
				lineEl.addClass("stream-complete");

				// Pause after typing (if specified)
				const pauseDelay = pauseAfter || 0;
				const pauseId = window.setTimeout(() => {
					// Handle fade out
					if (fadeOut) {
						const fadeId = window.setTimeout(() => {
							// Fade out ALL previous lines including current
							const lines =
								this.container.querySelectorAll(".intro-line");
							lines.forEach((line, i) => {
								if (i <= index) {
									line.addClass("intro-line-fadeout");
								}
							});

							// Remove faded lines after animation
							const removeId = window.setTimeout(() => {
								lines.forEach((line, i) => {
									if (i <= index) {
										line.remove();
									}
								});

								// Continue to next message after delay
								const nextId = window.setTimeout(
									() => this.animateSequence(index + 1),
									delayNext
								);
								this.timers.push(nextId);
							}, fadeOutDuration);
							this.timers.push(removeId);
						}, fadeOutDelay);
						this.timers.push(fadeId);
					} else {
						// Continue to next message after delay
						const id = window.setTimeout(
							() => this.animateSequence(index + 1),
							delayNext
						);
						this.timers.push(id);
					}
				}, pauseDelay);
				this.timers.push(pauseId);
			}
		};

		// Start animation
		animateChar();
	}

	/**
	 * Cleanup timers
	 */
	cleanup() {
		this.timers.forEach((id) => window.clearTimeout(id));
		this.timers = [];
	}
}
