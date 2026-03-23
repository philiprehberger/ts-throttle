# @philiprehberger/throttle

[![CI](https://github.com/philiprehberger/ts-throttle/actions/workflows/ci.yml/badge.svg)](https://github.com/philiprehberger/ts-throttle/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@philiprehberger/throttle)](https://www.npmjs.com/package/@philiprehberger/throttle)
[![License](https://img.shields.io/github/license/philiprehberger/ts-throttle)](LICENSE)

Configurable throttle with leading/trailing edge control and AbortSignal support.

## Installation

```bash
npm install @philiprehberger/throttle
```

## Usage

### Basic throttle

```ts
import { throttle } from '@philiprehberger/throttle';

const throttled = throttle(() => {
  console.log('called');
}, 200);

window.addEventListener('scroll', throttled);
```

### Leading and trailing options

```ts
import { throttle } from '@philiprehberger/throttle';

// Only invoke on leading edge (immediate, no trailing call)
const leadingOnly = throttle(handleResize, 300, {
  leading: true,
  trailing: false,
});

// Only invoke on trailing edge (delayed, no immediate call)
const trailingOnly = throttle(saveData, 1000, {
  leading: false,
  trailing: true,
});
```

### AbortSignal

```ts
import { throttle } from '@philiprehberger/throttle';

const controller = new AbortController();

const throttled = throttle(handleInput, 200, {
  signal: controller.signal,
});

// Later: cancel all pending calls and ignore future ones
controller.abort();
```

### Cancel and flush

```ts
import { throttle } from '@philiprehberger/throttle';

const throttled = throttle(saveProgress, 500);

throttled();

// Cancel any pending trailing invocation
throttled.cancel();

// Or force the pending invocation to run immediately
throttled.flush();

// Check if a call is pending
console.log(throttled.pending); // false
```

## API

### `throttle(fn, wait, options?)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `fn` | `(...args: any[]) => any` | The function to throttle |
| `wait` | `number` | Minimum milliseconds between invocations |
| `options` | `ThrottleOptions` | Configuration options |

### `ThrottleOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `leading` | `boolean` | `true` | Invoke on the leading edge |
| `trailing` | `boolean` | `true` | Invoke on the trailing edge |
| `signal` | `AbortSignal` | `undefined` | AbortSignal to auto-cancel |

### `ThrottledFunction`

| Member | Type | Description |
|--------|------|-------------|
| `cancel()` | `() => void` | Cancel pending invocation |
| `flush()` | `() => void` | Execute pending invocation immediately |
| `pending` | `boolean` | Whether an invocation is queued |

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
