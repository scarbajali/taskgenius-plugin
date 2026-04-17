import {
	Modal,
	App,
	Setting,
	DropdownComponent,
	ExtraButtonComponent,
} from "obsidian";
import { t } from '@/translations/helper';

// Stage edit modal
export class StageEditModal extends Modal {
	stage: any;
	allStages: any[];
	onSave: (stage: any) => void;
	renderStageTypeSettings: () => void;

	constructor(
		app: App,
		stage: any,
		allStages: any[],
		onSave: (stage: any) => void
	) {
		super(app);
		this.stage = JSON.parse(JSON.stringify(stage)); // Deep copy
		this.allStages = allStages;
		this.onSave = onSave;
		// Initialize the renderStageTypeSettings as a no-op function that will be replaced in onOpen
		this.renderStageTypeSettings = () => {};
	}

	onOpen() {
		const { contentEl, titleEl } = this;

		this.modalEl.toggleClass("modal-stage-definition", true);

		titleEl.setText(t("Edit Stage"));

		// Basic stage information
		new Setting(contentEl)
			.setName(t("Stage name"))
			.setDesc(t("A descriptive name for this workflow stage"))
			.addText((text) => {
				text.setValue(this.stage.name || "")
					.setPlaceholder(t("Stage name"))
					.onChange((value) => {
						this.stage.name = value;
					});
			});

		new Setting(contentEl)
			.setName(t("Stage ID"))
			.setDesc(t("A unique identifier for the stage (used in tags)"))
			.addText((text) => {
				text.setValue(this.stage.id || "")
					.setPlaceholder("stage_id")
					.onChange((value) => {
						this.stage.id = value;
					});
			});

		new Setting(contentEl)
			.setName(t("Stage type"))
			.setDesc(t("The type of this workflow stage"))
			.addDropdown((dropdown) => {
				dropdown
					.addOption("linear", t("Linear (sequential)"))
					.addOption("cycle", t("Cycle (repeatable)"))
					.addOption("terminal", t("Terminal (end stage)"))
					.setValue(this.stage.type || "linear")
					.onChange((value: "linear" | "cycle" | "terminal") => {
						this.stage.type = value;

						// If changing to/from cycle, update the UI
						this.renderStageTypeSettings();
					});
			});

		// Container for type-specific settings
		const typeSettingsContainer = contentEl.createDiv({
			cls: "stage-type-settings",
		});

		// Function to render type-specific settings
		const renderTypeSettings = () => {
			typeSettingsContainer.empty();

			if (this.stage.type === "linear" || this.stage.type === "cycle") {
				// For linear and cycle stages, show next stage options
				if (this.allStages.length > 0) {
					new Setting(typeSettingsContainer)
						.setName(t("Next stage"))
						.setDesc(t("The stage to proceed to after this one"))
						.addDropdown((dropdown) => {
							// Add all other stages as options
							this.allStages.forEach((s) => {
								if (s.id !== this.stage.id) {
									dropdown.addOption(s.id, s.name);
								}
							});

							// Set current value if it exists
							if (
								typeof this.stage.next === "string" &&
								this.stage.next
							) {
								dropdown.setValue(this.stage.next);
							}

							dropdown.onChange((value) => {
								this.stage.next = value;
							});
						});
				}

				// For cycle stages, add subStages
				if (this.stage.type === "cycle") {
					// SubStages section
					const subStagesSection = typeSettingsContainer.createDiv({
						cls: "substages-section",
					});

					new Setting(subStagesSection)
						.setName(t("Sub-stages"))
						.setDesc(t("Define cycle sub-stages (optional)"));

					const subStagesContainer = subStagesSection.createDiv({
						cls: "substages-container",
					});

					// Function to render sub-stages
					const renderSubStages = () => {
						subStagesContainer.empty();

						if (
							!this.stage.subStages ||
							this.stage.subStages.length === 0
						) {
							subStagesContainer.createEl("p", {
								text: t("No sub-stages defined yet."),
								cls: "no-substages-message",
							});
						} else {
							const subStagesList = subStagesContainer.createEl(
								"ul",
								{
									cls: "substages-list",
								}
							);

							this.stage.subStages.forEach(
								(subStage: any, index: number) => {
									const subStageItem = subStagesList.createEl(
										"li",
										{
											cls: "substage-item",
										}
									);

									const subStageNameContainer =
										subStageItem.createDiv({
											cls: "substage-name-container",
										});

									// Name
									const nameInput =
										subStageNameContainer.createEl(
											"input",
											{
												type: "text",
												value: subStage.name || "",
												placeholder:
													t("Sub-stage name"),
											}
										);
									nameInput.addEventListener("change", () => {
										subStage.name = nameInput.value;
									});

									// ID
									const idInput =
										subStageNameContainer.createEl(
											"input",
											{
												type: "text",
												value: subStage.id || "",
												placeholder: t("Sub-stage ID"),
											}
										);
									idInput.addEventListener("change", () => {
										subStage.id = idInput.value;
									});

									// Next sub-stage dropdown (if more than one sub-stage)
									if (this.stage.subStages.length > 1) {
										const nextContainer =
											subStageNameContainer.createDiv({
												cls: "substage-next-container",
											});
										nextContainer.createEl("span", {
											text: t("Next: "),
										});

										const dropdown = new DropdownComponent(
											nextContainer
										);

										// Add all other sub-stages as options
										this.stage.subStages.forEach(
											(s: any) => {
												if (s.id !== subStage.id) {
													dropdown.addOption(
														s.id,
														s.name
													);
												}
											}
										);

										// Set the current value
										if (subStage.next) {
											dropdown.setValue(subStage.next);
										}

										// Handle changes
										dropdown.onChange((value) => {
											subStage.next = value;
										});
									}

									subStageItem.createEl("div", {}, (el) => {
										const button = new ExtraButtonComponent(
											el
										)
											.setIcon("trash")
											.setTooltip(t("Remove"))
											.onClick(() => {
												this.stage.subStages.splice(
													index,
													1
												);
												renderSubStages();
											});

										button.extraSettingsEl.toggleClass(
											"substage-remove-button",
											true
										);
									});
								}
							);
						}

						// Add button for new sub-stage
						const addSubStageButton = subStagesContainer.createEl(
							"button",
							{
								cls: "add-substage-button",
								text: t("Add Sub-stage"),
							}
						);
						addSubStageButton.addEventListener("click", () => {
							if (!this.stage.subStages) {
								this.stage.subStages = [];
							}

							// Create a new sub-stage with proper typing
							const newSubStage: {
								id: string;
								name: string;
								next?: string;
							} = {
								id: this.generateUniqueId(),
								name: t("New Sub-stage"),
							};

							// If there are existing sub-stages, set the next property
							if (this.stage.subStages.length > 0) {
								// Get the last sub-stage
								const lastSubStage =
									this.stage.subStages[
										this.stage.subStages.length - 1
									];

								// Set the last sub-stage's next property to the new sub-stage
								if (lastSubStage) {
									// Ensure lastSubStage has a next property
									if (!("next" in lastSubStage)) {
										// Add next property if it doesn't exist
										(lastSubStage as any).next =
											newSubStage.id;
									} else {
										lastSubStage.next = newSubStage.id;
									}
								}

								// Set the new sub-stage's next property to the first sub-stage (cycle)
								if (this.stage.subStages[0]) {
									newSubStage.next =
										this.stage.subStages[0].id;
								}
							}

							this.stage.subStages.push(newSubStage);
							renderSubStages();
						});
					};

					// Initial render of sub-stages
					renderSubStages();
				}

				// Can proceed to section (additional stages that can follow this one)
				const canProceedToSection = typeSettingsContainer.createDiv({
					cls: "can-proceed-to-section",
				});

				new Setting(canProceedToSection)
					.setName(t("Can proceed to"))
					.setDesc(
						t(
							"Additional stages that can follow this one (for right-click menu)"
						)
					);

				const canProceedToContainer = canProceedToSection.createDiv({
					cls: "can-proceed-to-container",
				});

				// Function to render canProceedTo options
				const renderCanProceedTo = () => {
					canProceedToContainer.empty();

					if (
						!this.stage.canProceedTo ||
						this.stage.canProceedTo.length === 0
					) {
						canProceedToContainer.createEl("p", {
							text: t(
								"No additional destination stages defined."
							),
							cls: "no-can-proceed-message",
						});
					} else {
						const canProceedList = canProceedToContainer.createEl(
							"ul",
							{
								cls: "can-proceed-list",
							}
						);

						this.stage.canProceedTo.forEach(
							(stageId: string, index: number) => {
								// Find the corresponding stage
								const targetStage = this.allStages.find(
									(s) => s.id === stageId
								);

								if (targetStage) {
									const proceedItem = canProceedList.createEl(
										"li",
										{
											cls: "can-proceed-item",
										}
									);

									const setting = new Setting(
										proceedItem
									).setName(targetStage.name);

									// Remove button
									setting.addExtraButton((button) => {
										button
											.setIcon("trash")
											.setTooltip(t("Remove"))
											.onClick(() => {
												this.stage.canProceedTo.splice(
													index,
													1
												);
												renderCanProceedTo();
											});
									});
								}
							}
						);
					}

					// Add dropdown to add new destination
					if (this.allStages.length > 0) {
						const addContainer = canProceedToContainer.createDiv({
							cls: "add-can-proceed-container",
						});

						let dropdown: DropdownComponent;

						addContainer.createEl(
							"div",
							{
								cls: "add-can-proceed-select",
							},
							(el) => {
								dropdown = new DropdownComponent(el);
								this.allStages.forEach((s) => {
									if (
										s.id !== this.stage.id &&
										(!this.stage.canProceedTo ||
											!this.stage.canProceedTo.includes(
												s.id
											))
									) {
										dropdown.addOption(s.id, s.name);
									}
								});
							}
						);

						// Add all other stages as options (that aren't already in canProceedTo)

						const addButton = addContainer.createEl("button", {
							cls: "add-can-proceed-button",
							text: t("Add"),
						});
						addButton.addEventListener("click", () => {
							if (dropdown.selectEl.value) {
								if (!this.stage.canProceedTo) {
									this.stage.canProceedTo = [];
								}
								this.stage.canProceedTo.push(
									dropdown.selectEl.value
								);
								renderCanProceedTo();
							}
						});
					}
				};

				// Initial render of canProceedTo
				renderCanProceedTo();
			}
		};

		// Method to re-render the stage type settings when the type changes
		this.renderStageTypeSettings = renderTypeSettings;

		// Initial render of type settings
		renderTypeSettings();

		// Save and Cancel buttons
		const buttonContainer = contentEl.createDiv({ cls: "stage-buttons" });

		const cancelButton = buttonContainer.createEl("button", {
			text: t("Cancel"),
			cls: "stage-cancel-button",
		});
		cancelButton.addEventListener("click", () => {
			this.close();
		});

		const saveButton = buttonContainer.createEl("button", {
			text: t("Save"),
			cls: "stage-save-button mod-cta",
		});
		saveButton.addEventListener("click", () => {
			// Validate the stage before saving
			if (!this.stage.name || !this.stage.id) {
				// Show error
				const errorMsg = contentEl.createDiv({
					cls: "stage-error-message",
					text: t("Name and ID are required."),
				});

				// Remove after 3 seconds
				setTimeout(() => {
					errorMsg.remove();
				}, 3000);

				return;
			}

			// Call the onSave callback
			this.onSave(this.stage);
			this.close();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	generateUniqueId(): string {
		return (
			Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
		);
	}
}
