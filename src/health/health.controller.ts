import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck } from '@nestjs/terminus';
import { DateTime } from 'luxon';

@ApiTags('health')
@Controller()
export class HealthController {
  @Get('/')
  @HealthCheck()
  public index(): string {
    return DateTime.now().toSQL();
  }
}
