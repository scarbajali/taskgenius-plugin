import { t } from "@/translations/helper";

/**
 * Format Examples Component - Show task format examples
 */
export class FormatExamples {
	/**
	 * Render format examples
	 */
	static render(container: HTMLElement) {
		const section = container.createDiv("task-formats-section");
		section.createEl("h3", { text: t("Task Format Examples") });

		// Basic task
		this.addExample(
			section,
			t("Basic task"),
			"- [ ] Complete project documentation"
		);

		// With emoji
		this.addExample(
			section,
			t("With emoji metadata"),
			"- [ ] Complete project documentation 📅 2024-12-31 🔺 #project",
			t("📅 = Due date, 🔺 = High priority, #project = Project tag")
		);

		// With Dataview
		this.addExample(
			section,
			t("With Dataview syntax"),
			"- [ ] Complete project documentation [due:: 2024-12-31] [priority:: high]"
		);

		// Mixed format
		this.addExample(
			section,
			t("Mixed format"),
			"- [ ] Complete project documentation 📅 2024-12-31 [priority:: high]",
			t("Combine emoji and Dataview syntax as needed")
		);

		// Status markers
		this.renderStatusMarkers(section);

		// Metadata symbols
		this.renderMetadataSymbols(section);
	}

	/**
	 * Add a format example
	 */
	private static addExample(
		container: HTMLElement,
		title: string,
		code: string,
		legend?: string
	) {
		const example = container.createDiv("format-example");
		example.createEl("h4", { text: title });
		example.createEl("code", { text: code });

		if (legend) {
			const legendEl = example.createDiv("format-legend");
			legendEl.createEl("small", { text: legend });
		}
	}

	/**
	 * Render status markers
	 */
	private static renderStatusMarkers(container: HTMLElement) {
		const section = container.createDiv("status-markers");
		section.createEl("h4", { text: t("Task Status Markers") });

		const list = section.createEl("ul", { cls: "status-list" });

		const markers = [
			{ marker: "[ ]", desc: t("Not started") },
			{ marker: "[x]", desc: t("Completed") },
			{ marker: "[/]", desc: t("In progress") },
			{ marker: "[?]", desc: t("Planned") },
			{ marker: "[-]", desc: t("Abandoned") },
		];

		markers.forEach((m) => {
			const item = list.createEl("li");
			item.createEl("code", { text: m.marker });
			item.createSpan().setText(" - " + m.desc);
		});
	}

	/**
	 * Render metadata symbols
	 */
	private static renderMetadataSymbols(container: HTMLElement) {
		const section = container.createDiv("metadata-symbols");
		section.createEl("h4", { text: t("Common Metadata Symbols") });

		const list = section.createEl("ul", { cls: "symbols-list" });

		const symbols = [
			{ symbol: "📅", desc: t("Due date") },
			{ symbol: "🛫", desc: t("Start date") },
			{ symbol: "⏳", desc: t("Scheduled date") },
			{ symbol: "🔺", desc: t("High priority") },
			{ symbol: "⏫", desc: t("Higher priority") },
			{ symbol: "🔼", desc: t("Medium priority") },
			{ symbol: "#", desc: t("Project/tag") },
			{ symbol: "@", desc: t("Context") },
		];

		symbols.forEach((s) => {
			const item = list.createEl("li");
			item.createSpan().setText(s.symbol + " - " + s.desc);
		});
	}
}
