import { Controller, Sse } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Sse()
  stream() {
    return this.eventsService.observe().pipe(map((event) => ({ data: event })));
  }
}
