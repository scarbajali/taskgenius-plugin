import { Modal, App, Setting } from "obsidian";
import TaskProgressBarPlugin from '@/index';
import { WorkflowStage } from '@/common/setting-definition';
import { t } from '@/translations/helper';
import { StageEditModal } from '@/components/features/workflow/modals/StageEditModal';

export class WorkflowDefinitionModal extends Modal {
	workflow: any;
	onSave: (workflow: any) => void;
	plugin: TaskProgressBarPlugin;

	constructor(
		app: App,
		plugin: TaskProgressBarPlugin,
		workflow: any,
		onSave: (workflow: any) => void
	) {
		super(app);
		this.plugin = plugin;
		this.workflow = JSON.parse(JSON.stringify(workflow)); // Deep copy to avoid direct mutation
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl, titleEl } = this;

		this.modalEl.toggleClass("modal-workflow-definition", true);
		titleEl.setText(
			this.workflow.id
				? t("Edit Workflow") + ": " + this.workflow.name
				: t("Create New Workflow")
		);

		// Basic workflow information
		const formContainer = contentEl.createDiv({ cls: "workflow-form" });

		new Setting(formContainer)
			.setName(t("Workflow name"))
			.setDesc(t("A descriptive name for the workflow"))
			.addText((text) => {
				text.setValue(this.workflow.name || "").onChange((value) => {
					this.workflow.name = value;
				});
			});

		new Setting(formContainer)
			.setName(t("Workflow ID"))
			.setDesc(t("A unique identifier for the workflow (used in tags)"))
			.addText((text) => {
				text.setValue(this.workflow.id || "")
					.setPlaceholder("unique_id")
					.onChange((value) => {
						this.workflow.id = value;
					});
			});

		new Setting(formContainer)
			.setName(t("Description"))
			.setDesc(t("Optional description for the workflow"))
			.addTextArea((textarea) => {
				textarea
					.setValue(this.workflow.description || "")
					.setPlaceholder(
						t("Describe the purpose and use of this workflow...")
					)
					.onChange((value) => {
						this.workflow.description = value;
					});

				textarea.inputEl.rows = 3;
				textarea.inputEl.cols = 40;
			});

		// Stages section
		const stagesSection = contentEl.createDiv({
			cls: "workflow-stages-section",
		});
		const stagesHeading = stagesSection.createEl("h2", {
			text: t("Workflow Stages"),
		});

		const stagesContainer = stagesSection.createDiv({
			cls: "workflow-stages-container",
		});

