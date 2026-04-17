import { App, Modal, Setting } from "obsidian";
import { RewardItem } from '@/common/setting-definition';
import { t } from '@/translations/helper';
import "@/styles/reward.scss";

export class RewardModal extends Modal {
	private reward: RewardItem;
	private onChoose: (accepted: boolean) => void; // Callback function

	constructor(
		app: App,
		reward: RewardItem,
		onChoose: (accepted: boolean) => void
	) {
		super(app);
		this.reward = reward;
		this.onChoose = onChoose;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty(); // Clear previous content

		this.modalEl.toggleClass("reward-modal", true);

		contentEl.addClass("reward-modal-content");

		// Add a title
		this.setTitle("🎉 " + t("You've Earned a Reward!") + " 🎉");

		// Display reward name
		contentEl.createEl("p", {
			text: t("Your reward:") + " " + this.reward.name,
			cls: "reward-name",
		});

		// Display reward image if available
		if (this.reward.imageUrl) {
			const imgContainer = contentEl.createDiv({
				cls: "reward-image-container",
			});
			// Basic check for local vs web URL (can be improved)
			if (this.reward.imageUrl.startsWith("http")) {
				imgContainer.createEl("img", {
					attr: { src: this.reward.imageUrl }, // Use attr for attributes like src
					cls: "reward-image",
				});
			} else {
				// Assume it might be a vault path - needs resolving
				const imageFile = this.app.vault.getFileByPath(
					this.reward.imageUrl
				);
				if (imageFile) {
					imgContainer.createEl("img", {
						attr: {
							src: this.app.vault.getResourcePath(imageFile),
						}, // Use TFile reference if possible
						cls: "reward-image",
					});
				} else {
					imgContainer.createEl("p", {
						text: `(${t("Image not found:")} ${
							this.reward.imageUrl
						})`,
						cls: "reward-image-error",
					});
				}
			}
		}

		// Add spacing before buttons
		contentEl.createEl("div", { cls: "reward-spacer" });

		// Add buttons
		new Setting(contentEl)
			.addButton((button) =>
				button
					.setButtonText(t("Claim Reward"))
					.setCta() // Makes the button more prominent
					.onClick(() => {
						this.onChoose(true); // Call callback with true (accepted)
						this.close();
					})
			)
			.addButton((button) =>
				button.setButtonText(t("Skip")).onClick(() => {
					this.onChoose(false); // Call callback with false (skipped)
					this.close();
				})
			);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty(); // Clean up the modal content
	}
}
