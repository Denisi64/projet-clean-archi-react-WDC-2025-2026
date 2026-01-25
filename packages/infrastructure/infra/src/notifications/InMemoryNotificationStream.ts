import {
    NotificationEvent,
    NotificationListener,
    NotificationStream,
} from "@proj/domain/notifications/ports/NotificationStream";

class InMemoryNotificationStream implements NotificationStream {
    private readonly listenersByUser = new Map<string, Set<NotificationListener>>();

    publishToUser(userId: string, event: NotificationEvent): void {
        const listeners = this.listenersByUser.get(userId);
        if (!listeners || listeners.size === 0) return;
        listeners.forEach((listener) => listener(event));
    }

    subscribe(userId: string, listener: NotificationListener): () => void {
        const listeners = this.listenersByUser.get(userId) ?? new Set<NotificationListener>();
        listeners.add(listener);
        this.listenersByUser.set(userId, listeners);

        return () => {
            const current = this.listenersByUser.get(userId);
            if (!current) return;
            current.delete(listener);
            if (current.size === 0) {
                this.listenersByUser.delete(userId);
            }
        };
    }
}

const GLOBAL_KEY = "__AVENIR_NOTIFICATION_STREAM__";

export function createNotificationStream(): NotificationStream {
    const globalRef = globalThis as typeof globalThis & {
        [GLOBAL_KEY]?: InMemoryNotificationStream;
    };
    if (!globalRef[GLOBAL_KEY]) {
        globalRef[GLOBAL_KEY] = new InMemoryNotificationStream();
    }
    return globalRef[GLOBAL_KEY]!;
}

export { InMemoryNotificationStream };
