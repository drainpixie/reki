export interface Command<T = unknown> {
	name?: string;

	undo: () => T;
	execute: () => T;
}

export interface State<T = unknown> {
	current: T;
	options: Options;

	undos: Command<T>[];
	redos: Command<T>[];
}

export interface Options {
	maxStackSize?: number;
}

export const createStack = <T = unknown>(
	initial: T,
	options: Options = {},
): State<T> => ({
	options: {
		maxStackSize: 10,
		...options,
	},
	current: initial,
	undos: [],
	redos: [],
});

export function execute<T = unknown>(
	state: State<T>,
	command: Command<T>,
): State<T> {
	const current = command.execute();
	const stack = [...state.undos, command];

	if (state.options.maxStackSize && stack.length > state.options.maxStackSize) {
		stack.shift();
	}

	return {
		...state,
		current,
		undos: stack,
		redos: [],
	};
}

export function undo<T = unknown>(state: State<T>): State<T> {
	if (state.undos.length === 0) return state;

	const command = state.undos.pop();
	if (!command) {
		return state;
	}

	const current = command.undo();
	const stack = [...state.redos, command];

	if (state.options.maxStackSize && stack.length > state.options.maxStackSize) {
		stack.shift();
	}

	return {
		...state,
		current,
		undos: state.undos,
		redos: stack,
	};
}

export function redo<T = unknown>(state: State<T>): State<T> {
	if (state.redos.length === 0) return state;

	const command = state.redos.pop();
	if (!command) {
		return state;
	}

	const current = command.execute();
	const stack = [...state.undos, command];

	if (state.options.maxStackSize && stack.length > state.options.maxStackSize) {
		stack.shift();
	}

	return {
		...state,
		current,
		undos: stack,
		redos: state.redos,
	};
}

export const clear = <T = unknown>(state: State<T>): State<T> => ({
	current: state.current,
	options: state.options,
	undos: [],
	redos: [],
});

export const can = {
	undo: (state: State) => state.undos.length > 0,
	redo: (state: State) => state.redos.length > 0,
} as const;
