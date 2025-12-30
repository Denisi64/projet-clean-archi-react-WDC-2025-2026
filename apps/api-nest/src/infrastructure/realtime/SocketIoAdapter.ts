import { INestApplication, IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

export class SocketIoAdapter extends IoAdapter {
    constructor(private app: INestApplication) {
        super(app);
    }

    create(port: number, options?: ServerOptions & { namespace?: string }) {
        const server = super.create(port, {
            cors: {
                origin: true,
                credentials: true,
            },
            ...options,
        });

        return server;
    }
}
