class SlidingWindowCounter {
  constructor(windowMs) {
    this.windowMs = windowMs;
    this.store = new Map();
  }

  increment(key, now = Date.now()) {
    const queue = this.store.get(key) || [];

    queue.push(now);
    this.store.set(key, queue);
    this.prune(key, now);

    return this.store.get(key).length;
  }

  prune(key, now = Date.now()) {
    const queue = this.store.get(key) || [];
    const next = queue.filter((timestamp) => now - timestamp <= this.windowMs);

    if (next.length) {
      this.store.set(key, next);
      return next;
    }

    this.store.delete(key);
    return [];
  }

  getCount(key, now = Date.now()) {
    return this.prune(key, now).length;
  }
}

class MonitorCache {
  constructor() {
    this.addressActivity = new SlidingWindowCounter(60 * 1000);
    this.programActivity = new SlidingWindowCounter(60 * 1000);
    this.poolReserves = new Map();
    this.mintAuthorityCache = new Map();
  }
}

module.exports = {
  MonitorCache,
};
