import { Controller, Get } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';
import { DateTime } from 'luxon';

@Controller()
export class HealthController {
  @Get('/')
  @HealthCheck()
  public index(): string {
    return DateTime.now().toSQL();
  }
}
