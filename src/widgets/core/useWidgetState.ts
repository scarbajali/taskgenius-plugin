import { BaseWidgetView } from "./BaseWidgetView";

export function useWidgetState<
	TState extends Record<string, unknown> & { linked?: boolean },
>(view: BaseWidgetView<TState>): {
	get: () => TState;
	set: (patch: Partial<TState>) => void;
} {
	return {
		get: () => view.getState(),
		set: (patch) => view.updateWidgetState(patch),
	};
}
