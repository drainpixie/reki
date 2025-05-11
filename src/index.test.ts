import assert from "node:assert";
import { test } from "node:test";

import {
	type Command,
	can,
	clear,
	createStack,
	execute,
	redo,
	undo,
} from "./index.js";

test("createStack - should create a new stack with initial state", () => {
	const initialState = { value: 10 };
	const stack = createStack(initialState);

	assert.deepStrictEqual(stack.current, initialState);
	assert.deepStrictEqual(stack.undos, []);
	assert.deepStrictEqual(stack.redos, []);
	assert.deepStrictEqual(stack.options.maxStackSize, 10);
});

test("execute - should execute a command and add it to the undo stack", () => {
	const initialState = { value: 10 };
	let stack = createStack(initialState);

	const command: Command<{ value: number }> = {
		execute: () => ({ value: 20 }),
		undo: () => ({ value: 10 }),
	};

	stack = execute(stack, command);

	assert.deepStrictEqual(stack.current, { value: 20 });
	assert.strictEqual(stack.undos.length, 1);
	assert.strictEqual(stack.redos.length, 0);
	assert.strictEqual(stack.undos[0], command);
});

test("undo - should undo the last command and move it to the redo stack", () => {
	const initialState = { value: 10 };
	let stack = createStack(initialState);

	const command: Command<{ value: number }> = {
		execute: () => ({ value: 20 }),
		undo: () => ({ value: 10 }),
	};

	stack = execute(stack, command);
	stack = undo(stack);

	assert.deepStrictEqual(stack.current, { value: 10 });
	assert.strictEqual(stack.undos.length, 0);
	assert.strictEqual(stack.redos.length, 1);
	assert.strictEqual(stack.redos[0], command);
});

test("redo - should redo a previously undone command", () => {
	const initialState = { value: 10 };
	let stack = createStack(initialState);

	const command: Command<{ value: number }> = {
		execute: () => ({ value: 20 }),
		undo: () => ({ value: 10 }),
	};

	stack = execute(stack, command);
	stack = undo(stack);
	stack = redo(stack);

	assert.deepStrictEqual(stack.current, { value: 20 });
	assert.strictEqual(stack.undos.length, 1);
	assert.strictEqual(stack.redos.length, 0);
	assert.strictEqual(stack.undos[0], command);
});

test("clear - should clear both undo and redo stacks", () => {
	const initialState = { value: 10 };
	let stack = createStack(initialState);

	const command: Command<{ value: number }> = {
		execute: () => ({ value: 20 }),
		undo: () => ({ value: 10 }),
	};

	stack = execute(stack, command);
	stack = undo(stack);
	stack = clear(stack);

	assert.deepStrictEqual(stack.current, { value: 10 });
	assert.strictEqual(stack.undos.length, 0);
	assert.strictEqual(stack.redos.length, 0);
});

test("can.undo - should check if undo is possible", () => {
	const initialState = { value: 10 };
	let stack = createStack(initialState);

	assert.strictEqual(can.undo(stack), false);

	const command: Command<{ value: number }> = {
		execute: () => ({ value: 20 }),
		undo: () => ({ value: 10 }),
	};

	stack = execute(stack, command);
	assert.strictEqual(can.undo(stack), true);

	stack = undo(stack);
	assert.strictEqual(can.undo(stack), false);
});

test("can.redo - should check if redo is possible", () => {
	const initialState = { value: 10 };
	let stack = createStack(initialState);

	assert.strictEqual(can.redo(stack), false);

	const command: Command<{ value: number }> = {
		execute: () => ({ value: 20 }),
		undo: () => ({ value: 10 }),
	};

	stack = execute(stack, command);
	assert.strictEqual(can.redo(stack), false);

	stack = undo(stack);
	assert.strictEqual(can.redo(stack), true);

	stack = redo(stack);
	assert.strictEqual(can.redo(stack), false);
});

test("options - should respect custom options", () => {
	const initialState = { value: 10 };
	const stack = createStack(initialState, { maxStackSize: 5 });

	assert.strictEqual(stack.options.maxStackSize, 5);
});

test("maxStackSize - should limit the size of the undo and redo stacks", () => {
	const initialState = { value: 0 };
	let stack = createStack(initialState, { maxStackSize: 3 });

	for (let i = 1; i <= 4; i++) {
		const value = i;
		const command: Command<{ value: number }> = {
			execute: () => ({ value }),
			undo: () => ({ value: value - 1 }),
		};
		stack = execute(stack, command);
	}

	assert.strictEqual(stack.undos.length, 3);
	assert.deepStrictEqual(stack.current, { value: 4 });

	for (let i = 0; i < 3; i++) {
		stack = undo(stack);
	}

	assert.strictEqual(stack.redos.length, 3);
	assert.deepStrictEqual(stack.current, { value: 1 });

	for (let i = 0; i < 3; i++) {
		stack = redo(stack);
	}

	const newCommand: Command<{ value: number }> = {
		execute: () => ({ value: 10 }),
		undo: () => ({ value: 4 }),
	};
	stack = execute(stack, newCommand);

	assert.strictEqual(stack.undos.length, 3);
	assert.deepStrictEqual(stack.current, { value: 10 });
});
