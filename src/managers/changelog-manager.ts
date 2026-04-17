import { requestUrl } from "obsidian";
import {
	CHANGELOG_VIEW_TYPE,
	ChangelogView,
} from "@/components/features/changelog/ChangelogView";
import TaskProgressBarPlugin from "@/index";
import {
	cacheChangelog,
	getCachedChangelog,
} from "@/utils/changelog-cache";

const CHANGELOG_BASE_URL =
	"https://raw.githubusercontent.com/quorafind/obsidian-task-genius/master";
const RELEASE_BASE_URL =
	"https://github.com/quorafind/obsidian-task-genius/releases/tag";
const MAX_CHANGELOG_ENTRIES = 10;

interface ChangelogFetchResult {
	markdown: string;
	sourceUrl: string;
}

export class ChangelogManager {
	private currentVersionDisplayed: string | null = null;

	constructor(private plugin: TaskProgressBarPlugin) {}

	async openChangelog(version: string, isBeta: boolean): Promise<void> {
		try {
			const view = await this.getOrCreateView();

			if (this.currentVersionDisplayed === version) {
				this.plugin.app.workspace.revealLeaf(view.leaf);
				return;
			}

			const cached = getCachedChangelog(
				version,
				isBeta,
				this.plugin.app,
			);
			if (cached) {
				this.currentVersionDisplayed = version;
				await view.setContent({
					version,
					markdown: cached.markdown,
					sourceUrl: cached.sourceUrl,
				});

				this.plugin.settings.changelog.lastVersion = version;
				await this.plugin.saveSettings();
				return;
			}

			view.showLoading(version);
			this.currentVersionDisplayed = version;

			const data = await this.fetchAndPrepareChangelog(isBeta);
			if (!data) {
				view.showError("Failed to load changelog.");
				this.currentVersionDisplayed = null;
				return;
			}

			cacheChangelog(version, isBeta, data, this.plugin.app);
			await view.setContent({
				version,
				markdown: data.markdown,
				sourceUrl: data.sourceUrl,
			});

			this.plugin.settings.changelog.lastVersion = version;
			await this.plugin.saveSettings();
		} catch (error) {
			console.error("[Changelog] Failed to open changelog view:", error);
			const view = this.tryGetExistingView();
			view?.showError("Failed to load changelog.");
			this.currentVersionDisplayed = null;
		}
	}

	private async fetchAndPrepareChangelog(
		isBeta: boolean,
	): Promise<ChangelogFetchResult | null> {
		try {
			const fileName = isBeta ? "CHANGELOG-BETA.md" : "CHANGELOG.md";
			const url = `${CHANGELOG_BASE_URL}/${fileName}`;
			const response = await requestUrl({ url });
			const rawContent = response.text?.trim();

			if (!rawContent) {
				console.warn("[Changelog] Received empty changelog content");
				return null;
			}

			const markdown = this.extractLatestSections(rawContent, isBeta);
			return {
				markdown,
				sourceUrl: url,
			};
		} catch (error) {
			console.error("[Changelog] Failed to fetch changelog:", error);
			return null;
		}
	}

	private extractLatestSections(
		markdown: string,
		isBeta: boolean,
	): string {
		const firstSectionIndex = markdown.search(/^## /m);
		const preamble =
			firstSectionIndex >= 0
				? markdown.slice(0, firstSectionIndex).trim()
				: "";

		const sectionRegex = /^## [\s\S]*?(?=^## |\Z)/gm;
		const sections = markdown.match(sectionRegex) ?? [];
		const latestSections = sections.slice(0, MAX_CHANGELOG_ENTRIES).map(
			(section) => {
				const [heading, ...rest] = section.split("\n");
				const normalizedHeading = this.ensureReleaseLink(
					heading,
					isBeta,
				);
				return [normalizedHeading, ...rest].join("\n");
			},
		);

		const sectionsToRender: string[] = [];
		const trimmedPreamble = preamble.trim();
		if (
			trimmedPreamble &&
			!/^#\s*changelog$/i.test(trimmedPreamble.split("\n")[0] ?? "")
		) {
			sectionsToRender.push(trimmedPreamble);
		}

		const parts = [...sectionsToRender, ...latestSections]
			.filter((part) => part && part.trim().length > 0)
			.map((part) => part.trim());

		return parts.join("\n\n");
	}

	private ensureReleaseLink(headingLine: string, isBeta: boolean): string {
		if (headingLine.includes("](")) {
			return headingLine;
		}

		const match = headingLine.match(/^(##\s+)([^\s(]+)/);
		if (!match) {
			return headingLine;
		}

		const [, prefix, versionWithPotentialSymbols] = match;
		const version = versionWithPotentialSymbols.replace(/^\[|\]$/g, "");
		const releaseUrl = this.buildReleaseUrl(version, isBeta);

		return headingLine.replace(
			/^(##\s+)([^\s(]+)/,
			`${prefix}[${version}](${releaseUrl})`,
		);
	}

	private buildReleaseUrl(version: string, _isBeta: boolean): string {
		const sanitizedVersion = version.replace(/^\[|\]$/g, "");
		return `${RELEASE_BASE_URL}/${sanitizedVersion}`;
	}

	private async getOrCreateView(): Promise<ChangelogView> {
		const { workspace } = this.plugin.app;
		const existingLeaf = workspace.getLeavesOfType(
			CHANGELOG_VIEW_TYPE,
		)[0];

		if (existingLeaf) {
			workspace.revealLeaf(existingLeaf);
			return existingLeaf.view as unknown as ChangelogView;
		}

		const leaf = workspace.getLeaf("tab");
		await leaf.setViewState({ type: CHANGELOG_VIEW_TYPE });
		workspace.revealLeaf(leaf);
		return leaf.view as unknown as ChangelogView;
	}

	private tryGetExistingView(): ChangelogView | null {
		const { workspace } = this.plugin.app;
		const existingLeaf = workspace.getLeavesOfType(
			CHANGELOG_VIEW_TYPE,
		)[0];
		return (existingLeaf?.view as unknown as ChangelogView) || null;
	}
}
