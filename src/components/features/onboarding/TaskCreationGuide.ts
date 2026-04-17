import { Setting, TextAreaComponent, Notice, setIcon } from "obsidian";
import type TaskProgressBarPlugin from "@/index";
import { t } from "@/translations/helper";
import { QuickCaptureModal } from "@/components/features/quick-capture/modals/QuickCaptureModalWithSwitch";

export class TaskCreationGuide {
	private plugin: TaskProgressBarPlugin;

	constructor(plugin: TaskProgressBarPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Render task creation guide
	 */
	render(containerEl: HTMLElement) {
		containerEl.empty();

		// Introduction
		const introSection = containerEl.createDiv("task-guide-intro");
		introSection.createEl("p", {
			text: t(
				"Learn the different ways to create and format tasks in Task Genius. You can use either emoji-based or Dataview-style syntax.",
			),
			cls: "guide-description",
		});

		// Task format examples
		this.renderTaskFormats(containerEl);

		// Quick capture demo
		this.renderQuickCaptureDemo(containerEl);
	}

	/**
	 * Render task format examples
	 */
	private renderTaskFormats(containerEl: HTMLElement) {
		const formatsSection = containerEl.createDiv("task-formats-section");
		formatsSection.createEl("h3", { text: t("Task Format Examples") });

		// Basic task format
		const basicFormat = formatsSection.createDiv("format-example");
		basicFormat.createEl("h4", { text: t("Basic Task") });
		basicFormat.createEl("code", {
			text: "- [ ] Complete project documentation",
		});

		// Emoji format
		const emojiFormat = formatsSection.createDiv("format-example");
		emojiFormat.createEl("h4", { text: t("With Emoji Metadata") });
		emojiFormat.createEl("code", {
			text: "- [ ] Complete project documentation 📅 2024-01-15 🔺 #project/docs",
		});

		const emojiLegend = emojiFormat.createDiv("format-legend");
		emojiLegend.createEl("small", {
			text: t(
				"📅 = Due date, 🔺 = High priority, #project/ = Docs project tag",
			),
		});

		// Dataview format
		const dataviewFormat = formatsSection.createDiv("format-example");
		dataviewFormat.createEl("h4", { text: t("With Dataview Metadata") });
		dataviewFormat.createEl("code", {
			text: "- [ ] Complete project documentation [due:: 2024-01-15] [priority:: high] [project:: docs]",
		});

		// Mixed format
		const mixedFormat = formatsSection.createDiv("format-example");
		mixedFormat.createEl("h4", { text: t("Mixed Format") });
		mixedFormat.createEl("code", {
			text: "- [ ] Complete project documentation 📅 2024-01-15 [priority:: high] @work",
		});

		const mixedLegend = mixedFormat.createDiv("format-legend");
		mixedLegend.createEl("small", {
			text: t("Combine emoji and dataview syntax as needed"),
		});

		// Status markers
		const statusSection = formatsSection.createDiv("status-markers");
		statusSection.createEl("h4", { text: t("Task Status Markers") });

		const statusList = statusSection.createEl("ul", { cls: "status-list" });
		const statusMarkers = [
			{ marker: "[ ]", description: t("Not started") },
			{ marker: "[x]", description: t("Completed") },
			{ marker: "[/]", description: t("In progress") },
			{ marker: "[?]", description: t("Planned") },
			{ marker: "[-]", description: t("Abandoned") },
		];

		statusMarkers.forEach((status) => {
			const item = statusList.createEl("li");
			item.createEl("code", { text: status.marker });
			item.createSpan().setText(" - " + status.description);
		});

		// Metadata symbols
		const metadataSection = formatsSection.createDiv("metadata-symbols");
		metadataSection.createEl("h4", { text: t("Common Metadata Symbols") });

		const symbolsList = metadataSection.createEl("ul", {
			cls: "symbols-list",
		});
		const symbols = [
			{ symbol: "📅", description: t("Due date") },
			{ symbol: "🛫", description: t("Start date") },
			{ symbol: "⏳", description: t("Scheduled date") },
			{ symbol: "🔺", description: t("High priority") },
			{ symbol: "⏫", description: t("Higher priority") },
			{ symbol: "🔼", description: t("Medium priority") },
			{ symbol: "🔽", description: t("Lower priority") },
			{ symbol: "⏬", description: t("Lowest priority") },
			{ symbol: "🔁", description: t("Recurring task") },
			{ symbol: "#", description: t("Project/tag") },
			{ symbol: "@", description: t("Context") },
		];

		symbols.forEach((symbol) => {
			const item = symbolsList.createEl("li");
			item.createSpan().setText(
				symbol.symbol + " - " + symbol.description,
			);
		});
	}

	/**
	 * Render quick capture demo
	 */
	private renderQuickCaptureDemo(containerEl: HTMLElement) {
		const quickCaptureSection = containerEl.createDiv(
			"quick-capture-section",
		);
		quickCaptureSection.createEl("h3", { text: t("Quick Capture") });

		const demoContent = quickCaptureSection.createDiv("demo-content");
		demoContent.createEl("p", {
			text: t(
				"Use quick capture panel to quickly capture tasks from anywhere in Obsidian.",
			),
		});

		// Demo button
		const demoButton = demoContent.createEl("button", {
			text: t("Try Quick Capture"),
			cls: "mod-cta demo-button",
		});

		demoButton.addEventListener("click", () => {
			// Try to open quick capture modal
			try {
				if (this.plugin.settings.quickCapture?.enableQuickCapture) {
					// Use the direct import of QuickCaptureModal
					new QuickCaptureModal(this.plugin.app, this.plugin).open();
				} else {
					// Show info that quick capture will be enabled
					new Notice(
						t(
							"Quick capture is now enabled in your configuration!",
						),
						3000,
					);
				}
			} catch (error) {
				console.error("Failed to open quick capture:", error);
				new Notice(
					t("Failed to open quick capture. Please try again later."),
					3000,
				);
			}
		});
	}

	/**
	 * Render interactive practice section
	 */
	private renderInteractivePractice(containerEl: HTMLElement) {
		const practiceSection = containerEl.createDiv("practice-section");
		practiceSection.createEl("h3", { text: t("Try It Yourself") });

		practiceSection.createEl("p", {
			text: t("Practice creating a task with the format you prefer:"),
		});

		let practiceInput: TextAreaComponent;

		new Setting(practiceSection)
			.setName(t("Practice Task"))
			.setDesc(t("Enter a task using any of the formats shown above"))
			.addTextArea((textArea) => {
				practiceInput = textArea;
				textArea
					.setPlaceholder(t("- [ ] Your task here"))
					.setValue("")
					.then(() => {
						textArea.inputEl.rows = 3;
						textArea.inputEl.style.width = "100%";
					});
			});

		// Validation feedback
		const feedback = practiceSection.createDiv("practice-feedback");

		// Validate button
		const validateButton = practiceSection.createEl("button", {
			text: t("Validate Task"),
			cls: "demo-button",
		});

		validateButton.addEventListener("click", () => {
			const input = practiceInput.getValue().trim();
			this.validateTaskFormat(input, feedback);
		});
	}

	/**
	 * Validate task format
	 */
	private validateTaskFormat(input: string, feedbackEl: HTMLElement) {
		feedbackEl.empty();

		if (!input) {
			feedbackEl.createEl("div", {
				text: t("Please enter a task to validate"),
				cls: "validation-message validation-warning",
			});
			return;
		}

		// Check if it's a valid task format
		const isValidTask = /^-\s*\[.\]\s*.+/.test(input);

		if (!isValidTask) {
			feedbackEl.createEl("div", {
				text: t(
					"This doesn't look like a valid task. Tasks should start with '- [ ]'",
				),
				cls: "validation-message validation-error",
			});
			return;
		}

		// Check for metadata
		const hasEmojiMetadata = /[📅🛫⏳🔺⏫🔼🔽⏬🔁]/.test(input);
		const hasDataviewMetadata = /\[[\w]+::[^\]]+\]/.test(input);
		const hasProjectTag = /#[\w\/]+/.test(input);
		const hasContext = /@[\w]+/.test(input);

		const successMessage = feedbackEl.createEl("div", {
			cls: "validation-message validation-success",
		});
		const checkIcon = successMessage.createSpan();
		setIcon(checkIcon, "check");
		successMessage.createSpan().setText(" " + t("Valid task format!"));

		// Provide feedback on detected metadata
		const detectedFeatures = [];
		if (hasEmojiMetadata) detectedFeatures.push(t("Emoji metadata"));
		if (hasDataviewMetadata) detectedFeatures.push(t("Dataview metadata"));
		if (hasProjectTag) detectedFeatures.push(t("Project tags"));
		if (hasContext) detectedFeatures.push(t("Context"));

		if (detectedFeatures.length > 0) {
			feedbackEl.createEl("div", {
				text: t("Detected features: ") + detectedFeatures.join(", "),
				cls: "validation-message validation-info",
			});
		}
	}
}