		// Function to render the stages list
		const renderStages = () => {
			stagesContainer.empty();

			if (!this.workflow.stages || this.workflow.stages.length === 0) {
				stagesContainer.createEl("p", {
					text: t(
						"No stages defined yet. Add a stage to get started."
					),
					cls: "no-stages-message",
				});
			} else {
				// Create a sortable list of stages
				const stagesList = stagesContainer.createEl("ul", {
					cls: "workflow-stages-list",
				});

				this.workflow.stages.forEach((stage: any, index: number) => {
					const stageItem = stagesList.createEl("li", {
						cls: "workflow-stage-item",
					});

					// Create a setting for each stage
					const stageSetting = new Setting(stageItem)
						.setName(stage.name)
						.setDesc(stage.type);

					stageSetting.settingEl.toggleClass(
						[
							"workflow-stage-type-cycle",
							"workflow-stage-type-linear",
							"workflow-stage-type-parallel",
							"workflow-stage-type-conditional",
							"workflow-stage-type-custom",
						].includes(stage.type)
							? stage.type
							: "workflow-stage-type-unknown",
						true
					);

					// Edit button
					stageSetting.addExtraButton((button) => {
						button
							.setIcon("pencil")
							.setTooltip(t("Edit"))
							.onClick(() => {
								new StageEditModal(
									this.app,
									stage,
									this.workflow.stages,
									(updatedStage) => {
										this.workflow.stages[index] =
											updatedStage;
										renderStages();
									}
								).open();
							});
					});

					// Move up button (if not first)
					if (index > 0) {
						stageSetting.addExtraButton((button) => {
							button
								.setIcon("arrow-up")
								.setTooltip(t("Move up"))
								.onClick(() => {
									// Swap with previous stage
									[
										this.workflow.stages[index - 1],
										this.workflow.stages[index],
									] = [
										this.workflow.stages[index],
										this.workflow.stages[index - 1],
									];
									renderStages();
								});
						});
					}

					// Move down button (if not last)
					if (index < this.workflow.stages.length - 1) {
						stageSetting.addExtraButton((button) => {
							button
								.setIcon("arrow-down")
								.setTooltip(t("Move down"))
								.onClick(() => {
									// Swap with next stage
									[
										this.workflow.stages[index],
										this.workflow.stages[index + 1],
									] = [
										this.workflow.stages[index + 1],
										this.workflow.stages[index],
									];
									renderStages();
								});
						});
					}

					// Delete button
					stageSetting.addExtraButton((button) => {
						button
							.setIcon("trash")
							.setTooltip(t("Delete"))
							.onClick(() => {
								// Remove the stage
								this.workflow.stages.splice(index, 1);
								renderStages();
							});
					});

					// If this stage has substages, show them
					if (
						stage.type === "cycle" &&
						stage.subStages &&
						stage.subStages.length > 0
					) {
						const subStagesList = stageItem.createEl("div", {
							cls: "workflow-substages-list",
						});

						stage.subStages.forEach(
							(subStage: any, index: number) => {
								const subStageItem = subStagesList.createEl(
									"div",
									{
										cls: "substage-item",
									}
								);

								const subStageSettingsContainer =
									subStageItem.createDiv({
										cls: "substage-settings-container",
									});

								// Create a single Setting for the entire substage
								const setting = new Setting(
									subStageSettingsContainer
								);

								setting.setName(
									t("Sub-stage") + " " + (index + 1)
								);

								// Add name text field
								setting.addText((text) => {
									text.setValue(subStage.name || "")
										.setPlaceholder(t("Sub-stage name"))
										.onChange((value) => {
											subStage.name = value;
										});
								});

								// Add ID text field
								setting.addText((text) => {
									text.setValue(subStage.id || "")
										.setPlaceholder(t("Sub-stage ID"))
										.onChange((value) => {
											subStage.id = value;
										});
								});

								// Add next stage dropdown if needed
								if (this.workflow.stages.length > 1) {
									setting.addDropdown((dropdown) => {
										dropdown.selectEl.addClass(
											"substage-next-select"
										);

										// Add label before dropdown
										const labelEl = createSpan({
											text: t("Next: "),
											cls: "setting-dropdown-label",
										});
										dropdown.selectEl.parentElement?.insertBefore(
											labelEl,
											dropdown.selectEl
										);

										// Add all other sub-stages as options
										this.workflow.stages.forEach(
											(s: WorkflowStage) => {
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
									});
								}

								// Add remove button
								setting.addExtraButton((button) => {
									button.setIcon("trash").onClick(() => {
										this.workflow.stages.splice(index, 1);
										renderStages();
									});
								});
							}
						);
					}
				});
			}

			// Add button for new sub-stage
			const addStageButton = stagesContainer.createEl("button", {
				cls: "workflow-add-stage-button",
				text: t("Add Sub-stage"),
			});
			addStageButton.addEventListener("click", () => {
				if (!this.workflow.stages) {
					this.workflow.stages = [];
				}

				// Create a new sub-stage
				const newSubStage: {
					id: string;
					name: string;
					next?: string;
				} = {
					id: this.generateUniqueId(),
					name: t("New Sub-stage"),
				};

				// If there are existing sub-stages, set the next property
				if (this.workflow.stages.length > 0) {
					// Get the last sub-stage
					const lastSubStage =
						this.workflow.stages[this.workflow.stages.length - 1];

					// Set the last sub-stage's next property to the new sub-stage
					if (lastSubStage) {
						// Ensure lastSubStage has a next property
						if (!("next" in lastSubStage)) {
							// Add next property if it doesn't exist
							(lastSubStage as any).next = newSubStage.id;
						} else {
							lastSubStage.next = newSubStage.id;
						}
					}

					// Set the new sub-stage's next property to the first sub-stage (cycle)
					if (this.workflow.stages[0]) {
						newSubStage.next = this.workflow.stages[0].id;
					}
				}

				this.workflow.stages.push(newSubStage);
				renderStages();
			});
		};

		// Initial render of stages
		renderStages();

		// Save and Cancel buttons
		const buttonContainer = contentEl.createDiv({
			cls: "workflow-buttons",
		});

		const cancelButton = buttonContainer.createEl("button", {
			text: t("Cancel"),
			cls: "workflow-cancel-button",
		});
		cancelButton.addEventListener("click", () => {
			this.close();
		});

		const saveButton = buttonContainer.createEl("button", {
			text: t("Save"),
			cls: "workflow-save-button mod-cta",
		});
		saveButton.addEventListener("click", () => {
			// Update the lastModified date
			if (!this.workflow.metadata) {
				this.workflow.metadata = {};
			}
			this.workflow.metadata.lastModified = new Date()
				.toISOString()
				.split("T")[0];

			// Call the onSave callback
			this.onSave(this.workflow);
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
