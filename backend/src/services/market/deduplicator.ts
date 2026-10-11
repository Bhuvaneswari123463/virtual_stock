/**
 * In-flight promise coalescing deduplicator
 * Ensures concurrent requests for the exact same ticker/timeframe share a single provider fetch
 */
export class RequestDeduplicator {
  private inFlight = new Map<string, Promise<any>>();

  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = fn().finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, promise);
    return promise;
  }

  async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    return this.execute(key, fn);
  }

  get pendingCount(): number {
    return this.inFlight.size;
  }
}

export const deduplicator = new RequestDeduplicator();
