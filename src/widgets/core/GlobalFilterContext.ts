export interface GlobalFilterState {
	tags?: string[];
	projects?: string[];
	contexts?: string[];
	query?: string;
}

type GlobalFilterListener = (state: GlobalFilterState) => void;

export class GlobalFilterContext {
	private state: GlobalFilterState = {};
	private listeners = new Set<GlobalFilterListener>();

	getState(): GlobalFilterState {
		return this.state;
	}

	setState(patch: Partial<GlobalFilterState>): void {
		this.state = { ...this.state, ...patch };
		for (const listener of this.listeners) {
			listener(this.state);
		}
	}

	subscribe(listener: GlobalFilterListener): () => void {
		this.listeners.add(listener);
		listener(this.state);
		return () => {
			this.listeners.delete(listener);
		};
	}
}

export const globalFilterContext = new GlobalFilterContext();

