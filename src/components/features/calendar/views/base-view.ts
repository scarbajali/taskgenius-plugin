/**
 * @deprecated This file is deprecated. Use @taskgenius/calendar's BaseView instead.
 *
 * For new calendar views, extend BaseView from @taskgenius/calendar:
 *
 * ```typescript
 * import { BaseView, type ViewMeta } from "@taskgenius/calendar";
 *
 * class MyView extends BaseView {
 *   static meta: ViewMeta = { type: "my-view", label: "My View", order: 50 };
 *   render(container: HTMLElement, events: CalendarEvent[]): void { ... }
 * }
 * ```
 *
 * @see {@link ./tg-agenda-view.ts} for an example of the new pattern
 * @see {@link ./tg-year-view.ts} for another example
 */
import { App, Component } from "obsidian";
import { CalendarEvent } from "@/components/features/calendar/index";
import TaskProgressBarPlugin from "@/index";

/**
 * @deprecated Use @taskgenius/calendar's BaseView instead.
 */
interface EventMap {
	onEventClick: (ev: MouseEvent, event: CalendarEvent) => void;
	onEventHover: (ev: MouseEvent, event: CalendarEvent) => void;
	onDayClick: (
		ev: MouseEvent,
		day: number,
		options: {
			behavior: "open-quick-capture" | "open-task-view";
		},
	) => void;
	onDayHover: (ev: MouseEvent, day: number) => void;
	onMonthClick: (ev: MouseEvent, month: number) => void;
	onMonthHover: (ev: MouseEvent, month: number) => void;
	onYearClick: (ev: MouseEvent, year: number) => void;
	onYearHover: (ev: MouseEvent, year: number) => void;
	onEventContextMenu: (ev: MouseEvent, event: CalendarEvent) => void;
	onEventComplete: (ev: MouseEvent, event: CalendarEvent) => void;
}

/**
 * @deprecated Use @taskgenius/calendar's BaseView options instead.
 */
// Combine event handlers into a single options object, making them optional
export interface CalendarViewOptions extends Partial<EventMap> {
	// Add other common view options here if needed
	getBadgeEventsForDate?: (date: Date) => CalendarEvent[];
}

/**
 * @deprecated Use @taskgenius/calendar's BaseView instead.
 * This class extends Obsidian's Component for lifecycle management.
 * The new BaseView from @taskgenius/calendar provides unified view management.
 */
export abstract class CalendarViewComponent extends Component {
	protected containerEl: HTMLElement;
	protected events: CalendarEvent[];
	protected options: CalendarViewOptions;

	constructor(
		plugin: TaskProgressBarPlugin,
		app: App,
		containerEl: HTMLElement,
		events: CalendarEvent[],
		options: CalendarViewOptions = {}, // Provide default empty options
	) {
		super(); // Call the base class constructor
		this.containerEl = containerEl;
		this.events = events;
		this.options = options;
	}

	// Abstract method for rendering the specific view content
	// Subclasses (MonthView, WeekView, DayView) must implement this
	abstract render(): void;

	// Example common method (can be implemented here or left abstract)
	protected handleEventClick(ev: MouseEvent, event: CalendarEvent): void {
		if (this.options.onEventClick) {
			this.options.onEventClick(ev, event);
		}
	}

	// Lifecycle methods from Component might be overridden here or in subclasses
	onload(): void {
		super.onload();
		this.render(); // Initial render on load
	}

	onunload(): void {
		// Clean up resources, remove event listeners, etc.
		this.containerEl.empty();
		super.onunload();
	}
}
