import { Setting, debounce, TextComponent, Notice } from "obsidian";
import { OccurrenceLevel, RewardItem } from "src/common/setting-definition";
import { TaskProgressBarSettingTab } from "src/setting";
import { t } from "src/translations/manager";
import { ImageSuggest } from "@/components/ui/inputs/AutoComplete";

export function renderRewardSettingsTab(
	settingTab: TaskProgressBarSettingTab,
	containerEl: HTMLElement
) {
	new Setting(containerEl)
		.setName(t("Rewards"))
		.setDesc(
			t(
				"Configure rewards for completing tasks. Define items, their occurrence chances, and conditions."
			)
		)
		.setHeading();

	// --- Enable Rewards ---
	new Setting(containerEl)
		.setName(t("Enable rewards"))
		.setDesc(t("Toggle to enable or disable the reward system."))
		.addToggle((toggle) =>
			toggle
				.setValue(settingTab.plugin.settings.rewards.enableRewards)
				.onChange(async (value) => {
					settingTab.plugin.settings.rewards.enableRewards = value;
					settingTab.applySettingsUpdate();
					setTimeout(() => {
						settingTab.display();
					}, 200);
				})
		);

	if (!settingTab.plugin.settings.rewards.enableRewards) {
		return; // Don't render the rest if rewards are disabled
	}

	// --- Reward Display Type ---
	new Setting(containerEl)
		.setName(t("Reward display type"))
		.setDesc(t("Choose how rewards are displayed when earned."))
		.addDropdown((dropdown) => {
			dropdown
				.addOption("modal", t("Modal dialog"))
				.addOption("notice", t("Notice (Auto-accept)"))
				.setValue(
					settingTab.plugin.settings.rewards.showRewardType || "modal"
				)
				.onChange(async (value: "modal" | "notice") => {
					settingTab.plugin.settings.rewards.showRewardType = value;
					settingTab.applySettingsUpdate();
				});
		});

	// --- Occurrence Levels ---
	new Setting(containerEl)
		.setName(t("Occurrence levels"))
		.setDesc(
			t("Define different levels of reward rarity and their probability.")
		)
		.setHeading();

	const occurrenceLevelsContainer = containerEl.createDiv({
		cls: "rewards-levels-container",
	});

	const debounceChanceUpdate = debounce(
		(
			text: TextComponent,
			level: OccurrenceLevel,
			value: string,
			index: number
		) => {
			const chance = parseInt(value, 10);
			if (!isNaN(chance) && chance >= 0 && chance <= 100) {
				settingTab.plugin.settings.rewards.occurrenceLevels[
					index
				].chance = chance;
				settingTab.applySettingsUpdate();
			} else {
				// Optional: Provide feedback for invalid input
				new Notice(t("Chance must be between 0 and 100."));
				text.setValue(level.chance.toString()); // Revert
			}
		},
		1000
	);

	const debounceNameUpdate = debounce((value: string, index: number) => {
		settingTab.plugin.settings.rewards.occurrenceLevels[index].name =
			value.trim();
		settingTab.applySettingsUpdate();
	}, 1000);

	settingTab.plugin.settings.rewards.occurrenceLevels.forEach(
		(level, index) => {
			const levelSetting = new Setting(occurrenceLevelsContainer)
				.setClass("rewards-level-row")
				.addText((text) =>
					text
						.setPlaceholder(t("Level Name (e.g., common)"))
						.setValue(level.name)
						.onChange((value) => {
							debounceNameUpdate(value, index);
						})
				)
				.addText((text) =>
					text
						.setPlaceholder(t("Chance (%)"))
						.setValue(level.chance.toString())
						.onChange((value) => {
							debounceChanceUpdate(text, level, value, index);
						})
				)
				.addButton((button) =>
					button
						.setIcon("trash")
						.setTooltip(t("Delete Level"))
						.setClass("mod-warning")
						.onClick(() => {
							settingTab.plugin.settings.rewards.occurrenceLevels.splice(
								index,
								1
							);
							settingTab.applySettingsUpdate();

							setTimeout(() => {
								settingTab.display();
							}, 200);
						})
				);
		}
	);

	new Setting(occurrenceLevelsContainer).addButton((button) =>
		button
			.setButtonText(t("Add occurrence level"))
			.setCta()
			.onClick(() => {
				const newLevel: OccurrenceLevel = {
					name: t("New Level"),
					chance: 0,
				};
				settingTab.plugin.settings.rewards.occurrenceLevels.push(
					newLevel
				);
				settingTab.applySettingsUpdate();
				setTimeout(() => {
					settingTab.display();
				}, 200);
			})
	);

	// --- Reward Items ---
	new Setting(containerEl)
		.setName(t("Reward items"))
		.setDesc(t("Manage the specific rewards that can be obtained."))
		.setHeading();

	const rewardItemsContainer = containerEl.createDiv({
		cls: "rewards-items-container",
	});

	// Get available occurrence level names for dropdown
	const levelNames = settingTab.plugin.settings.rewards.occurrenceLevels.map(
		(l) => l.name
	);
	if (levelNames.length === 0) levelNames.push(t("No levels defined"));

	settingTab.plugin.settings.rewards.rewardItems.forEach((item, index) => {
		const itemSetting = new Setting(rewardItemsContainer)
			.setClass("rewards-item-row")
			.addTextArea((text) =>
				text // Use TextArea for potentially longer names
					.setPlaceholder(t("Reward Name/Text"))
					.setValue(item.name)
					.onChange((value) => {
						settingTab.plugin.settings.rewards.rewardItems[
							index
						].name = value;
						settingTab.applySettingsUpdate();
					})
			)
			.addDropdown((dropdown) => {
				levelNames.forEach((levelName) => {
					dropdown.addOption(levelName, levelName);
				});
				dropdown
					.setValue(item.occurrence || levelNames[0]) // Handle missing/default
					.onChange((value) => {
						settingTab.plugin.settings.rewards.rewardItems[
							index
						].occurrence = value;
						settingTab.applySettingsUpdate();
					});
			})
			.addText((text) => {
				text.inputEl.ariaLabel = t("Inventory (-1 for ∞)");
				text.setPlaceholder(t("Inventory (-1 for ∞)")) // For Inventory
					.setValue(item.inventory.toString())
					.onChange((value) => {
						const inventory = parseInt(value, 10);
						if (!isNaN(inventory)) {
							settingTab.plugin.settings.rewards.rewardItems[
								index
							].inventory = inventory;
							settingTab.applySettingsUpdate();
						} else {
							new Notice(t("Invalid inventory number."));
							text.setValue(item.inventory.toString()); // Revert
						}
					});
			})
			.addText((text) =>
				text // For Condition
					.setPlaceholder(t("Condition (e.g., #tag AND project)"))
					.setValue(item.condition || "")
					.onChange((value) => {
						settingTab.plugin.settings.rewards.rewardItems[
							index
						].condition = value.trim() || undefined; // Store as undefined if empty
						settingTab.applySettingsUpdate();
					})
			)
			.addText((text) => {
				text.setPlaceholder(t("Image url (optional)")) // For Image URL
					.setValue(item.imageUrl || "")
					.onChange((value) => {
						settingTab.plugin.settings.rewards.rewardItems[
							index
						].imageUrl = value.trim() || undefined; // Store as undefined if empty
						settingTab.applySettingsUpdate();
					});

				new ImageSuggest(
					settingTab.app,
					text.inputEl,
					settingTab.plugin
				);
			})
			.addButton((button) =>
				button
					.setIcon("trash")
					.setTooltip(t("Delete reward item"))
					.setClass("mod-warning")
					.onClick(() => {
						settingTab.plugin.settings.rewards.rewardItems.splice(
							index,
							1
						);
						settingTab.applySettingsUpdate();
						setTimeout(() => {
							settingTab.display();
						}, 200);
					})
			);
		// Add some spacing or dividers if needed visually
		rewardItemsContainer.createEl("hr", {
			cls: "rewards-item-divider",
		});
	});

	if (settingTab.plugin.settings.rewards.rewardItems.length === 0) {
		rewardItemsContainer.createEl("p", {
			text: t("No reward items defined yet."),
			cls: "setting-item-description",
		});
	}

	new Setting(rewardItemsContainer).addButton((button) =>
		button
			.setButtonText(t("Add reward item"))
			.setCta()
			.onClick(() => {
				const newItem: RewardItem = {
					id: `reward-${Date.now()}-${Math.random()
						.toString(36)
						.substring(2, 7)}`, // Simple unique ID
					name: t("New Reward"),
					occurrence:
						settingTab.plugin.settings.rewards.occurrenceLevels[0]
							?.name || "default", // Use first level or default
					inventory: -1, // Default to infinite
				};
				settingTab.plugin.settings.rewards.rewardItems.push(newItem);
				settingTab.applySettingsUpdate();
				setTimeout(() => {
					settingTab.display();
				}, 200);
			})
	);
}
