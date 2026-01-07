import { ActionStockNotifier, ActionStockPayload } from "@proj/application/actions/ports/ActionStockNotifier";
import { NotificationsGateway } from "../../interface/websocket/notifications.gateway";

export class SocketActionStockNotifier implements ActionStockNotifier {
    constructor(private readonly gateway: NotificationsGateway) {}

    async notifyActionStockChanged(payload: ActionStockPayload): Promise<void> {
        this.gateway.broadcastActionStockChange(payload);

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
