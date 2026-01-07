import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";

// Gateway simple sur le namespace par défaut (root), path par défaut "/socket.io"
@WebSocketGateway({ cors: { origin: "*" } })
export class NotificationsGateway {
    @WebSocketServer()
    server!: Server;

    broadcastSavingsRateChange(payload: { ratePercent: number; userIds?: string[] }) {
        this.server.emit("savings-rate-updated", payload);
    }

    broadcastActionStockChange(payload: { actionId: string; symbol: string; availableStock: string; isAvailable: boolean }) {
        this.server.emit("action-stock-updated", payload);
    }
}
