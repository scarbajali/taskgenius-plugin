import { Setting } from "obsidian";
import { TaskProgressBarSettingTab } from "@/setting";
import { t } from "@/translations/helper";
import { ConfirmModal } from "@/components/ui/modals/ConfirmModal";

export function renderBasesSettingsTab(settingTab: TaskProgressBarSettingTab,
	containerEl: HTMLElement
) {
    new Setting(containerEl)
		.setName(t("Base View"))
		.setDesc(
			t(
				"Advanced view management features that extend the default Task Genius views with additional functionality."
			)
		)
		.setHeading();

	const descFragment = new DocumentFragment();
	descFragment.createEl("span", {
		text: t(
			"Enable Base View functionality. This feature provides enhanced view management capabilities but may be affected by future Obsidian API changes. You may need to restart Obsidian to see the changes."
		),
	});

	descFragment.createEl("div", {
		text: t(
			"You need to close all bases view if you already create task view in them and remove unused view via edit them manually when disable this feature."
		),
		cls: "mod-warning",
	});

	new Setting(containerEl)
		.setName(t("Enable Base View"))
		.setDesc(descFragment)
		.addToggle((toggle) =>
			toggle
				.setValue(
					settingTab.plugin.settings.betaTest?.enableBaseView || false
				)
				.onChange(async (value) => {
					if (value) {
						new ConfirmModal(settingTab.plugin, {
							title: t("Enable Base View"),
							message: t(
								"Enable Base View functionality. This feature provides enhanced view management capabilities but may be affected by future Obsidian API changes."
							),
							confirmText: t("Enable"),
							cancelText: t("Cancel"),
							onConfirm: (confirmed: boolean) => {
								if (!confirmed) {
									setTimeout(() => {
										toggle.setValue(false);
										settingTab.display();
									}, 200);
									return;
								}

								if (!settingTab.plugin.settings.betaTest) {
									settingTab.plugin.settings.betaTest = {
										enableBaseView: false,
									};
								}
								settingTab.plugin.settings.betaTest.enableBaseView =
									confirmed;
								settingTab.applySettingsUpdate();
								setTimeout(() => {
									settingTab.display();
								}, 200);
							},
						}).open();
					} else {
						if (settingTab.plugin.settings.betaTest) {
							settingTab.plugin.settings.betaTest.enableBaseView =
								false;
						}
						settingTab.applySettingsUpdate();
						setTimeout(() => {
							settingTab.display();
						}, 200);
					}
				})
		);
}