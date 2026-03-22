import type { ThrottleOptions, ThrottledFunction } from './types';

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options: ThrottleOptions = {},
): ThrottledFunction<T> {
  const { leading = true, trailing = true, signal } = options;

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: unknown;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let isPending = false;

  function invoke(time: number): void {
    lastInvokeTime = time;
    const args = lastArgs!;
    const thisArg = lastThis;
    lastArgs = undefined;
    lastThis = undefined;
    isPending = false;
    fn.apply(thisArg, args);
  }

  function startTimer(pendingFn: () => void, wait: number): void {
    timeoutId = setTimeout(pendingFn, wait);
  }

  function remainingWait(time: number): number {
    const elapsed = time - (lastCallTime ?? 0);
    return Math.max(0, wait - elapsed);
  }

  function shouldInvoke(time: number): boolean {
    if (lastCallTime === undefined) return true;
    const elapsed = time - lastCallTime;
    return elapsed >= wait || elapsed < 0;
  }

  function trailingEdge(): void {
    timeoutId = undefined;
    if (trailing && lastArgs) {
      invoke(Date.now());
    } else {
      lastArgs = undefined;
      lastThis = undefined;
      isPending = false;
    }
  }

  function timerExpired(): void {
    const time = Date.now();
    if (shouldInvoke(time)) {
      trailingEdge();
      return;
    }
    startTimer(timerExpired, remainingWait(time));
  }

  function leadingEdge(time: number): void {
    lastInvokeTime = time;
    startTimer(timerExpired, wait);
    if (leading) {
      invoke(time);
    }
  }

  function cancel(): void {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    lastArgs = undefined;
    lastThis = undefined;
    lastCallTime = undefined;
    lastInvokeTime = 0;
    timeoutId = undefined;
    isPending = false;
  }

  function flush(): void {
    if (timeoutId === undefined) return;
    clearTimeout(timeoutId);
    trailingEdge();
  }

  function throttled(this: unknown, ...args: Parameters<T>): void {
    if (signal?.aborted) return;

    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;
    isPending = true;

    if (isInvoking) {
      if (timeoutId === undefined) {
        leadingEdge(time);
        return;
      }
    }

    if (timeoutId === undefined && trailing) {
      startTimer(timerExpired, wait);
    }
  }

  if (signal) {
    signal.addEventListener('abort', cancel, { once: true });
  }

  Object.defineProperty(throttled, 'pending', {
    get: () => isPending,
  });

  throttled.cancel = cancel;
  throttled.flush = flush;

  return throttled as ThrottledFunction<T>;
}
