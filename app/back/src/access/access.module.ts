import { Module } from '@nestjs/common';
import { AccessController } from './access.controller';
import { AccessService } from './access.service';
import { AccessRepository } from './access.repository';
import { UsersModule } from '../users/users.module';
import { EventsModule } from '../events/events.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UsersModule, EventsModule, AuthModule],
  controllers: [AccessController],
  providers: [AccessService, AccessRepository],
})
export class AccessModule {}
