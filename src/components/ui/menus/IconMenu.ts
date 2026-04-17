import { debounce, getIconIds, Notice, setIcon } from "obsidian";

import { ButtonComponent } from "obsidian";
import TaskProgressBarPlugin from "@/index";

export const attachIconMenu = (
	btn: ButtonComponent,
	params: {
		containerEl: HTMLElement;
		plugin: TaskProgressBarPlugin;
		onIconSelected: (iconId: string) => void;
	}
) => {
	let menuRef: HTMLDivElement | null = null;
	const btnEl = btn.buttonEl;
	const win = params.containerEl.win;

	let availableIcons: string[] = [];
	try {
		if (typeof getIconIds === "function") {
			availableIcons = getIconIds();
		} else {
			console.warn("Task Genius: getIconIds() not available.");
		}
	} catch (e) {
		console.error("Task Genius: Error calling getIconIds():", e);
	}

	const showMenu = () => {
		console.log("showMenu", availableIcons.length);
		if (!availableIcons.length) {
			new Notice("Icon list unavailable.");
			return;
		}

		menuRef = params.containerEl.createDiv("tg-icon-menu bm-menu");
		const scrollParent =
			btnEl.closest(".vertical-tab-content") || params.containerEl;

		let iconEls: Record<string, HTMLDivElement> = {};
		const searchInput = menuRef.createEl("input", {
			attr: { type: "text", placeholder: "Search icons..." },
			cls: "tg-menu-search",
		});
		win.setTimeout(() => searchInput.focus(), 50);

		const searchInputClickHandler = () => {
			setTimeout(() => {
				searchInput.focus();
			}, 400);
		};

		const searchInputBlurHandler = () => {
			searchInput.focus();
		};

		const iconList = menuRef.createDiv("tg-menu-icons");

		const ICONS_PER_BATCH = 100;
		let currentBatch = 0;
		let isSearchActive = false;

		const renderIcons = (iconsToRender: string[], resetBatch = true) => {
			if (resetBatch) {
				iconList.empty();
				iconEls = {};
				currentBatch = 0;
			}

			if (!iconsToRender.length && currentBatch === 0) {
				iconList.empty();
				iconList.createEl("p", {
					text: "No matching icons found.",
				});
				return;
			}

			const startIdx = isSearchActive
				? 0
				: currentBatch * ICONS_PER_BATCH;
			const endIdx = isSearchActive
				? iconsToRender.length
				: Math.min(
						(currentBatch + 1) * ICONS_PER_BATCH,
						iconsToRender.length
				  );

			if (startIdx >= endIdx && !isSearchActive) return; // Already loaded all available icons

			const iconsToShow = iconsToRender.slice(startIdx, endIdx);

			iconsToShow.forEach((iconId) => {
				const iconEl = iconList.createDiv({
					cls: "clickable-icon",
					attr: { "data-icon": iconId, "aria-label": iconId },
				});
				iconEls[iconId] = iconEl;
				setIcon(iconEl, iconId);
				iconEl.addEventListener("click", () => {
					params.onIconSelected(iconId);
					destroyMenu();
				});
			});
			if (!isSearchActive) {
				currentBatch++;
			}
			win.setTimeout(calcMenuPos, 0);
		};

		const iconListScrollHandler = () => {
			const { scrollTop, scrollHeight, clientHeight } = iconList;

			if (isSearchActive) return;

			if (scrollHeight - scrollTop - clientHeight < 50) {
				// console.log("Near bottom detected");
				if (currentBatch * ICONS_PER_BATCH < availableIcons.length) {
					renderIcons(availableIcons, false);
				} else {
					// console.log("No more icons to lazy load.");
				}
			}
		};

		const destroyMenu = () => {
			if (menuRef) {
				menuRef.remove();
				menuRef = null;
			}
			win.removeEventListener("click", clickOutside);
			scrollParent?.removeEventListener("scroll", scrollHandler);
			iconList.removeEventListener("scroll", iconListScrollHandler);
			searchInput.removeEventListener("click", searchInputClickHandler);
			searchInput.removeEventListener("blur", searchInputBlurHandler);
		};

		const clickOutside = (e: MouseEvent) => {
			// Don't close the menu if clicking on the search input
			if (menuRef && !menuRef.contains(e.target as Node)) {
				destroyMenu();
			}
		};

		const handleSearch = debounce(
			() => {
				const query = searchInput.value.toLowerCase().trim();
				if (!query) {
					isSearchActive = false;
					renderIcons(availableIcons);
				} else {
					isSearchActive = true;
					const results = availableIcons.filter((iconId) =>
						iconId.toLowerCase().includes(query)
					);
					renderIcons(results);
				}
			},
			250,
			true
		);

		const calcMenuPos = () => {
			if (!menuRef) return;
			const rect = btnEl.getBoundingClientRect();
			const menuHeight = menuRef.offsetHeight;
			const menuWidth = menuRef.offsetWidth; // Get menu width
			const viewportWidth = win.innerWidth;
			const viewportHeight = win.innerHeight;

			let top = rect.bottom + 2; // Position below the button (viewport coordinates)
			let left = rect.left; // Position aligned with button left (viewport coordinates)

			// Check if menu goes off bottom edge
			if (top + menuHeight > viewportHeight - 20) {
				top = rect.top - menuHeight - 2; // Position above the button
			}

			// Check if menu goes off top edge (e.g., after being positioned above)
			if (top < 0) {
				top = 5; // Place near top edge if it overflows both top and bottom
			}

			// Check if menu goes off right edge
			if (left + menuWidth > viewportWidth - 20) {
				left = rect.right - menuWidth; // Align right edge of menu with right edge of button
				// Adjust if button itself is wider than menu allows sticking right
				if (left < 0) {
					left = 5; // Place near left edge as fallback
				}
			}

			// Check if menu goes off left edge
			if (left < 0) {
				left = 5; // Place near left edge
			}

			// Use fixed positioning as the element is appended to body
			menuRef.style.position = "fixed";
			menuRef.style.top = `${top}px`;
			menuRef.style.left = `${left}px`;
		};

		const scrollHandler = () => {
			if (menuRef) {
				destroyMenu();
			} else {
				destroyMenu();
			}
		};

		// Prevent the search input from losing focus when clicked
		searchInput.addEventListener("click", searchInputClickHandler);
		searchInput.addEventListener("blur", searchInputBlurHandler);

		iconList.addEventListener("scroll", iconListScrollHandler);

		renderIcons(availableIcons);

		searchInput.addEventListener("input", handleSearch);

		document.body.appendChild(menuRef);
		calcMenuPos();

		win.setTimeout(() => {
			win.addEventListener("click", clickOutside);
			scrollParent?.addEventListener("scroll", scrollHandler);
		}, 10);
	};

	btn.onClick(() => {
		if (menuRef) {
			// Let clickOutside handle closing
		} else {
			showMenu();
		}
	});
};
