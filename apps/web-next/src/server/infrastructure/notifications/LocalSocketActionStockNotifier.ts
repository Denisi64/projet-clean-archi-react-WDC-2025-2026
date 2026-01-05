import { ActionStockNotifier, ActionStockPayload } from "@proj/application/actions/ports/ActionStockNotifier";

export class LocalSocketActionStockNotifier implements ActionStockNotifier {
    async notifyActionStockChanged(payload: ActionStockPayload): Promise<void> {
        const wsUrl = process.env.NOTIFICATIONS_WS_URL || "http://localhost:4001";
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 1000);
            await fetch(`${wsUrl}/broadcast-actions`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal,
            }).catch(() => {});
            clearTimeout(timer);
        } catch {
            /* ignore */
        }
    }
}
