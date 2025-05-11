/**
 * Represents a command that can be executed and undone.
 * @template T The type of value returned by the command operations.
 */
export interface Command<T = unknown> {
	/**
	 * Optional name to identify the command.
	 */
	name?: string;
  
	/**
	 * Reverses the effect of the command.
	 * @returns The value after undoing the command.
	 */
	undo: () => T;
  
	/**
	 * Performs the command operation.
	 * @returns The value after executing the command.
	 */
	execute: () => T;
  }
  
  /**
   * Represents the current state of the command stack.
   * @template T The type of the current value being managed.
   */
  export interface State<T = unknown> {
	/**
	 * The current value being managed.
	 */
	current: T;
  
	/**
	 * Configuration options for the command stack.
	 */
	options: Options;
  
	/**
	 * Stack of commands that can be undone.
	 */
	undos: Command<T>[];
  
	/**
	 * Stack of commands that can be redone.
	 */
	redos: Command<T>[];
  }
  
  /**
   * Configuration options for the command stack.
   */
  export interface Options {
	/**
	 * Maximum number of commands to keep in the stack.
	 * When exceeded, the oldest commands are removed.
	 */
	maxStackSize?: number;
  }
  
  /**
   * Creates a new command stack with an initial value.
   * @template T The type of the value being managed.
   * @param {T} initial The initial value.
   * @param {Options} [options={}] Configuration options for the stack.
   * @returns {State<T>} A new state object with the initial value and empty command stacks.
   */
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
  
  /**
   * Executes a command and adds it to the undo stack.
   * Clears the redo stack as a new execution path is created.
   * 
   * @template T The type of the value being managed.
   * @param {State<T>} state The current state.
   * @param {Command<T>} command The command to execute.
   * @returns {State<T>} The new state after executing the command.
   */
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
  
  /**
   * Undoes the most recent command and moves it to the redo stack.
   * 
   * @template T The type of the value being managed.
   * @param {State<T>} state The current state.
   * @returns {State<T>} The new state after undoing the command, or the unchanged state if no commands can be undone.
   */
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
  
  /**
   * Redoes a previously undone command and moves it back to the undo stack.
   * 
   * @template T The type of the value being managed.
   * @param {State<T>} state The current state.
   * @returns {State<T>} The new state after redoing the command, or the unchanged state if no commands can be redone.
   */
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
  
  /**
   * Clears all undo and redo history while maintaining the current value.
   * 
   * @template T The type of the value being managed.
   * @param {State<T>} state The current state.
   * @returns {State<T>} A new state with empty undo and redo stacks.
   */
  export const clear = <T = unknown>(state: State<T>): State<T> => ({
	current: state.current,
	options: state.options,
	undos: [],
	redos: [],
  });
  
  /**
   * Utility object with methods to check if undo/redo operations are available.
   */
  export const can = {
	/**
	 * Checks if an undo operation is available.
	 * @param {State} state The current state.
	 * @returns {boolean} True if there are commands that can be undone.
	 */
	undo: (state: State) => state.undos.length > 0,
	
	/**
	 * Checks if a redo operation is available.
	 * @param {State} state The current state.
	 * @returns {boolean} True if there are commands that can be redone.
	 */
	redo: (state: State) => state.redos.length > 0,
  } as const;