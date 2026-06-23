import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface AccessEvent {
  uid: string;
  granted: boolean;
  description: string;
  timestamp: string;
  userName?: string;
}

@Injectable()
export class EventsService {
  private readonly stream$ = new Subject<AccessEvent>();

  emit(event: AccessEvent) {
    this.stream$.next(event);
  }

  observe() {
    return this.stream$.asObservable();
  }
}
