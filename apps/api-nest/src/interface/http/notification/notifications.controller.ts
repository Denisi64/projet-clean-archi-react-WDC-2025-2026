import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

@Controller('notifications')
export class NotificationsController {
    private readonly stream$ = new Subject<MessageEvent>();

    @Sse('stream')
    stream(): Observable<MessageEvent> {
        return this.stream$.asObservable();
    }

    push(event: any) {
        this.stream$.next({ data: event });
    }
}
