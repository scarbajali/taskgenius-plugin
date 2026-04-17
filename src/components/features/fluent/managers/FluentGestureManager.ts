import { Component, Platform } from "obsidian";

/**
 * FluentGestureManager - Manages mobile touch gestures
 *
 * Responsibilities:
 * - Edge swipe to open drawer (from left edge)
 * - Swipe left to close drawer (when open)
 * - Touch event handling with vertical scroll detection
 */
export class FluentGestureManager extends Component {
	// Touch gesture tracking
	private touchStartX = 0;
	private touchStartY = 0;
	private touchCurrentX = 0;
	private isSwiping = false;
	private swipeThreshold = 50;

	// Callbacks
	private onOpenDrawer?: () => void;
	private onCloseDrawer?: () => void;
	private getIsMobileDrawerOpen?: () => boolean;

	constructor(private rootContainerEl: HTMLElement) {
		super();
	}

	/**
	 * Set drawer callbacks
	 */
	setDrawerCallbacks(callbacks: {
		onOpenDrawer: () => void;
		onCloseDrawer: () => void;
		getIsMobileDrawerOpen: () => boolean;
	}): void {
		this.onOpenDrawer = callbacks.onOpenDrawer;
		this.onCloseDrawer = callbacks.onCloseDrawer;
		this.getIsMobileDrawerOpen = callbacks.getIsMobileDrawerOpen;
	}

	/**
	 * Initialize mobile swipe gestures for drawer
	 */
	initializeMobileSwipeGestures(): void {
		if (!Platform.isPhone) return;

		// Edge swipe to open drawer
		this.registerDomEvent(document, "touchstart", (e: TouchEvent) => {
			const isMobileDrawerOpen = this.getIsMobileDrawerOpen?.() ?? false;

			if (isMobileDrawerOpen) {
				// Track for swipe-to-close when drawer is open
				const touch = e.touches[0];
				this.touchStartX = touch.clientX;
				this.touchStartY = touch.clientY;
				this.isSwiping = true;
			} else {
				// Check if touch started from left edge
				const touch = e.touches[0];
				if (touch.clientX < 20) {
					// 20px edge detection zone
					this.touchStartX = touch.clientX;
					this.touchStartY = touch.clientY;
					this.isSwiping = true;
				}
			}
		});

		this.registerDomEvent(document, "touchmove", (e: TouchEvent) => {
			if (!this.isSwiping) return;

			const touch = e.touches[0];
			this.touchCurrentX = touch.clientX;
			const deltaX = this.touchCurrentX - this.touchStartX;
			const deltaY = Math.abs(touch.clientY - this.touchStartY);

			// Check if horizontal swipe (not vertical scroll)
			if (deltaY > 50) {
				this.isSwiping = false;
				return;
			}

			const isMobileDrawerOpen = this.getIsMobileDrawerOpen?.() ?? false;

			if (!isMobileDrawerOpen && deltaX > this.swipeThreshold) {
				// Swipe right from edge - open drawer
				this.onOpenDrawer?.();
				this.isSwiping = false;
			} else if (isMobileDrawerOpen && deltaX < -this.swipeThreshold) {
				// Swipe left when drawer is open - close it
				const sidebarEl = this.rootContainerEl?.querySelector(
					".tg-fluent-sidebar-container"
				);
				if (sidebarEl) {
					const sidebarRect = sidebarEl.getBoundingClientRect();
					// Only close if swipe started on the sidebar
					if (this.touchStartX < sidebarRect.right) {
						this.onCloseDrawer?.();
						this.isSwiping = false;
					}
				}
			}
		});

		this.registerDomEvent(document, "touchend", () => {
			this.isSwiping = false;
			this.touchStartX = 0;
			this.touchCurrentX = 0;
		});

		this.registerDomEvent(document, "touchcancel", () => {
			this.isSwiping = false;
			this.touchStartX = 0;
			this.touchCurrentX = 0;
		});
	}

	/**
	 * Clean up on unload
	 */
	onunload(): void {
		// Event listeners will be cleaned up by Component lifecycle
		super.onunload();
	}
}
