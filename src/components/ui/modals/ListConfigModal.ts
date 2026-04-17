import { Modal, Setting, ButtonComponent } from "obsidian";
import TaskProgressBarPlugin from "@/index";
import { t } from "@/translations/helper";
import "@/styles/modal.scss";

export interface ListConfigModalParams {
	title: string;
	description: string | DocumentFragment;
	placeholder?: string;
	values: string[];
	onSave: (values: string[]) => void;
}

/**
 * A modal for configuring list of strings with add/remove functionality
 * Used for settings that need multiple string values like headings, tags, etc.
 */
export class ListConfigModal extends Modal {
	private plugin: TaskProgressBarPlugin;
	private params: ListConfigModalParams;
	private currentValues: string[];
	private listContainer: HTMLElement;

	constructor(plugin: TaskProgressBarPlugin, params: ListConfigModalParams) {
		super(plugin.app);
		this.plugin = plugin;
		this.params = params;
		this.currentValues = [...params.values];
	}

	async onOpen() {
		this.titleEl.setText(this.params.title);
		this.contentEl.addClass("list-config-modal");

		// Description
		this.contentEl.createEl("p", {
			text: this.params.description,
			cls: "list-config-description",
		});

		// List container
		this.listContainer = this.contentEl.createDiv({
			cls: "list-config-container",
		});

		// Render the initial list
		this.renderList();

		// Buttons container
		const buttonsContainer = this.contentEl.createDiv({
			cls: "modal-button-container",
		});

		// Add item button
		new ButtonComponent(buttonsContainer)
			.setButtonText(t("Add Item"))
			.setIcon("plus")
			.onClick(() => {
				this.currentValues.push("");
				this.renderList();
				// Focus the new input
				const inputs = this.listContainer.querySelectorAll("input");
				const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
				if (lastInput) {
					lastInput.focus();
				}
			});

		// Save button
		new ButtonComponent(buttonsContainer)
			.setButtonText(t("Save"))
			.setCta()
			.onClick(() => {
				// Filter out empty values
				const cleanValues = this.currentValues
					.map((v) => v.trim())
					.filter((v) => v.length > 0);
				this.params.onSave(cleanValues);
				this.close();
			});

		// Cancel button
		new ButtonComponent(buttonsContainer)
			.setButtonText(t("Cancel"))
			.onClick(() => {
				this.close();
			});
	}

	private renderList() {
		this.listContainer.empty();

		if (this.currentValues.length === 0) {
			const emptyState = this.listContainer.createDiv({
				cls: "list-config-empty",
			});
			emptyState.createEl("p", {
				text: t(
					"No items configured. Click 'Add Item' to get started."
				),
				cls: "list-config-empty-text",
			});
			return;
		}

		this.currentValues.forEach((value, index) => {
			const itemContainer = this.listContainer.createDiv({
				cls: "list-config-item",
			});

			// Input field
			const input = itemContainer.createEl("input", {
				type: "text",
				value: value,
				placeholder: this.params.placeholder || t("Enter value"),
				cls: "list-config-input",
			});

			input.addEventListener("input", (e) => {
				const target = e.target as HTMLInputElement;
				this.currentValues[index] = target.value;
			});

			// Delete button
			const deleteBtn = itemContainer.createEl("button", {
				cls: "list-config-delete-btn",
				attr: {
					"aria-label": t("Delete item"),
					title: t("Delete this item"),
				},
			});
			deleteBtn.createEl("span", {
				text: "×",
				cls: "list-config-delete-icon",
			});

			deleteBtn.addEventListener("click", () => {
				this.currentValues.splice(index, 1);
				this.renderList();
			});
		});
	}

	onClose() {
		this.contentEl.empty();
	}
}
