import { Module } from '@nestjs/common';

import { LeaguesService } from '../leagues/leagues.service';
import { SportsController } from './sports.controller';
import { SportsService } from './sports.service';

@Module({
  controllers: [SportsController],
  providers: [SportsService, LeaguesService],
})
export class SportsModule {}
