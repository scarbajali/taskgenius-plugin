import { t } from "@/translations/helper";
import type TaskProgressBarPlugin from "@/index";
import type { OnboardingController } from "../OnboardingController";
import { TaskCreationGuide } from "../TaskCreationGuide";

/**
 * Task Guide Step - Learn how to create tasks
 */
export class TaskGuideStep {
	/**
	 * Render the task guide step
	 */
	static render(
		headerEl: HTMLElement,
		contentEl: HTMLElement,
		_controller: OnboardingController,
		plugin: TaskProgressBarPlugin
	) {
		// Clear
		headerEl.empty();
		contentEl.empty();

		// Header
		headerEl.createEl("h1", { text: t("Create Your First Task") });
		headerEl.createEl("p", {
			text: t(
				"Learn the fastest ways to capture and format tasks inside Task Genius"
			),
			cls: "onboarding-subtitle",
		});

		// Use the shared task creation guide to render examples and demos
		const guide = new TaskCreationGuide(plugin);
		guide.render(contentEl);
	}
}
