import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AccessService } from './access.service';
import { CreateAccessDto } from './dto/create-access.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('access')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  // La Pico W llama este endpoint sin JWT
  @Post()
  validate(@Body() dto: CreateAccessDto) {
    return this.accessService.validate(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('logs')
  getLogs(
    @Query('from') from?: string,
    @Query('to')   to?:   string,
  ) {
    return this.accessService.getLogs(
      from ? new Date(from) : undefined,
      to   ? new Date(to)   : undefined,
    );
  }
}
