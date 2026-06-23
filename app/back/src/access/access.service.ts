import { Injectable } from '@nestjs/common';
import { Result } from '../generated/prisma';
import { AccessRepository } from './access.repository';
import { UsersRepository } from '../users/users.repository';
import { EventsService } from '../events/events.service';
import { CreateAccessDto } from './dto/create-access.dto';

@Injectable()
export class AccessService {
  constructor(
    private readonly accessRepository: AccessRepository,
    private readonly usersRepository: UsersRepository,
    private readonly eventsService: EventsService,
  ) {}

  async validate(dto: CreateAccessDto) {
    const user = await this.usersRepository.findByUid(dto.uid);

    const granted = !!user && user.active;
    const result: Result = granted ? Result.ACCESS_GRANTED : Result.ACCESS_DENIED;
    const description = granted
      ? `Access granted to ${user!.name}`
      : user
        ? `User ${user.name} is inactive`
        : `Unknown UID: ${dto.uid}`;

    const log = await this.accessRepository.logAccess(dto.uid, result, description, user?.id);

    this.eventsService.emit({
      uid: dto.uid,
      granted,
      description,
      timestamp: log.timestamp.toISOString(),
      userName: user?.name,
    });

    return { granted, log };
  }

  async getLogs(from?: Date, to?: Date) {
    return this.accessRepository.findAll(from, to);
  }
}
