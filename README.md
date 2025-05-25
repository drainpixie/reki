# 🌳 reki**shi** 歴史

a lithe undostack

<!-- ![screenshot](./scrot.png) -->

## 🖥️ use

```sh
$ pnpm add @drainpixie/reki
```

```ts
import {
  Command,
  createStack,
  execute,
  undo,
  redo,
  clear,
  can,
  find,
} from "@drainpixie/reki";

interface Counter {
  value: number;
}

const increment = (amount: number): Command<Counter> => ({
  execute: () => ({ value: state.current.value + amount }),
  undo: () => ({ value: state.current.value - amount }),

  name: `increment @ ${amount}`,
});

const initial = { value: 0 };
let state = createStack<Counter>(initial, { maxStackSize: 10 });

state = execute(state, increment(1));
state = execute(state, increment(2));
state = execute(state, increment(3));

console.log(state.current.value); // -> 6
state = undo(state);

console.log(state.current.value); // -> 3
state = undo(state);

console.log(state.current.value); // -> 1
state = redo(state);
console.log(state.current.value); // -> 3

state = clear(state);
console.log(can.undo(state), can.redo(state), state.current.value); // -> false false 3

// NOTE: We do not handle your value, `clear` only clears the stack[s]
state.current = initial;
```

## 🖥️ dev

```sh
nix develop
pnpm install
```

<details>
  <summary>dependencies for contributors</summary>
  
  ```sh
  cargo install --locked koji
  corepack use pnpm
  ```

</details>
