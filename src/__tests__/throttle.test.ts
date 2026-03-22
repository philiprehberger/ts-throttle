import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { throttle } from '../../dist/index.js';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

describe('throttle', () => {
  it('should call function at most once per wait period', async () => {
    let callCount = 0;
    const throttled = throttle(() => { callCount++; }, 100);

    throttled();
    throttled();
    throttled();

    assert.equal(callCount, 1);

    await sleep(150);

    assert.equal(callCount, 2);
  });

  it('should invoke immediately on first call (leading edge default)', () => {
    let callCount = 0;
    const throttled = throttle(() => { callCount++; }, 100);

    throttled();
    assert.equal(callCount, 1);
  });

  it('should invoke after wait period with most recent args (trailing edge)', async () => {
    const args: number[] = [];
    const throttled = throttle((n: number) => { args.push(n); }, 100);

    throttled(1);
    throttled(2);
    throttled(3);

    assert.deepEqual(args, [1]);

    await sleep(150);

    assert.deepEqual(args, [1, 3]);
  });

  it('should not invoke immediately when leading is false', async () => {
    let callCount = 0;
    const throttled = throttle(() => { callCount++; }, 100, { leading: false });

    throttled();
    assert.equal(callCount, 0);

    await sleep(150);

    assert.equal(callCount, 1);
  });

  it('should not invoke after wait when trailing is false', async () => {
    let callCount = 0;
    const throttled = throttle(() => { callCount++; }, 100, { trailing: false });

    throttled();
    throttled();
    throttled();

    assert.equal(callCount, 1);

    await sleep(150);

    assert.equal(callCount, 1);
  });

  it('should never invoke when both leading and trailing are false', async () => {
    let callCount = 0;
    const throttled = throttle(() => { callCount++; }, 100, { leading: false, trailing: false });

    throttled();
    throttled();

    assert.equal(callCount, 0);

    await sleep(150);

    assert.equal(callCount, 0);
  });

  it('should clear pending invocation on cancel()', async () => {
    let callCount = 0;
    const throttled = throttle(() => { callCount++; }, 100);

    throttled();
    throttled();
    assert.equal(callCount, 1);

    throttled.cancel();

    await sleep(150);

    assert.equal(callCount, 1);
  });

  it('should execute pending invocation immediately on flush()', () => {
    const args: number[] = [];
    const throttled = throttle((n: number) => { args.push(n); }, 100);

    throttled(1);
    throttled(2);

    assert.deepEqual(args, [1]);

    throttled.flush();

    assert.deepEqual(args, [1, 2]);
  });

  it('should report pending as true when call is queued', async () => {
    const throttled = throttle(() => {}, 100);

    assert.equal(throttled.pending, false);

    throttled();
    throttled();

    assert.equal(throttled.pending, true);

    await sleep(150);

    assert.equal(throttled.pending, false);
  });

  it('should cancel when AbortSignal is aborted', async () => {
    let callCount = 0;
    const controller = new AbortController();
    const throttled = throttle(() => { callCount++; }, 100, { signal: controller.signal });

    throttled();
    assert.equal(callCount, 1);

    throttled();
    controller.abort();

    await sleep(150);

    assert.equal(callCount, 1);

    throttled();
    assert.equal(callCount, 1);
  });

  it('should forward latest args for trailing call', async () => {
    const received: string[] = [];
    const throttled = throttle((a: string, b: string) => { received.push(`${a}-${b}`); }, 100);

    throttled('a', '1');
    throttled('b', '2');
    throttled('c', '3');

    assert.deepEqual(received, ['a-1']);

    await sleep(150);

    assert.deepEqual(received, ['a-1', 'c-3']);
  });

  it('should only execute first (leading) and last (trailing) on rapid calls', async () => {
    let callCount = 0;
    const throttled = throttle(() => { callCount++; }, 100);

    for (let i = 0; i < 20; i++) {
      throttled();
    }

    assert.equal(callCount, 1);

    await sleep(150);

    assert.equal(callCount, 2);
  });

  it('should preserve this context', async () => {
    const obj = {
      value: 42,
      captured: undefined as number | undefined,
      run: throttle(function (this: { value: number; captured: number | undefined }) {
        this.captured = this.value;
      }, 100),
    };

    obj.run();
    assert.equal(obj.captured, 42);
  });
});
