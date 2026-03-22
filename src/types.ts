export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
  signal?: AbortSignal;
}

export interface ThrottledFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel(): void;
  flush(): void;
  readonly pending: boolean;
}
