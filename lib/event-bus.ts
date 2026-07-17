import type { LiveUpdatePayload } from "@/types";

type SSEListener = (payload: LiveUpdatePayload) => void;

class EventBus {
  private listeners = new Set<SSEListener>();

  subscribe(listener: SSEListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(payload: LiveUpdatePayload): void {
    for (const listener of this.listeners) {
      try {
        listener(payload);
      } catch {
        // Ignore listener errors
      }
    }
  }

  get listenerCount(): number {
    return this.listeners.size;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var pingTrackerEventBus: EventBus | undefined;
}

export const eventBus: EventBus =
  global.pingTrackerEventBus ?? new EventBus();

if (!global.pingTrackerEventBus) {
  global.pingTrackerEventBus = eventBus;
}
